// 학습 관련 상수 — App.jsx에서 분리 (2026-05-28)
// 동작 변경 0

export const QUANT_ITEMS = ["white-out RPT","실수제로테스트","코넬 노트","백지목차 테스트","마인드맵","위클리 티칭 미션"];
export const QUAL_ITEMS  = ["10배빠른 복습법","데이터 채점법","웜업슬라이딩","슬립온리콜","유형/비유형 학습","5분 누적복습"];
export const SUBJECTS    = ["수학","영어","국어","과학","사회","한국사"];

export const SUBJECT_CONFIG = {
  "수학":   { qLevels:true,  showQM:true,
    quant:["white-out RPT","백지목차 테스트","마인드맵","위클리 티칭 미션"],
    qual:["10배빠른 복습법","데이터 채점법","웜업슬라이딩"] },
  "과학":   { qLevels:false, showQM:false,
    quant:["white-out RPT","코넬 노트","백지목차 테스트","마인드맵","위클리 티칭 미션"],
    qual:["5분 누적복습","슬립온리콜","데이터 채점법","웜업슬라이딩"] },
  "사회":   { qLevels:false, showQM:false,
    quant:["white-out RPT","코넬 노트","백지목차 테스트","마인드맵","위클리 티칭 미션"],
    qual:["5분 누적복습","슬립온리콜","데이터 채점법","웜업슬라이딩"] },
  "한국사": { qLevels:false, showQM:false,
    quant:["white-out RPT","코넬 노트","백지목차 테스트","마인드맵","위클리 티칭 미션"],
    qual:["5분 누적복습","슬립온리콜","데이터 채점법","웜업슬라이딩"] },
  "영어":   { qLevels:false, showQM:false,
    quant:["white-out RPT"], qual:["데이터 채점법"] },
  "국어":   { qLevels:false, showQM:false,
    quant:["white-out RPT"], qual:["데이터 채점법"] },
};

export const ERR_CODES   = ["Q1","Q2","Q3","M1","M2","M3"];
export const ERR_LABELS  = { Q1:"개념 미숙지", Q2:"추론 실패", Q3:"지식 공백", M1:"계산 실수", M2:"문제 오독", M3:"단순 실수" };
export const GRADES      = ["초1","초2","초3","초4","초5","초6","중1","중2","중3","고1","고2","고3"];
