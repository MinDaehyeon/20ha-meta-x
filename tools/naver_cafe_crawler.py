"""
네이버 카페 인증글 크롤러
카페: https://cafe.naver.com/f-e/cafes/31045190/menus/161
- NID_AUT / NID_SES 쿠키로 인증 (로그인 불필요)
- 이미 크롤링된 URL 스킵
- 양식 미준수 글도 수집 (is_valid_format=false)
"""

import os
import re
import time
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

NAVER_NID_AUT  = os.environ["NAVER_NID_AUT"]
NAVER_NID_SES  = os.environ["NAVER_NID_SES"]
CAFE_CLUB_ID   = os.environ.get("NAVER_CAFE_ID", "31045190")
BOARD_MENU_ID  = os.environ.get("NAVER_BOARD_ID", "161")
SUPABASE_URL   = os.environ["SUPABASE_URL"]
SERVICE_KEY    = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CRAWL_DAYS     = int(os.environ.get("CRAWL_DAYS", "30"))

KST = timezone(timedelta(hours=9))

# 올바른 양식: [N주차/수] or [N주차/일] (띄어쓰기 무시)
VALID_TITLE_PATTERN = re.compile(r"\[?\s*\d+\s*주차\s*/\s*(수|일)\s*\]", re.IGNORECASE)


# ── 세션 ───────────────────────────────────────────────────────────────────

def make_session():
    s = requests.Session()
    s.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    })
    s.cookies.set("NID_AUT", NAVER_NID_AUT, domain=".naver.com")
    s.cookies.set("NID_SES", NAVER_NID_SES, domain=".naver.com")
    return s


def check_login(session):
    if NAVER_NID_AUT and NAVER_NID_SES:
        print("[session] 쿠키 인증 준비 완료")
        return True
    print("[session] NID_AUT/NID_SES 시크릿이 비어 있음")
    return False


# ── 날짜 파싱 ──────────────────────────────────────────────────────────────

def parse_naver_date(date_str):
    """
    "2026.03.30." → 해당 날짜
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

def crawl_board(session, existing_urls):
    cutoff = datetime.now(KST) - timedelta(days=CRAWL_DAYS)
    posts = []
    page = 1

    while True:
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
        all_rows = soup.select("tr")
        rows = [r for r in all_rows
                if "board-notice" not in (r.get("class") or [])]
        print(f"[crawl] 페이지 {page}: 전체 tr={len(all_rows)}, 공지 제외={len(rows)}")

        if not rows or not any(r.select_one("a.article") for r in rows):
            print(f"[crawl] 페이지 {page}: 게시글 없음 — 종료")
            break

        found_old = False
        for row in rows:
            title_el = row.select_one("a.article")
            if not title_el:
                continue

            title = title_el.get_text(strip=True)
            href = title_el.get("href", "").strip()

            # 글번호로 URL 구성
            num_el = row.select_one("td.type_articleNumber")
            article_id = num_el.get_text(strip=True) if num_el else href.strip("/")
            post_url = (
                f"https://cafe.naver.com/{CAFE_CLUB_ID}/{article_id}"
                if article_id.isdigit()
                else f"https://cafe.naver.com{href}"
            )

            if post_url in existing_urls:
                continue

            nick_el = row.select_one("span.nickname")
            nickname = nick_el.get_text(strip=True) if nick_el else "unknown"

            date_el = row.select_one("td.type_date")
            posted_at = parse_naver_date(date_el.get_text(strip=True) if date_el else "")

            if not posted_at:
                continue
            if posted_at < cutoff:
                found_old = True
                continue

            posts.append({
                "naver_nickname": nickname,
                "post_title": title,
                "post_url": post_url,
                "post_snippet": None,
                "posted_at": posted_at.isoformat(),
                "is_valid_format": bool(VALID_TITLE_PATTERN.search(title)),
            })

        if found_old:
            break
        page += 1
        if page > 30:
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
    session = make_session()
    if not check_login(session):
        raise SystemExit("쿠키 만료 — GitHub Secret의 NAVER_NID_AUT/NID_SES 갱신 필요")

    existing_urls = fetch_existing_urls()
    print(f"[supabase] 기존 저장: {len(existing_urls)}건")

    posts = crawl_board(session, existing_urls)
    upsert_to_supabase(posts)
