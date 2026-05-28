// 전역 스타일 주입 — App.jsx에서 분리 (2026-05-28)
// 동작 변경 0: 기존 함수를 그대로 옮김. 호출은 App.jsx 모듈 로드 시점에서 그대로 일어남.

export const injectStyles = () => {
  if (document.getElementById("20ha-styles")) return;
  const el = document.createElement("style");
  el.id = "20ha-styles";
  el.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100;300;400;500;700;900&display=swap');
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
    .logo-20ha { font-family: 'SandollGothicNeo','Sandoll Gothic Neo','산돌고딕 Neo','Noto Sans KR',sans-serif !important; }
    * { box-sizing: border-box; }
    input, select, button { font-family: 'Noto Sans KR', sans-serif; }
    ::-webkit-scrollbar { width: 7px; height: 7px; }
    select option { background-color: #ffffff !important; color: #1a1a2e !important; }
    input[type=range] { background: transparent; }
    input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 4px; outline: none; }
    input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 4px; background: transparent; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--thumb-color, #191D54); cursor: pointer; margin-top: -7px; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
    input[type=range]::-moz-range-track { height: 4px; border-radius: 4px; background: #E8EAF6; }
    input[type=range]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #191D54; cursor: pointer; border: none; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
    input[type=range]::-moz-range-progress { background: currentColor; height: 4px; border-radius: 4px; }
    ::-webkit-scrollbar-track { background: #F0F2FA; }
    ::-webkit-scrollbar-thumb { background: #C8CEED; border-radius: 4px; }
  `;
  document.head.appendChild(el);
};
