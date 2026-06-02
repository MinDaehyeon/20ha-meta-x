// 20HA 2기 명단/일정 상수 + 헬퍼 — App.jsx에서 분리 (2026-05-28)
// 동작 변경 0

export const ROSTER2 = [
  {name:"강예나",  phone:"010-5463-7565"}, {name:"김가흔",  phone:"010-7277-4530"},
  {name:"김은채",  phone:"010-2565-9756"}, {name:"김태준",  phone:"010-7282-5241"},
  {name:"박재현",  phone:"010-3889-4881"}, {name:"손연재",  phone:"010-2658-1189"},
  {name:"윤준원",  phone:"010-3560-4433"}, {name:"최지유",  phone:"010-5913-3385"},
  {name:"배정윤",  phone:"010-6686-6462"}, {name:"심수윤",  phone:"010-2079-0009"},
  {name:"한설아",  phone:"010-3288-1931"}, {name:"강가인",  phone:"010-3952-3253"},
  {name:"권민유",  phone:"010-4355-2933"}, {name:"권순혁",  phone:"010-6220-0745"},
  {name:"최유주",  phone:"010-7928-0050"}, {name:"김도현",  phone:"010-2265-9013"},
  {name:"김시원",  phone:"010-9289-4397"}, {name:"김시윤",  phone:"010-3788-2478"},
  {name:"김아란",  phone:"010-5410-8405"}, {name:"김준범",  phone:"010-2797-3039"},
  {name:"김지우",  phone:"010-9458-2447"}, {name:"김호진",  phone:"010-4528-8226"},
  {name:"나지성",  phone:"010-9625-1379"}, {name:"문지유",  phone:"010-6496-1389"},
  {name:"박지우",  phone:"010-8330-6779"}, {name:"서소윤",  phone:"010-9996-9761"},
  {name:"서지우",  phone:"010-9269-1336"}, {name:"송민건",  phone:"010-9004-2926"},
  {name:"양소윤",  phone:"010-9111-3700"}, {name:"오수연",  phone:"010-3286-6880"},
  {name:"우정훈",  phone:"010-3833-8315"}, {name:"윤서준",  phone:"010-9283-9400"},
  {name:"이유빈",  phone:"010-6451-9510"}, {name:"이홍윤",  phone:"010-8504-9798"},
  {name:"임다은",  phone:"010-8183-9283"}, {name:"정유진",  phone:"010-8880-7759"},
  {name:"박선율",  phone:"010-2776-9111"}, {name:"한채린",  phone:"010-5298-7970"},
  {name:"오수빈",  phone:"010-3286-6880"}, {name:"남희수",  phone:"010-8965-5948"},
  {name:"김가인",  phone:"010-4549-0142"}, {name:"양은정",  phone:"010-7232-0795"},
  {name:"테스트학생", phone:"010-0000-0000"},
  {name:"한유찬",  phone:"010-3288-1931"}, // 신규 (2026-05-22, idx=43)
  {name:"문성민",  phone:"010-6496-1389"}, // 신규 (2026-05-22, idx=44)
];

const _genDates = (days) => {
  const result = [];
  for (let w = 0; w < 8; w++)
    for (let d = 0; d < 7; d++) {
      const dt = new Date(2026, 4, 17 + w*7 + d);
      if (days.includes(dt.getDay())) result.push(dt);
    }
  return result;
};

// 카페 인증: 5/20부터 시작, 매주 수/일 + 마지막 7/12 추가 (총 16일)
// 모닝/나잇과 동일한 5/17 기준 주 구분으로 표시됨
export const ROSTER2_NAVER_DATES   = _genDates([0, 3])
  .filter(d => !(d.getFullYear()===2026 && d.getMonth()===4 && d.getDate()===17))
  .concat([new Date(2026, 6, 12)]); // 7/12 일요일
export const ROSTER2_MORNING_DATES = _genDates([1, 3, 5]);
// 미라클 나이트 일정 — 5/17 시작, 수요일 제외 (일·월·화·목·금·토)
// 예외:
//   - 7/11(토) 일정상 제외
//   - 5/29(금) → 6/3(수)로 일정 이동 (전체 출석 처리는 DB attendance_logs로 일괄 INSERT됨)
export const ROSTER2_NIGHT_DATES   = _genDates([0, 1, 2, 4, 5, 6])
  .filter(d => !(d.getFullYear()===2026 && d.getMonth()===6 && d.getDate()===11))
  .filter(d => !(d.getFullYear()===2026 && d.getMonth()===4 && d.getDate()===29))
  .concat([new Date(2026, 5, 3)])
  .sort((a, b) => a - b);

export const ROSTER2_DAY_KO  = ['일','월','화','수','목','금','토'];
export const roster2FmtKey   = (dt) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
export const roster2Fmt      = (dt) => `${dt.getMonth()+1}/${dt.getDate()}`;

// 출석 인정 임계값 (분): 미라클 모닝 15분 이상, 나잇 50분 이상 참여 시 출석
// participation_minutes === null 은 면제·행사(예: 6/3 일정변경, 김도현 영작수업) — 출석 인정
export const MIN_ATTENDANCE_MINUTES = { M: 15, N: 50 };
// 유예 기간: 2026-06-02(나잇)까지의 회차는 시간 무관, 참여(기록 존재)하면 인정 (운영 결정)
export const ATTENDANCE_GRACE_UNTIL = '2026-06-02';
// 회차일 기준 실효 임계값(분). 유예 기간 내(<=6/2)면 0 → 참여만 하면 인정.
export const attendanceThreshold = (sessionType, sessionDate) => {
  const d = sessionDate ? String(sessionDate).slice(0, 10) : null;
  if (d && d <= ATTENDANCE_GRACE_UNTIL) return 0;
  return MIN_ATTENDANCE_MINUTES[sessionType] ?? 0;
};
export const isValidAttendance = (sessionType, minutes, sessionDate) => {
  if (minutes === null || minutes === undefined) return true; // 면제/행사
  return minutes >= attendanceThreshold(sessionType, sessionDate);
};

// 카페 인증 지각 판정: 회차일 다음날 12:00 KST 까지는 정시 인정
// sessionDate: ROSTER2_NAVER_DATES의 Date (KST 자정), posted_at: ISO 또는 Date
export const isLateByDeadline = (posted_at, sessionDate) => {
  if (!sessionDate) return false;
  const deadlineMs = sessionDate.getTime() + 36 * 3600 * 1000; // +1일 12시간
  return new Date(posted_at).getTime() > deadlineMs;
};

// 2기 출석 데이터 (사용 안 함 — DB attendance_logs로 마이그레이션 완료)
// 5/17~5/22 기존 데이터는 모두 attendance_logs에 저장되어 있음
// 새 출석은 /attendance 메뉴에서 CSV 업로드로 추가
export const INIT_ATTENDANCE2 = {};
