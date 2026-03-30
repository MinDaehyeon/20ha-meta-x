"""
네이버 카페 인증글 크롤러
카페: https://cafe.naver.com/f-e/cafes/31045190/menus/161
- JSON API 사용 (쿠키/로그인 불필요)
- 이미 크롤링된 URL 스킵
- 양식 미준수 글도 수집 (is_valid_format=false)
"""

import os
import re
import time
import requests
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

CAFE_CLUB_ID  = os.environ.get("NAVER_CAFE_ID", "31045190")
BOARD_MENU_ID = os.environ.get("NAVER_BOARD_ID", "161")
SUPABASE_URL  = os.environ["SUPABASE_URL"]
SERVICE_KEY   = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CRAWL_DAYS    = int(os.environ.get("CRAWL_DAYS", "30"))

KST = timezone(timedelta(hours=9))

# 올바른 양식: [N주차/수] or [N주차/일] (띄어쓰기 무시)
VALID_TITLE_PATTERN = re.compile(r"\[?\s*\d+\s*주차\s*/\s*(수|일)\s*\]", re.IGNORECASE)

# 제목에서 이름/학년/학번 파싱: "[3주차/일] 조성재/중1/6247" → ("조성재", "중1", "6247")
TITLE_INFO_PATTERN = re.compile(
    r"\[.*?\]\s*([가-힣a-zA-Z ]+?)\s*/\s*([^\s/]+?)\s*/\s*(\d{4})"
)

API_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://cafe.naver.com/",
    "Accept": "application/json",
}


# ── 프로필 조회 (대조용) ────────────────────────────────────────────────────

def fetch_profiles():
    """닉네임 → {name, grade} 매핑 반환"""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/profiles"
        f"?select=naver_nickname,name,grade"
        f"&role=eq.student&approval_status=eq.approved&is_test=eq.false",
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"},
        timeout=15,
    )
    if r.status_code != 200:
        print(f"[supabase] 프로필 조회 실패: {r.status_code}")
        return {}
    profiles = {}
    for row in r.json():
        nn = row.get("naver_nickname")
        if nn:
            profiles[nn] = {
                "name": row.get("name", "") or "",
                "grade": row.get("grade", "") or "",
            }
    print(f"[supabase] 프로필 로드: {len(profiles)}명")
    return profiles


def check_title_match(title, nickname, profiles):
    """제목 파싱 후 프로필과 대조. (parsed_name, parsed_grade, parsed_code, status) 반환"""
    m = TITLE_INFO_PATTERN.search(title)
    if not m:
        return None, None, None, "parse_failed"

    parsed_name  = m.group(1).strip()
    parsed_grade = m.group(2).strip()
    parsed_code  = m.group(3).strip()

    profile = profiles.get(nickname)
    if not profile:
        return parsed_name, parsed_grade, parsed_code, "no_profile"

    if profile["name"] and profile["name"] != parsed_name:
        return parsed_name, parsed_grade, parsed_code, "name_mismatch"
    if profile["grade"] and profile["grade"] != parsed_grade:
        return parsed_name, parsed_grade, parsed_code, "grade_mismatch"

    return parsed_name, parsed_grade, parsed_code, "matched"


def update_existing_title_checks(profiles):
    """기존 저장된 글의 title_match_status가 unchecked인 것을 일괄 업데이트"""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/cafe_certifications"
        f"?select=id,naver_nickname,post_title&title_match_status=eq.unchecked",
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"},
        timeout=30,
    )
    if r.status_code != 200:
        print(f"[supabase] unchecked 조회 실패: {r.status_code}")
        return

    rows = r.json()
    print(f"[supabase] unchecked 업데이트 대상: {len(rows)}건")
    updated = 0
    for row in rows:
        pname, pgrade, pcode, status = check_title_match(
            row["post_title"] or "", row["naver_nickname"], profiles
        )
        patch = requests.patch(
            f"{SUPABASE_URL}/rest/v1/cafe_certifications?id=eq.{row['id']}",
            headers={
                "apikey": SERVICE_KEY,
                "Authorization": f"Bearer {SERVICE_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "parsed_name": pname,
                "parsed_grade": pgrade,
                "parsed_code": pcode,
                "title_match_status": status,
            },
            timeout=10,
        )
        if patch.status_code in (200, 204):
            updated += 1
    print(f"[supabase] title_match_status 업데이트 완료: {updated}건")


# ── 기존 URL 조회 ──────────────────────────────────────────────────────────

def fetch_existing_urls():
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/cafe_certifications?select=post_url",
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"},
        timeout=15,
    )
    if r.status_code == 200:
        return {row["post_url"] for row in r.json() if row.get("post_url")}
    print(f"[supabase] 기존 URL 조회 실패: {r.status_code}")
    return set()


# ── 크롤링 ─────────────────────────────────────────────────────────────────

def crawl_board(existing_urls, profiles):
    cutoff = datetime.now(KST) - timedelta(days=CRAWL_DAYS)
    posts = []
    page = 1

    while True:
        url = (
            f"https://apis.naver.com/cafe-web/cafe2/ArticleListV2.json"
            f"?search.clubid={CAFE_CLUB_ID}"
            f"&search.menuid={BOARD_MENU_ID}"
            f"&search.boardtype=L"
            f"&search.page={page}"
            f"&search.perPage=20"
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
            post_url = f"https://cafe.naver.com/{CAFE_CLUB_ID}/{article_id}"

            if post_url in existing_urls:
                continue

            title = a.get("subject", "")
            nickname = a.get("writerNickname", "unknown")

            pname, pgrade, pcode, match_status = check_title_match(title, nickname, profiles)

            posts.append({
                "naver_nickname": nickname,
                "post_title": title,
                "post_url": post_url,
                "post_snippet": None,
                "posted_at": posted_at.isoformat(),
                "is_valid_format": bool(VALID_TITLE_PATTERN.search(title)),
                "parsed_name": pname,
                "parsed_grade": pgrade,
                "parsed_code": pcode,
                "title_match_status": match_status,
            })

        if found_old or not has_next:
            break
        page += 1
        if page > 50:
            break

    print(f"[crawl] 수집 완료: {len(posts)}건 신규")
    return posts


# ── Supabase 저장 ──────────────────────────────────────────────────────────

def upsert_to_supabase(posts):
    if not posts:
        print("[supabase] 저장할 신규 데이터 없음")
        return
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/cafe_certifications",
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=ignore-duplicates",
        },
        json=posts,
        timeout=30,
    )
    if r.status_code in (200, 201):
        print(f"[supabase] 저장 성공: {len(posts)}건")
    else:
        print(f"[supabase] 저장 실패: {r.status_code} — {r.text[:300]}")


# ── 실행 ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    profiles = fetch_profiles()

    existing_urls = fetch_existing_urls()
    print(f"[supabase] 기존 저장: {len(existing_urls)}건")

    # 기존 unchecked 레코드 title 대조 업데이트
    update_existing_title_checks(profiles)

    # 신규 글 크롤링 및 저장
    posts = crawl_board(existing_urls, profiles)
    upsert_to_supabase(posts)
