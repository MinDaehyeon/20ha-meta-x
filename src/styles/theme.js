// 디자인 토큰 — App.jsx에서 분리 (2026-05-28)
// 동작 변경 0: 기존 정의를 그대로 옮김

export const T = {
  bg:"#F7F8FC", surface:"#FFFFFF", surfaceAlt:"#F0F2FA",
  border:"#E2E6F3", borderStrong:"#C8CEED",
  navy:"#191D54", navyLight:"#252B7A", navyMid:"#3D4499",
  orange:"#F68B1E", orangeLight:"#FFA94D", orangePale:"#FFF3E0",
  text:"#191D54", textMid:"#4A5080", muted:"#8B91C0",
  white:"#FFFFFF", danger:"#E8394A", success:"#16A34A",
  warn:"#F59E0B",
  grad:"linear-gradient(135deg,#191D54,#3D4499)",
  gradOrange:"linear-gradient(135deg,#F68B1E,#FFA94D)",
};

export const GRAPH = {
  ccColor:"#16A34A", ciColor:"#E8394A", icColor:"#F68B1E", iiColor:"#7C3AED",
  errQ:["#E8394A","#F87171","#FECACA"], errM:["#F68B1E","#FFA94D","#FED7AA"],
  speed:"#0891B2",
};

export const EI_COLOR  = v => v>=85?GRAPH.ccColor:v>=70?T.navy:v>=55?GRAPH.icColor:GRAPH.ciColor;

export const css = {
  input:  {width:"100%",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:14,boxSizing:"border-box",outline:"none"},
  select: {width:"100%",background:"#ffffff",border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:"#1a1a2e",fontSize:14,colorScheme:"light"},
  label:  {fontSize:12,color:T.muted,marginBottom:6,display:"block",letterSpacing:"0.04em",fontWeight:700},
  btnPrimary:  {background:T.grad,border:"none",borderRadius:10,padding:"12px 28px",color:T.white,fontSize:14,fontWeight:800,cursor:"pointer"},
  btnOrange:   {background:T.gradOrange,border:"none",borderRadius:10,padding:"12px 28px",color:T.white,fontSize:14,fontWeight:800,cursor:"pointer"},
  btnGhost:    {background:"transparent",border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 20px",color:T.textMid,fontSize:13,cursor:"pointer"},
  btnOutline:  {background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 14px",color:T.textMid,fontSize:12,cursor:"pointer"},
};

export const sliderFill = (value, min, max, color) => {
  const pct = ((value - min) / (max - min)) * 100;
  return { width: "100%", color, background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #E8EAF6 ${pct}%, #E8EAF6 100%)` };
};
