# 20HA META-X 버전 기록

본서버(meta-x.ai.kr) 배포마다 한 줄씩 추가합니다.
버전 포맷: `v{YYYY.MM.DD}-{N}` (같은 날 N번째 배포)

각 버전은 git tag로도 남아 있어 `git checkout <tag>` 로 코드 상태 복원 가능, Vercel 대시보드에서는 클릭 한 번으로 production 롤백 가능.

---

## v2026.06.01-9 — 2026-06-01
**커밋:** [1bcd917](https://github.com/MinDaehyeon/20ha-meta-x/commit/1bcd917)

### 주요 변경

**기능 추가 — 관리자 "학생 화면 보기" 모드**
- 회원 관리 표의 학생(approved) 행에 "👁 학생화면" 버튼
- 클릭 시 풀스크린 오버레이 + 상단 노란 배너 "👁 관리자 view 모드 — {학생명} 학생이 보는 화면 그대로"
- 학생 본인이 보는 카페 인증 화면(StudentCertView) 그대로 표시
- DB (`20260601400000_admin_view_as_student.sql`): `get_child_cafe_certs` / `get_child_attendance_logs`에 admin role 분기 추가
  → 학부모 `viewerMode="parent"` 컴포넌트를 admin이 임의 학생 대상으로 그대로 재사용

**버그 수정 — 학생 진행률 과장 표시 (100% / 100% 초과)**
- 증상: 박재현 학생이 5/25 모닝 빠졌는데 멘토 인사이트가 "미라클모닝 100% 완벽! 흠잡을 데가 없어요"로 표시
- 추가 증상: 6/3 일정 변경 사전 출석으로 일부 학생 "105% 달성" 표시
- 원인 1: 본인 출석 카운트(`myStat.morning`)가 ROSTER2 전체 일자 기준이라 미래 회차 사전 출석도 포함 → `done > past` → `done/past*100 > 100`
- 원인 2: `Math.round` 사용으로 99.5%가 100%로 표시
- 원인 3: 오늘 출석 row가 어제까지 회차 분자에 포함되어 빠진 회차가 가려짐
- 수정:
  - 본인 카운트(morning/night/naver)에 `isTodayOrPast(dt <= todayMidnight)` cap — 미래 출석 사전 표시 차단, 6/3 당일 도달 시 자연 반영
  - 멘토/마스터리 진행률에 `Math.min(100, Math.floor(...))` cap
  - "100% 완벽" 메시지 조건: `floor + done === past` 정확 비교 (round 함정 차단)
  - 모든 진행률 메시지에 X/Y 정확 횟수 포함 (예: "진행된 6회 중 5회 (83%)")
  - "100% 완벽 / 흠잡을 데가 없어요 / 탁월한 성과" 등 강한 표현 → 객관적 사실 기반 톤다운
  - 1위 메시지 공동 1위 동률 케이스 분리

**런타임 오류 수정 — TDZ**
- `today/todayMidnight` 정의 위치가 `isTodayOrPast` 보다 아래라 학생화면 진입 시 `Cannot access $ before initialization` 발생
- 정의를 `myAttSet` 직후로 이동

### dev 검증
- 박재현 학생화면: 콘솔 에러 0, 미라클모닝 6/24 (옛 7/6 표시 사라짐), 미라클나이트 10/47 (6/3 미래 출석 제외), 멘토/마스터리 메시지 모두 보수적 X/Y 표기
- 심수윤 학생화면: 정상 표시, 클래스 5위/45명, 카페 4/16, 모닝 7/24, 나잇 12/47

---

## v2026.06.01-8 — 2026-06-01
**커밋:** [d8ab2af](https://github.com/MinDaehyeon/20ha-meta-x/commit/d8ab2af)

### 주요 변경

**AI 학습코치 모델 재교체 — 무료 등급 quota=0 회피**
- 직전 v-7의 `gemini-2.0-flash`도 동일 429 응답 (`limit: 0` for `generate_content_free_tier_requests`)
- 진단: 현재 API key의 free tier가 일부 모델에서 quota 0으로 제한된 상태. Bun으로 7개 모델 직접 호출 결과
  - `gemini-2.5-flash-lite` → **200 OK** (유일하게 무료 호출 가능)
  - `gemini-2.0-flash`, `2.0-flash-lite` → 429 limit=0
  - `gemini-2.5-flash` → 503 high demand
  - `gemini-1.5-flash`, `-8b`, `-latest` → 404 deprecated
- 수정: `gemini-2.5-flash-lite`로 교체
- dev 검증: 200 응답 + `ai_advice_logs` 201 INSERT + 화면 정상 표시

---

## v2026.06.01-7 — 2026-06-01
**커밋:** [3e8cf86](https://github.com/MinDaehyeon/20ha-meta-x/commit/3e8cf86)

### 주요 변경

**AI 학습코치 안정화 — Gemini 모델 교체**
- 증상: AI 학습코치가 자주 `503 / "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later."` 반환
- 원인: 기존 `gemini-2.5-flash`는 preview tier로 무료 quota capacity 변동이 큼
- 수정: `gemini-2.0-flash` (GA stable)로 교체. 무료 quota 충분
- 추가: 503/high-demand/overloaded 응답은 영문 그대로 노출하지 않고 한국어 안내 "AI 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해 주세요." 로 표시

---

## v2026.06.01-6 — 2026-06-01
**커밋:** [34b21c7](https://github.com/MinDaehyeon/20ha-meta-x/commit/34b21c7)

### Critical 버그 수정

- v2026.06.01-5에서 `supabase.rpc(...).catch(()=>{})` 사용 → `PostgrestFilterBuilder`는 thenable이지만 Promise가 아니라 `.catch`가 없어 `TypeError: rpc(...).catch is not a function`로 모든 사용자 화면 깨짐
- 수정: `.then(()=>{}, ()=>{})` (두 번째 인자가 onRejected 역할) 사용

---

## v2026.06.01-5 — 2026-06-01
**커밋:** [cb2be82](https://github.com/MinDaehyeon/20ha-meta-x/commit/cb2be82)

### 주요 변경

**기능 추가 — 김도현 학생 매주 월요일 미라클 나이트 자동 출석**
- 운영 사유: 매주 월요일 아이인사이드 영작 수업으로 미라클 나이트 불참 → 출석 인정
- 요구사항: 미래 월요일은 미리 체크하지 않음. "화요일이 되면" 어제(월) 자동 추가
- DB (`20260601300000_kimdohyun_monday_attendance.sql`): SECURITY DEFINER 함수 `apply_kimdohyun_monday_attendance()` — 5/17부터 어제(KST)까지의 월요일 일자를 김도현 (cert_students.id=124) `attendance_logs` 'N'에 멱등 INSERT
- 코드 (App.jsx): `session` 로드 직후 RPC 1회 fire-and-forget 호출. 학생/학부모/관리자 누가 앱을 열어도 백필 트리거 (pg_cron 없이 일반 사용으로 자동화)

---

## v2026.06.01-4 — 2026-06-01
**커밋:** [d98f402](https://github.com/MinDaehyeon/20ha-meta-x/commit/d98f402)

### 주요 변경

**일정 변경 — 미라클 나이트 5/29 → 6/3**
- 5/29(금) 미라클 나이트를 6/3(수)으로 이동
- 6/3은 변경된 일정이라 **2기 전원 자동 출석** 처리
- 단일 import 소스(`src/utils/roster2.js`) 수정으로 학생/관리자 모든 화면(전체 현황·출석체크·학생 대시보드·통계 등) 일관 반영

**DB (`20260601200000_full_attendance_2026_06_03.sql`)**
- 기존 cert_students 45명 전원 → 6/3 'N' 출석 INSERT (멱등, `ON CONFLICT DO NOTHING`)
- 신규 학생 자동화: `cert_students_full_attendance_2026_06_03` 트리거 — AFTER INSERT 시 6/3 'N' 자동 부여

**코드 변경**
- `ROSTER2_NIGHT_DATES`에 `.filter` 추가로 5/29 제외 + `.concat([new Date(2026, 5, 3)])` + `.sort` (정렬 순서 보장)

---

## v2026.06.01-3 — 2026-06-01
**커밋:** [8575c7d](https://github.com/MinDaehyeon/20ha-meta-x/commit/8575c7d)

### 주요 변경

**버그 수정 — 신규 가입자가 자동으로 "20HA 1기"로 표시**
- 증상: 가입한 학생이 ROSTER2(2기 명단)에 없어도 회원관리 표 기수 열에 "20HA 1기"가 박혀 표시됨
- 원인: `getCohorts`가 학생이면 무조건 `["20HA 1기"]`를 기본 부여하던 옛 로직 (1기 운영 시점부터 남아있던 코드)
- 수정: 가입일 cutoff 도입
  - **2026-05-20 KST(2기 첫 회차일) 이전 가입자**에만 "20HA 1기" 자동 부여
  - 그 이후 가입자는 자동 1기 미부여 (ROSTER2 매칭 시에만 "20HA 2기" 표시)
- 기존 1기 학생들은 가입일이 cutoff 이전이라 표시 그대로 유지
- 2기 자동 연동(`try_link_2ki_on_signup`)은 그대로 동작 — 가입자 이름이 cert_students(2기) 빈 자리와 매칭되면 자동 연결

---

## v2026.06.01-2 — 2026-06-01
**커밋:** [d3498df](https://github.com/MinDaehyeon/20ha-meta-x/commit/d3498df)

### 주요 변경

**기능 추가 — Make-up 대상자 수동 면제**
- 운영 사유(질병/가정 일정/학교 행사 등)로 자동 Make-up 대상에서 제외 가능
- 자동 streak 계산은 그대로 유지하되 면제된 (학생, 회차)는 정상 처리로 취급 → 카운트에서 빠지고 대상자 목록 자동 재정렬
- 면제 단위: **학생 × 회차** (회차 단위 면제). 동일 학생의 다른 회차 경고는 그대로
- **사유 필수 입력** (감사 추적용 영구 보존, 해제 후에도 row 남음)
- **해제 가능** (소프트 삭제 — `revoked_at`/`revoked_by`/`revoke_reason` 기록)

**DB (`20260601100000_cert_makeup_exemptions.sql`)**
- `cert_makeup_exemptions` 테이블 — `student_id × session_idx` partial unique (활성 면제 중복 방지)
- RLS 전체 차단, admin SECURITY DEFINER RPC 3개로만 접근
  - `set_makeup_exemption(p_student_id, p_session_idx, p_reason)` — upsert (사유 갱신 포함)
  - `revoke_makeup_exemption(p_id, p_revoke_reason)` — 소프트 삭제
  - `get_makeup_exemptions()` — 활성 면제 목록 + 학생명

**UI ([20HA 2기 현황] → Make-up 대상자)**
- 각 경고 셀에 "제외" 버튼 → 사유 입력 모달 (비어있으면 적용 비활성)
- 하단 "🛡️ 면제 적용 목록" 섹션 — 학생/회차/사유/등록일 + 행별 "해제" 버튼

### Playwright 검증
- 권순혁 4회차 제외 → 대상자 5명→4명, 면제 목록 정상 노출
- 해제 → 대상자 4명→5명 복원, 면제 목록 사라짐 확인

---

## v2026.06.01-1 — 2026-06-01
**커밋:** [171a40d](https://github.com/MinDaehyeon/20ha-meta-x/commit/171a40d)

### 주요 변경

**Critical 버그 수정 — 회원가입 실패**
- 증상: 이메일 OTP 인증 완료(`✓ 인증완료`) 후 "가입하기" 버튼 클릭 시 "오류가 발생했습니다. 잠시 후 다시 시도해주세요." 표시. updateUser 네트워크 호출 자체가 일어나지 않음.
- 원인: `verifyOtp` 성공이 임시 세션을 만들면서 `onAuthStateChange`의 `SIGNED_IN`을 발화 → 핸들러가 `loadUserData(sess)` 호출 → 가입 진행 중이라 `profiles` row가 아직 없음 → "프로필 없음 → 강제 `signOut`" 정책이 동작 → 사용자가 가입 버튼을 누르는 시점엔 이미 세션이 죽어 있음 → `updateUser`가 client-side "Auth session missing" throw → 영문 fallback이 잡혀 사용자에게는 일반 오류 메시지로 표시됨.
- 수정 (1f45c61, 171a40d): `signupInProgressRef` 추가. `AuthScreen`이 가입 모드 진입/이탈을 콜백 prop(`onSignupModeChange`)으로 `App`에 알리고, `App`의 SIGNED_IN 핸들러는 ref가 true일 때 `setSession(sess)`만 하고 `loadUserData`를 건너뜀. 가입 완료(또는 모드 해제) 시 ref가 자동 false로 돌아가 다른 SIGNED_IN 흐름엔 영향 없음.

### Playwright 검증
- dev 프리뷰에서 학생 회원가입 → OTP 인증 → 가입하기 → "가입 완료!" 화면 정상 표시 확인
- 관리자 로그인 → 회원 관리에서 승인 처리 정상 확인

---

## v2026.05.29-1 — 2026-05-29
**커밋:** [0b15966](https://github.com/MinDaehyeon/20ha-meta-x/commit/0b15966)

### 주요 변경

**Critical 버그 수정**
- **무한 로딩 픽스** (40bacd7): `onAuthStateChange`의 `INITIAL_SESSION` 이벤트(sess=null)가 `SIGNED_OUT` 분기에 잘못 걸려 비로그인 첫 방문이 `sessionExpired` 상태로 떨어지던 문제. 라우터에 매칭 분기 없어 메인 화면으로 떨어지면서 `profile=null` crash → 화면 깨짐(스피너 잔존). INITIAL_SESSION은 즉시 return, SIGNED_OUT은 이전 state가 `ready`/`pending`일 때만 sessionExpired로 전이하도록 수정.

**보안 점검 후속 (사용자 요청 [A][B])**
- supabase.js anon key·URL 하드코딩 fallback 제거. 환경변수 미설정 시 명시 throw → Vercel 빌드 실패로 즉시 발견 가능.
- App.jsx의 데드코드 `fillDemo` 함수(테스트 자격증명 하드코딩 `test@20ha.kr / test1234!`) 제거.

**App.jsx 리팩토링 Phase A (7459 → 7180줄, −279)**
- `src/styles/` — theme/inject (T, GRAPH, EI_COLOR, css, sliderFill, injectStyles)
- `src/components/` — icons/ui (HI, navIcon, Kakao/Google/Naver, Card, Pill, NavyNum, SectionTitle, Divider, Spinner, ChartTip)
- `src/utils/` — constants/grade/roster2/draft (QUANT/QUAL/SUBJECTS/ERR/GRADES, calcGrade/gradeInfo/calcEI, ROSTER2/isLateByDeadline 등)
- 동작 변경 0, 분리만

**E2E 자동 테스트 도입**
- `@playwright/test` + GitHub Actions workflow (push/PR/manual 트리거)
- 3개 시나리오: 로그인 (학생·관리자·실패) / 회원가입 UI 검증 / 학생 카페 인증 그래프
- CI 통과 사이클 확립, PR마다 자동 회귀 차단
- `GITHUB_STEP_SUMMARY` 노출로 admin 권한 없이도 stdout 확인 가능

**엣지케이스 보강**
- **중복 클릭 방지**: 인증글 회차 편집 모달의 save에 `certSessionSaving` 가드, OTP 재전송 버튼에 `loading.sendOtp` 가드
- **세션 만료 처리**: 자동 refresh 실패 시 `sessionExpired` state + `SessionExpiredModal` (fixed overlay) — 입력값·화면 유지한 채 재로그인, 성공 시 onAuthStateChange가 자동 닫음
- **입력값 백업/복원**: `src/utils/draft.js` (debounce 500ms localStorage), DataInputForm·회원가입(비번 제외)·ProfileModal 3개 폼 적용, 제출 성공 시 자동 clear

**회원가입 플로우 안정화 4건**
- 2기 자동 연동 결과(`try_link_2ki_on_signup` jsonb) 활용 — `ambiguous`(동명이인) 발생 시 가입 완료 화면에 안내 (관리자 수동 연동 요청)
- `profiles` upsert 실패 시 좀비 계정 자동 정리 (`signOut` + `cleanup_incomplete_signup`) + OTP 인증 상태 초기화
- 가입 마지막 `signOut` 실패 catch (approval_status=pending 안전망 의존)
- 학부모 자녀 검색 0건 시 `auth_email_exists`로 추가 확인 → "승인 대기" vs "미가입" 구분 안내 (ParentHomeView + ParentDashboard)

**Make-up 알고리즘 조정**
- 1주차(1·2회 = 5/20·5/24) 적응 기간으로 검사 제외, 3회차부터 카운트

### 배경
운영 차단 무한 로딩 버그 즉시 해소 + 보안·테스트·UX 안정성 종합 개선. 학습 입력·채점 중 네트워크 끊김·세션 만료·새로고침에 자동 복원, 가입 부분 실패 시 좀비 계정 자동 정리, PR마다 자동 회귀 검증으로 운영 신뢰성 향상.

### 작업 일정
- 2026-05-28: 코드 분리(A) / E2E(B) / 엣지케이스(C) / 가입(D)
- 2026-05-29: 수동 전체 검증 중 무한 로딩 버그 발견 → 즉시 픽스, Make-up 1주차 제외

---

## v2026.05.27-3 — 2026-05-27
**커밋:** [78a87b0](https://github.com/MinDaehyeon/26-04-12-meta-x/commit/78a87b0)

### 주요 변경

**학년 정보 RLS 차단 우회**
- 원인: `profiles_select` 정책이 `auth.uid()=id`로 본인 row만 허용 → 학생/학부모가 다른 학생 학년 못 읽음 → BEST 3 카드가 "학년 정보 로딩 중..." 무한
- 해결: `get_student_grades()` SECURITY DEFINER RPC 추가 (student role + 비테스트만, name/grade/birth만 노출)
- 클라이언트: `supabase.from("profiles").select(...)` → `supabase.rpc("get_student_grades")` 교체

### DB 마이그레이션
- `20260527110000_get_student_grades.sql`

### 보안 가이드라인 (memory 반영)
- RLS self-only 테이블 우회 시 SECURITY DEFINER RPC + 컬럼 최소화 원칙 명문화

---

## v2026.05.27-2 — 2026-05-27
**커밋:** [2d823ba](https://github.com/MinDaehyeon/20ha-meta-x/commit/2d823ba)

### 주요 변경

**학부모 자녀 인증현황 조회 버그 수정**
- `StudentCertView`가 학부모 화면에서도 본인용 RPC를 호출하던 문제 → 학부모 본인 데이터(0건)만 가져옴
- 신규 RPC `get_child_cafe_certs(p_child_id)`, `get_child_attendance_logs(p_child_id)` 추가 (parent_students 검증)
- `viewerMode` prop 추가 (`"self"`/`"parent"`)로 자녀 조회 시 child RPC 호출

**`get_my_cafe_certs` RPC 갱신 (부수 효과로 해결)**
- 기존엔 `completeness_score`만 반환 → 학생 본인 화면 카드의 제출/미션/충실도가 항상 "—"로 표시되던 문제
- `submit_score / mission_score / fidelity_score / session_override` 컬럼 추가 반환

### DB 마이그레이션
- `20260527100000_child_cert_attendance_rpc.sql`

---

## v2026.05.27-1 — 2026-05-27
**커밋:** [e1ac397](https://github.com/MinDaehyeon/20ha-meta-x/commit/e1ac397)

### 주요 변경

**일정 조정**
- 미라클 나이트 마지막 7/11(토) 일정 제외 → 48일 → 47일 (학생·관리자 모든 화면 자동 반영)

**카페 인증 세부 점수 표기**
- 학생 [나의 카페 인증 현황] 회차 카드: 제출/미션/충실도 + 종합 4값 표시, 80점 미만 빨간색 강조
- 학생 화면 하단에 점수 가이드라인 추가 (3분할 50/30/20 항목별 설명)
- 관리자 [인증글 점수표] 셀: 제출/미션/충실도 + 종합 함께 표시 (셀 폭 28→70px, 높이 38→60px, 글자 크기 강화)

**카페 인증 점수 그래프**
- 미니 카드 4 → 5개 (전체 누적 평균 카드 신설)
- 라벨 명확화: "내 평균" → "내 누적 평균", "최고/최저" → "내 최고/최저 점수", "전체 대비" → "전체 평균 대비"
- 점수 "점", 횟수 "회" 단위 추가
- ReferenceLine 라벨 포맷 통일: 안전선(80), 내 누적 평균(N)

**Make-up 알고리즘 개선**
- 누적 경고 2회 → **연속 경고 2회** 발생 시 대상자로 변경
- 카드 라벨 "경고 N회" → "연속 N회 경고 (총 M회)"

**지각 기준 완화**
- 회차일 다음날 **12:00 KST**까지 정시 인정 (예: 5/20 회차 → 5/21 12:00까지 정시)
- `isLateByDeadline(posted_at, sessionDate)` 외부 헬퍼로 일원화, 4개 화면(학생/관리자 채점/회차별 확인/전체 현황) 일관 적용
- 크롤러는 이미 `writeDateTimestamp`로 KST 시·분·초 정확히 수집 중 → 수정 불필요

**인증글 채점 검색·필터**
- 🔍 학생명·제목·닉네임 부분일치 검색
- 회차(1~16회+날짜), 점수 상태(채점완료/미채점/80점미만), 정시·지각 드롭다운
- 필터 활성 시 결과 카운트 + ✕ 초기화 버튼

### 배경
2기 진행 중 운영 피드백 즉시 반영. 학생 본인 점검 화면(점수 가이드라인, 세부 점수 카드, 5번째 누적평균 카드)을 강화해 자기점검 루프를 명확히 만들고, 관리자 채점 효율 위해 검색·필터 추가. 지각 기준 완화로 새벽 작성 케이스를 정시 인정.

---

## v2026.05.26-1 — 2026-05-26
**커밋:** [010d54b](https://github.com/MinDaehyeon/20ha-meta-x/commit/010d54b)

### 주요 변경

**인증글 점수 체계 개편 (3분할)**
- 단일 100점 → 제출(50) + 필수미션(30) + 내용충실도(20) 합산 100점
- DB: `submit_score`/`mission_score`/`fidelity_score` 컬럼 추가, `update_cert_scores` RPC 시그니처 변경
- 인증글 채점 모달: 3칸 입력 + 종합 자동 합산
- 인증글 표/명단 점수표: 4열(제출/미션/충실도/종합) + 80점 미만 빨간색 강조

**[20HA 2기 현황] 메뉴 통합 — 6개 하위 탭으로 재편**
- 전체 현황 / 인증글 점수표 / 인증글 채점 / 회차별 확인 / Make-up / 출석체크
- 기존 사이드바 항목(인증글 관리·출석체크) 제거, `/cert`·`/attendance`·`/makeup` URL은 backward-compat

**회차 매칭 고도화 (다중 회차 + 수동 지정)**
- DB: `session_override smallint[]` 컬럼 + `update_cert_sessions` RPC
- 작성일 기반 자동 회차가 기본, 인증글 채점 화면에서 수동으로 다중 회차 지정 가능 (지각 글·여러 회차 겸용 글 대응)
- 명단 그리드도 회차 단위 매칭으로 변경 (정시·지각 모두 셀에 잡힘)

**회차별 확인 / Make-up**
- 회차별 확인: 통계 5개(전체/제출/미제출/제출률/평균) + 미제출자 명단 + 80점 미만 명단
- Make-up: 미제출(어제 이전 회차 한정) OR 80점 미만 → 경고, 2회 이상 누적자 카드 리스트

**학생 화면 — 카페 인증 점수 그래프**
- '나의 카페 인증 현황' 아래 신규 카드: 회차별 막대(80↑ 초록·80↓ 빨강) + 회차별 전체 평균 꺾은선
- 기준선: 안전선(80)·내 평균 — 라벨 자동 분리 (좌·우/위·아래)
- 미니 카드: 내 평균 · 80점 이상 횟수 · 최고/최저 · 전체 대비 차이
- DB: `get_class_cert_session_avgs` RPC (테스트학생 제외, 학생당 회차당 최고점)

**랭킹 그룹화**
- '같은 학년 BEST 3' → 초등부/중등부/고등부 BEST 3 (라벨 자동)

**버그 수정**
- 명단 그리드 회차 매칭 누락 (5/21~5/23 글이 5/20 셀에 안 잡히던 문제)
- roster2 통합 후 `loadCertRecords` 누락으로 인증글 채점 빈 상태 버그

### DB 마이그레이션
- `20260526100000_cert_score_3parts.sql`
- `20260526200000_cert_session_override.sql`
- `20260526300000_class_cert_session_avgs.sql`

### 배경
2기 운영 본격화에 맞춰, 인증글 채점·회차 관리·학생 본인 피드백 루프를 한 번에 정비. 점수 체계가 세분화되어 학생 본인이 어디서 점수가 깎였는지 자기점검할 수 있고, Make-up 메뉴로 관리자가 누적 부진자를 빠르게 식별 가능.

---

## v2026.05.22-3 — 2026-05-22
**커밋:** [c55ba4a](https://github.com/MinDaehyeon/20ha-meta-x/commit/c55ba4a)

### 주요 변경
- **만점 테스트 학생/학부모 화면 임시 숨김** — 관리자 검토 단계로 운영, 학생 사이드바·학부모 자녀 메뉴에서 항목 제거, `/manjeom` 및 `child-manjeom-*` 라우트도 비활성. 관리자(admin)만 접근 가능.

### 배경
관리자가 만점 테스트 기능을 충분히 검증하고 운영 안정화될 때까지 학생/학부모 노출 보류. 백엔드(DB·RPC·Storage)는 그대로 유지되어 검증 완료 후 메뉴 항목만 다시 노출하면 됨.

---

## v2026.05.22-2 — 2026-05-22
**커밋:** [89ae0af](https://github.com/MinDaehyeon/20ha-meta-x/commit/89ae0af)

### 주요 변경
- **만점 테스트 기능 신규** — 시험지를 모두 정답으로 맞출 때까지 반복하는 학습 훈련
  - 관리자: 📚 문항 관리 / 🗂️ 시험지 관리 / 👥 배정 관리 / 📊 결과(시험지별·학생별)
  - 학생/학부모: 본인 또는 자녀의 만점 테스트 메뉴, 카드 목록 → 풀이 → 통과까지 답안 보존
  - 문항: 단답형(복수 정답 후보) + 객관식(2~10개 보기, 다중 정답·다중 선택)
  - 문제 이미지 업로드 (Supabase Storage, 2MB 이하)
  - 문항 Q-N ID, 태그 칩 표시·검색 (본문·태그·번호 통합 검색)
  - 통과/실패 모달, 시도 횟수에 따라 격려 메시지 변주
- **비밀번호 찾기 사전 체크** — 가입되지 않은 이메일이면 "가입되지 않은 이메일입니다" 안내 (이전에는 무조건 "보냈다"고만 응답)
- **20HA 2기 자동 연동** — 학생 회원가입 시 `cert_students` 명단과 이름 1:1 매칭되면 자동으로 2기 회원으로 연결, 기존 가입 학생 30명 백필 완료

### 백그라운드 변경
- DB: `manjeom_*` 5개 테이블 + 10개 RPC + Supabase Storage `manjeom-images` 버킷 신설
- DB: `cert_students.linked_profile_id` 컬럼 + `try_link_2ki_on_signup` RPC
- DB: `auth_email_exists` RPC (비밀번호 찾기용)
- `get_child_manjeom_tests` RPC 권한 픽스 (학생 본인 호출 허용)
- `.gitignore` 강화 — tools/ 운영 스크립트(관리 토큰 포함)·.env.vercel 커밋 차단
- CHANGELOG.md 시작, 버전 태깅 체계 정착

---

## v2026.05.22-1 — 2026-05-22
**커밋:** [dceae6b](https://github.com/MinDaehyeon/20ha-meta-x/commit/dceae6b)

### 주요 변경
- 학생 8주 일정 카드 셀 크기 통일 및 wrap 복원 (7/12 추가만 유지)
- 카페 인증 주 분할만 5/20(수) 기준 적용 — 1주(5/20,5/24) ~ 8주(7/8,7/12) 표시
- 학부모 화면 재구성: 자녀 아이디 관리 + 자녀별 사이드바 메뉴 (학생 컴포넌트 재사용)
- 인증글 채점 회차에 날짜 병기 (예: "1회 (5/20)")
- 명단 인증 합계 한 줄 표시 (예: "1/16")
- 출석 RPC UPSERT-only로 전환 (기존 데이터 보존)
- 만점 테스트 관리자 메뉴 골격 추가

### 백그라운드 변경
- attendance_logs 테이블 마이그레이션 + 7개 CSV 재이관(252건)
- ROSTER2 명단 45명 확정 (한유찬·문성민 추가, 7/12 카페 인증 추가)

---
