// 학년/등급/EI 계산 헬퍼 — App.jsx에서 분리 (2026-05-28)
// 동작 변경 0

// birth_year + birth_month(optional, null이면 3월 기준) → "초4" 같은 학년 문자열
export const calcGrade = (birthYear, birthMonth) => {
  if (!birthYear) return "";
  const now = new Date();
  const schoolYear = (birthMonth ?? now.getMonth() + 1) >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const n = schoolYear - birthYear - 6;
  if (n < 1) return "미취학";
  if (n <= 6) return `초${n}`;
  if (n <= 9) return `중${n - 6}`;
  if (n <= 12) return `고${n - 9}`;
  return "졸업";
};

// EI 등급(S/A/B/C/D) + 표시 색
export const gradeInfo = s => s>=93?{g:"S",c:"#16A34A"}:s>=81?{g:"A",c:"#2563EB"}:s>=66?{g:"B",c:"#111827"}:s>=51?{g:"C",c:"#F97316"}:{g:"D",c:"#DC2626"};

// EI 계산: 전략수행 40% + 효율성 20% + 메타인지 40%
export const calcEI = ({strategyScore:s,efficiencyIndex:e,metacognitionAccuracy:m}) => +(s*0.4+e*0.2+m*0.4).toFixed(1);
