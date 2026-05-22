"""
네이버 카페 인증글 크롤러
카페: https://cafe.naver.com/f-e/cafes/31045190/menus/165
- JSON API 사용 (쿠키/로그인 불필요)
- 이미 크롤링된 URL 스킵
- 양식 미준수 글도 수집 (is_valid_format=false)
- 매칭: parsed_name + parsed_code(전화 뒷4자리) → cert_students
"""

import os
import re
import time
import requests
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

CAFE_CLUB_ID  = os.environ.get("NAVER_CAFE_ID", "31045190")
BOARD_MENU_ID = os.environ.get("NAVER_BOARD_ID", "165")  # 변경: 2기 인증글 게시판
SUPABASE_URL  = os.environ["SUPABASE_URL"]
SERVICE_KEY   = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CRAWL_DAYS    = int(os.environ.get("CRAWL_DAYS", "30"))

KST = timezone(timedelta(hours=9))

# 올바른 양식: [N주차/수] or [N주차/일] (띄어쓰기 무시)
VALID_TITLE_PATTERN = re.compile(r"\[?\s*\d+\s*주차\s*/\s*(수|일)\s*\]", re.IGNORECASE)

# 제목에서 이름/학년/학번 파싱 (엄격): "[3주차/일] 조성재/중1/6247"
TITLE_INFO_PATTERN = re.compile(
    r"\[.*?\]\s*([가-힣a-zA-Z ]+?)\s*/\s*([^\s/]+?)\s*/\s*(\d{4})"
)

# 유연 파싱용 (공백/언더스코어/대괄호 안 등 다양한 변형 대응)
WEEK_HDR_PATTERN = re.compile(r"\d+\s*주차[\s/]*[수일]?")
GRADE_PATTERN    = re.compile(r"[초중고]\s*\d")
NAME_PATTERN     = re.compile(r"[가-힣]{2,4}")
CODE_PATTERN     = re.compile(r"\d{4}")

API_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://cafe.naver.com/",
    "Accept": "application/json",
}


# ── 학생 명단 조회 (cert_students 기반) ───────────────────────────────────

def fetch_students():
    """cert_students 조회 — 코드(뒷4/중간4)와 이름으로 인덱싱."""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/cert_students?select=id,name,phone&sort_order=lt.43",
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"},
        timeout=15,
    )
    if r.status_code != 200:
        print(f"[supabase] 학생 조회 실패: {r.status_code}")
        return {"by_last4": {}, "by_mid4": {}, "by_name": {}}

    by_last4 = {}   # 뒷4자리 → student
    by_mid4  = {}   # 중간4자리(010-XXXX-YYYY의 XXXX) → student
    by_name  = {}   # 이름 → [students]

    for row in r.json():
        phone = (row.get("phone") or "").replace("-", "")
        name  = row.get("name", "")
        if not name:
            continue
        s = {"id": row["id"], "name": name, "phone": phone}
        if len(phone) >= 4:
            by_last4[phone[-4:]] = s
        if len(phone) >= 7:
            by_mid4[phone[3:7]] = s  # 010 다음 4자리
        by_name.setdefault(name, []).append(s)

    print(f"[supabase] 학생 로드: {len(by_name)}명")
    return {"by_last4": by_last4, "by_mid4": by_mid4, "by_name": by_name}


def parse_title(title):
    """유연 파싱: 슬래시/공백/언더스코어/대괄호 안 등 다양한 형식 대응.
    (parsed_name, parsed_grade, parsed_code) 반환. 못 찾으면 None."""
    if not title:
        return None, None, None

    # 1차: 엄격한 슬래시 형식
    m = TITLE_INFO_PATTERN.search(title)
    if m:
        return m.group(1).strip(), m.group(2).strip(), m.group(3).strip()

    # 2차: 유연 파싱
    # 주차 헤더 제거 + 구분자(대괄호/슬래시/언더스코어/쉼표)를 공백으로
    s = WEEK_HDR_PATTERN.sub(" ", title)
    s = re.sub(r"[\[\]/_,]", " ", s)

    # 학년 추출 ("초 5" 같은 공백 포함도 가능 → 공백 제거)
    g = GRADE_PATTERN.search(s)
    parsed_grade = g.group(0).replace(" ", "") if g else None

    # 학년 영역 제거 후 한글 이름(2~4자) 추출
    s_no_grade = GRADE_PATTERN.sub(" ", s)
    name_candidates = [
        n for n in NAME_PATTERN.findall(s_no_grade)
        if n not in {"주차"}
    ]
    parsed_name = name_candidates[0] if name_candidates else None

    # 4자리 숫자
    c = CODE_PATTERN.search(s)
    parsed_code = c.group(0) if c else None

    return parsed_name, parsed_grade, parsed_code


def check_title_match(title, nickname, students):
    """제목 파싱 후 cert_students와 대조.
    (parsed_name, parsed_grade, parsed_code, status) 반환.
    status: matched | name_mismatch | no_profile | parse_failed"""
    parsed_name, parsed_grade, parsed_code = parse_title(title)

    if not parsed_name:
        return None, None, parsed_code, "parse_failed"

    # 1차: 이름 + 뒷4자리
    if parsed_code and parsed_code in students["by_last4"]:
        s = students["by_last4"][parsed_code]
        if s["name"] == parsed_name:
            return parsed_name, parsed_grade, parsed_code, "matched"

    # 2차: 이름 + 중간4자리 (예: 010-8965-5948에서 "8965"로 적은 케이스)
    if parsed_code and parsed_code in students["by_mid4"]:
        s = students["by_mid4"][parsed_code]
        if s["name"] == parsed_name:
            return parsed_name, parsed_grade, parsed_code, "matched"

    # 3차: 이름만 (cert_students 내 동명이인이 없을 때)
    if parsed_name in students["by_name"] and len(students["by_name"][parsed_name]) == 1:
        return parsed_name, parsed_grade, parsed_code, "matched"

    # 매칭 실패
    if parsed_code and (parsed_code in students["by_last4"] or parsed_code in students["by_mid4"]):
        return parsed_name, parsed_grade, parsed_code, "name_mismatch"
    return parsed_name, parsed_grade, parsed_code, "no_profile"


def update_existing_title_checks(students):
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
            row["post_title"] or "", row["naver_nickname"], students
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

def crawl_board(existing_urls, students):
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
            post_url = f"https://cafe.naver.com/f-e/cafes/{CAFE_CLUB_ID}/articles/{article_id}"

            if post_url in existing_urls:
                continue

            title = a.get("subject", "")
            nickname = a.get("writerNickname", "unknown")

            pname, pgrade, pcode, match_status = check_title_match(title, nickname, students)

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
    students = fetch_students()

    existing_urls = fetch_existing_urls()
    print(f"[supabase] 기존 저장: {len(existing_urls)}건")

    # 기존 unchecked 레코드 title 대조 업데이트
    update_existing_title_checks(students)

    # 신규 글 크롤링 및 저장
    posts = crawl_board(existing_urls, students)
    upsert_to_supabase(posts)
