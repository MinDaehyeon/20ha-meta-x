"""
챌린지 인증글 크롤러 (사고력 영작 / 독서챌린지 / 수학독해 챌린지)
- 20HA 네이버 카페 게시판과 동일한 JSON API 사용 (쿠키/로그인 불필요)
- 게시판 menu id는 challenges.naver_board_id 에서 읽음 (관리자가 나중에 등록)
- 학생 아이디와 연계하지 않음 — 글 수집 + 선생님 확인 체크용
- 이미 수집된 URL 은 스킵 (challenge_posts.checked 등 기존 상태 보존)

환경변수:
  CHALLENGE_KEY                 크롤링할 챌린지 key (예: sagoyeong)
  NAVER_CAFE_ID                 카페 club id (기본 31045190 = 20HA 카페)
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  CRAWL_DAYS                    최근 N일 (기본 30)
"""

import os
import re
import time
import requests
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

CHALLENGE_KEY = os.environ.get("CHALLENGE_KEY", "").strip()
CAFE_CLUB_ID  = os.environ.get("NAVER_CAFE_ID", "31045190")
SUPABASE_URL  = os.environ["SUPABASE_URL"]
SERVICE_KEY   = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CRAWL_DAYS    = int(os.environ.get("CRAWL_DAYS", "30"))

KST = timezone(timedelta(hours=9))

API_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://cafe.naver.com/",
    "Accept": "application/json",
}

# 제목에서 회차/이름 best-effort 추출 (형식 미확정 — 게시판 받은 뒤 정교화)
ROUND_PATTERN = re.compile(r"(\d+)\s*(?:주차|회|차)")
NAME_PATTERN  = re.compile(r"[가-힣]{2,4}")


def sb_headers():
    return {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}


def fetch_challenge():
    """challenges 에서 이 챌린지의 게시판 id 등을 읽음."""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/challenges?key=eq.{CHALLENGE_KEY}&select=key,name,naver_cafe_id,naver_board_id,naver_board_type,active",
        headers=sb_headers(), timeout=15,
    )
    if r.status_code != 200 or not r.json():
        print(f"[supabase] 챌린지 조회 실패: {CHALLENGE_KEY} ({r.status_code})")
        return None
    return r.json()[0]


def fetch_existing_urls():
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/challenge_posts?challenge_key=eq.{CHALLENGE_KEY}&select=post_url",
        headers=sb_headers(), timeout=15,
    )
    if r.status_code == 200:
        return {row["post_url"] for row in r.json() if row.get("post_url")}
    print(f"[supabase] 기존 URL 조회 실패: {r.status_code}")
    return set()


def parse_title(title):
    if not title:
        return None, None
    rnd = ROUND_PATTERN.search(title)
    parsed_round = int(rnd.group(1)) if rnd else None
    s = ROUND_PATTERN.sub(" ", title)
    s = re.sub(r"[\[\]/_,]", " ", s)
    names = [n for n in NAME_PATTERN.findall(s) if n not in {"주차"}]
    parsed_name = names[0] if names else None
    return parsed_name, parsed_round


def crawl_board(board_id, existing_urls, club_id=None, board_type="L"):
    cutoff = datetime.now(KST) - timedelta(days=CRAWL_DAYS)
    club = club_id or CAFE_CLUB_ID
    posts, page = [], 1
    while True:
        url = (
            f"https://apis.naver.com/cafe-web/cafe2/ArticleListV2.json"
            f"?search.clubid={club}&search.menuid={board_id}"
            f"&search.boardtype={board_type or 'L'}&search.page={page}&search.perPage=20"
        )
        r = requests.get(url, headers=API_HEADERS, timeout=15)
        time.sleep(0.5)
        if r.status_code != 200:
            print(f"[crawl] API 오류: {r.status_code}")
            break
        result = r.json().get("message", {}).get("result", {})
        articles = result.get("articleList", [])
        has_next = result.get("hasNext", False)
        print(f"[crawl] 페이지 {page}: {len(articles)}건, hasNext={has_next}")
        if not articles:
            break
        found_old = False
        for a in articles:
            ts = a.get("writeDateTimestamp", 0) / 1000
            posted_at = datetime.fromtimestamp(ts, KST)
            if posted_at < cutoff:
                found_old = True
                continue
            article_id = a["articleId"]
            post_url = f"https://cafe.naver.com/f-e/cafes/{club}/articles/{article_id}"
            if post_url in existing_urls:
                continue
            title = a.get("subject", "")
            pname, pround = parse_title(title)
            posts.append({
                "challenge_key": CHALLENGE_KEY,
                "naver_nickname": a.get("writerNickname", "unknown"),
                "post_title": title,
                "post_url": post_url,
                "posted_at": posted_at.isoformat(),
                "parsed_name": pname,
                "parsed_round": pround,
            })
        if found_old or not has_next:
            break
        page += 1
        if page > 50:
            break
    print(f"[crawl] 수집 완료: {len(posts)}건 신규")
    return posts


def upsert(posts):
    if not posts:
        print("[supabase] 저장할 신규 데이터 없음")
        return
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/challenge_posts",
        headers={**sb_headers(), "Content-Type": "application/json", "Prefer": "resolution=ignore-duplicates"},
        json=posts, timeout=30,
    )
    if r.status_code in (200, 201):
        print(f"[supabase] 저장 성공: {len(posts)}건")
    else:
        print(f"[supabase] 저장 실패: {r.status_code} — {r.text[:300]}")


if __name__ == "__main__":
    if not CHALLENGE_KEY:
        print("[설정] CHALLENGE_KEY 환경변수가 필요합니다.")
        raise SystemExit(0)

    ch = fetch_challenge()
    if not ch:
        raise SystemExit(0)
    if not ch.get("active", True):
        print(f"[설정] '{ch['name']}' 챌린지는 비활성 상태입니다.")
        raise SystemExit(0)
    board_id = ch.get("naver_board_id")
    if not board_id:
        # 게시판 미설정 — 틀만 있는 상태. 정상 종료.
        print(f"[설정] '{ch['name']}' 챌린지의 naver_board_id 가 아직 등록되지 않았습니다. 게시판 링크를 등록해주세요.")
        raise SystemExit(0)

    club_id = ch.get("naver_cafe_id") or CAFE_CLUB_ID
    board_type = ch.get("naver_board_type") or "L"
    print(f"[start] 챌린지 '{ch['name']}' (cafe={club_id} board={board_id} type={board_type}) 크롤링 시작")
    existing = fetch_existing_urls()
    print(f"[supabase] 기존 저장: {len(existing)}건")
    posts = crawl_board(board_id, existing, club_id=club_id, board_type=board_type)
    upsert(posts)
