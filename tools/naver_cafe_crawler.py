"""
네이버 카페 인증글 크롤러
카페: https://cafe.naver.com/f-e/cafes/31045190/menus/161
- 제목만 수집 (본문 불필요)
- 이미 크롤링된 URL은 DB 확인 후 스킵
- 양식 미준수 글도 수집 (is_valid=false 플래그)
"""

import os
import re
import time
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

NAVER_ID       = os.environ["NAVER_ID"]
NAVER_PW       = os.environ["NAVER_PW"]
CAFE_CLUB_ID   = os.environ.get("NAVER_CAFE_ID", "31045190")
BOARD_MENU_ID  = os.environ.get("NAVER_BOARD_ID", "161")
SUPABASE_URL   = os.environ["SUPABASE_URL"]
SERVICE_KEY    = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CRAWL_DAYS     = int(os.environ.get("CRAWL_DAYS", "30"))

KST = timezone(timedelta(hours=9))

# 인증글 양식 패턴 (예: "1주차 수", "3주차 일", "20주차 수요일" 등)
VALID_TITLE_PATTERN = re.compile(r"\d+주차\s*(수|일|수요일|일요일)", re.IGNORECASE)


# ── 로그인 ─────────────────────────────────────────────────────────────────

def make_session():
    s = requests.Session()
    s.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    })
    return s


def login_naver(session):
    """네이버 로그인. 세션에 인증 쿠키 설정."""
    # 로그인 페이지 접근 → 필요 쿠키 획득
    session.get("https://nid.naver.com/nidlogin.login", timeout=10)

    payload = {
        "id": NAVER_ID,
        "pw": NAVER_PW,
        "svctype": "0",
        "enctp": "1",
        "smart_LEVEL": "-1",
        "localechange": "",
        "locale": "ko_KR",
    }
    r = session.post(
        "https://nid.naver.com/nidlogin.login",
        data=payload,
        headers={
            "Referer": "https://nid.naver.com/nidlogin.login",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        allow_redirects=True,
        timeout=15,
    )
    # 로그인 확인: 카페 접근 시 로그아웃 버튼 있으면 성공
    check = session.get("https://cafe.naver.com", timeout=10)
    if "로그아웃" in check.text or "NID_AUT" in session.cookies:
        print("[login] 성공")
        return True
    print(f"[login] 실패 — 응답 코드: {r.status_code}")
    return False


# ── 날짜 파싱 ──────────────────────────────────────────────────────────────

def parse_naver_date(date_str):
    """
    네이버 카페 날짜 문자열 → datetime(KST)
    형식:
      "2026.03.30." → 해당 날짜 00:00
      "03.30."      → 올해 해당 날짜
      "10:35"       → 오늘 (시간 표시 = 오늘 작성)
    """
    now = datetime.now(KST)
    s = date_str.strip().rstrip(".")
    try:
        if ":" in s:
            h, m = s.split(":")
            return now.replace(hour=int(h), minute=int(m), second=0, microsecond=0)
        parts = s.split(".")
        if len(parts) == 3:
            return datetime(int(parts[0]), int(parts[1]), int(parts[2]), tzinfo=KST)
        if len(parts) == 2:
            return now.replace(month=int(parts[0]), day=int(parts[1]),
                               hour=0, minute=0, second=0, microsecond=0)
    except Exception as e:
        print(f"[date] 파싱 실패: '{date_str}' → {e}")
    return None


# ── 기존 URL 조회 (중복 방지) ──────────────────────────────────────────────

def fetch_existing_urls():
    """Supabase에서 이미 저장된 post_url 집합 반환."""
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    }
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/cafe_certifications?select=post_url",
        headers=headers,
        timeout=15,
    )
    if r.status_code == 200:
        return {row["post_url"] for row in r.json() if row.get("post_url")}
    print(f"[supabase] 기존 URL 조회 실패: {r.status_code}")
    return set()


# ── 크롤링 ─────────────────────────────────────────────────────────────────

def crawl_board(session, existing_urls):
    """게시판 목록 페이지 순회 → 신규 글만 수집."""
    cutoff = datetime.now(KST) - timedelta(days=CRAWL_DAYS)
    posts = []
    page = 1

    while True:
        # 네이버 카페 게시글 목록 API (구버전 — iframe 내부 URL)
        url = (
            f"https://cafe.naver.com/ArticleList.nhn"
            f"?search.clubid={CAFE_CLUB_ID}"
            f"&search.menuid={BOARD_MENU_ID}"
            f"&search.boardtype=L"
            f"&search.page={page}"
        )
        r = session.get(url, timeout=15)
        time.sleep(0.8)

        soup = BeautifulSoup(r.text, "html.parser")
        rows = soup.select("tr.board-list")

        if not rows:
            print(f"[crawl] 페이지 {page}: 행 없음 — 종료")
            break

        found_old = False
        for row in rows:
            # 제목 + URL
            title_el = row.select_one("a.article")
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            article_id = title_el.get("href", "").strip("/")
            post_url = f"https://cafe.naver.com/{CAFE_CLUB_ID}/{article_id}" if article_id.isdigit() else title_el.get("href", "")

            # 이미 크롤링된 글 스킵
            if post_url in existing_urls:
                continue

            # 닉네임
            nick_el = row.select_one(".td_name .p-nick a, .p-nick")
            nickname = nick_el.get_text(strip=True) if nick_el else None

            # 날짜
            date_el = row.select_one(".td_date")
            date_str = date_el.get_text(strip=True) if date_el else ""
            posted_at = parse_naver_date(date_str)

            if not posted_at:
                continue
            if posted_at < cutoff:
                found_old = True
                continue

            # 양식 준수 여부 체크
            is_valid = bool(VALID_TITLE_PATTERN.search(title))

            posts.append({
                "naver_nickname": nickname or "unknown",
                "post_title": title,
                "post_url": post_url,
                "post_snippet": None,
                "posted_at": posted_at.isoformat(),
                "is_valid_format": is_valid,
            })

        if found_old:
            break
        page += 1
        if page > 30:
            break

    print(f"[crawl] 수집 완료: {len(posts)}건")
    return posts


# ── Supabase 저장 ──────────────────────────────────────────────────────────

def upsert_to_supabase(posts):
    if not posts:
        print("[supabase] 저장할 신규 데이터 없음")
        return

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates",
    }
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/cafe_certifications",
        headers=headers,
        json=posts,
        timeout=30,
    )
    if r.status_code in (200, 201):
        print(f"[supabase] 저장 성공: {len(posts)}건")
    else:
        print(f"[supabase] 저장 실패: {r.status_code} — {r.text[:300]}")


# ── 실행 ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    session = make_session()
    if not login_naver(session):
        raise SystemExit("로그인 실패")

    existing_urls = fetch_existing_urls()
    print(f"[supabase] 기존 저장 URL: {len(existing_urls)}건")

    posts = crawl_board(session, existing_urls)
    upsert_to_supabase(posts)
