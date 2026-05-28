import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell,
  PieChart, Pie, Legend, ReferenceLine, ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { supabase } from "./supabase";

// ══════════════════════════════════════════════════════
// HEROICONS — outline style (인라인 SVG, 설치 불필요)
// ══════════════════════════════════════════════════════
const HI = {
  _svg: (path, sz=20, c="currentColor", sw=1.6) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={sw} stroke={c} width={sz} height={sz} style={{display:"block",flexShrink:0}}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path}/>
    </svg>
  ),
  sun:   (sz=20,c="currentColor") => HI._svg("M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z",sz,c),
  moon:  (sz=20,c="currentColor") => HI._svg("M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z",sz,c),
  trophy:(sz=20,c="currentColor") => HI._svg("M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0",sz,c),
  cap:   (sz=20,c="currentColor") => HI._svg("M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5",sz,c),
  calendar:(sz=20,c="currentColor") => HI._svg("M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.005H12v-.005Zm-.001 4.5h.006v.006h-.006v-.006Zm-2.25.001h.005v.005H9.75v-.005Zm-2.25 0h.005v.005H7.5v-.005Zm6.75-2.25h.005v.005h-.005v-.005Zm0 2.25h.005v.005h-.005v-.005Zm2.25-4.5h.005v.005H16.5v-.005Zm0 2.25h.005v.005H16.5v-.005Z",sz,c),
  search:(sz=20,c="currentColor") => HI._svg("m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z",sz,c),
  users: (sz=20,c="currentColor") => HI._svg("M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",sz,c),
  user:  (sz=20,c="currentColor") => HI._svg("M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z",sz,c),
  bell:  (sz=20,c="currentColor") => HI._svg("M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0",sz,c),
  chart: (sz=20,c="currentColor") => HI._svg("M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",sz,c),
  clipboard:(sz=20,c="currentColor") => HI._svg("M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z",sz,c),
  check: (sz=20,c="currentColor") => HI._svg("M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",sz,c),
  warn:  (sz=20,c="currentColor") => HI._svg("M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z",sz,c),
  camera:(sz=20,c="currentColor") => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.6} stroke={c} width={sz} height={sz} style={{display:"block",flexShrink:0}}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"/>
    </svg>
  ),
};
// 아이콘 키 → JSX 렌더 헬퍼
const navIcon = (key, sz=18, color="currentColor") => {
  const map = {trophy:HI.trophy, cap:HI.cap, calendar:HI.calendar, search:HI.search, users:HI.users, user:HI.user, clipboard:HI.clipboard, bell:HI.bell, chart:HI.chart};
  return (map[key]?.(sz, color)) || <span style={{fontSize:sz}}>{key}</span>;
};

// ══════════════════════════════════════════════════════
// FONT INJECT — Sandoll Gothic Neo + Noto Sans KR fallback
// ══════════════════════════════════════════════════════
const injectStyles = () => {
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
injectStyles();

const sliderFill = (value, min, max, color) => {
  const pct = ((value - min) / (max - min)) * 100;
  return { width: "100%", color, background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #E8EAF6 ${pct}%, #E8EAF6 100%)` };
};

// ══════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════
const QUANT_ITEMS = ["white-out RPT","실수제로테스트","코넬 노트","백지목차 테스트","마인드맵","위클리 티칭 미션"];
const QUAL_ITEMS  = ["10배빠른 복습법","데이터 채점법","웜업슬라이딩","슬립온리콜","유형/비유형 학습","5분 누적복습"];
const SUBJECTS    = ["수학","영어","국어","과학","사회","한국사"];
const SUBJECT_CONFIG = {
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
const ERR_CODES   = ["Q1","Q2","Q3","M1","M2","M3"];
const ERR_LABELS  = { Q1:"개념 미숙지", Q2:"추론 실패", Q3:"지식 공백", M1:"계산 실수", M2:"문제 오독", M3:"단순 실수" };
const GRADES      = ["초1","초2","초3","초4","초5","초6","중1","중2","중3","고1","고2","고3"];
// birth_year + birth_month(optional, null이면 3월 기준) → "초4" 같은 학년 문자열
const calcGrade = (birthYear, birthMonth) => {
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

// ══════════════════════════════════════════════════════
// DESIGN TOKENS
// ══════════════════════════════════════════════════════
const T = {
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
const GRAPH = {
  ccColor:"#16A34A", ciColor:"#E8394A", icColor:"#F68B1E", iiColor:"#7C3AED",
  errQ:["#E8394A","#F87171","#FECACA"], errM:["#F68B1E","#FFA94D","#FED7AA"],
  speed:"#0891B2",
};
const EI_COLOR  = v => v>=85?GRAPH.ccColor:v>=70?T.navy:v>=55?GRAPH.icColor:GRAPH.ciColor;
const gradeInfo = s => s>=93?{g:"S",c:"#16A34A"}:s>=81?{g:"A",c:"#2563EB"}:s>=66?{g:"B",c:"#111827"}:s>=51?{g:"C",c:"#F97316"}:{g:"D",c:"#DC2626"};
const calcEI    = ({strategyScore:s,efficiencyIndex:e,metacognitionAccuracy:m}) => +(s*0.4+e*0.2+m*0.4).toFixed(1);

// ══════════════════════════════════════════════════════
// RESPONSIVE
// ══════════════════════════════════════════════════════
const useMobile = () => {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h=()=>setM(window.innerWidth<768); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return m;
};

// ══════════════════════════════════════════════════════
// BASE COMPONENTS
// ══════════════════════════════════════════════════════
const Card = ({children,style={}}) => (
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 6px rgba(25,29,84,0.06)",animation:"fadeIn 0.3s ease",...style}}>{children}</div>
);
const Pill = ({children,color=T.navy}) => (
  <span style={{background:color+"18",color,border:`1px solid ${color}30`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,letterSpacing:"0.04em",whiteSpace:"nowrap"}}>{children}</span>
);
const NavyNum = ({value,unit="",size=32,color=T.navy}) => (
  <div style={{display:"flex",alignItems:"baseline",gap:3}}>
    <span style={{fontSize:size,fontWeight:900,color,fontFamily:"'DM Mono','Courier New',monospace",lineHeight:1}}>{value}</span>
    {unit&&<span style={{fontSize:12,color:T.muted,fontWeight:600}}>{unit}</span>}
  </div>
);
// sub = "tag1 · tag2 · tag3" string, tooltip = detailed explanation
const SectionTitle = ({children,sub,tooltip}) => {
  const [show,setShow] = useState(false);
  const [pos,setPos]   = useState({x:0,y:0});
  const tags = sub ? sub.split(" · ") : [];
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{fontSize:14,fontWeight:800,color:T.navy}}>{children}</div>
        {tooltip&&(
          <div onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setPos({x:r.left,y:r.bottom+6});setShow(true);}}
               onMouseLeave={()=>setShow(false)}
               style={{width:16,height:16,borderRadius:"50%",background:T.muted+"30",display:"flex",alignItems:"center",justifyContent:"center",cursor:"help",flexShrink:0}}>
            <span style={{fontSize:10,color:T.muted,fontWeight:800}}>?</span>
          </div>
        )}
      </div>
      {tags.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:"3px 8px",marginTop:4}}>
          {tags.map((t,i)=>(
            <span key={i} style={{fontSize:10,color:T.muted,wordBreak:"keep-all",overflowWrap:"break-word"}}>
              {i>0&&<span style={{color:T.border,marginRight:4}}>·</span>}{t}
            </span>
          ))}
        </div>
      )}
      {show&&tooltip&&(
        <div style={{position:"fixed",...(pos.x+316>window.innerWidth?{right:8,left:"auto"}:{left:pos.x}),top:pos.y,zIndex:9999,pointerEvents:"none",
          background:T.navy,color:T.white,borderRadius:10,padding:"12px 16px",fontSize:12,
          width:300,lineHeight:1.8,boxShadow:"0 4px 20px rgba(0,0,0,0.25)"}}>
          {tooltip.split(/\\n|\n/).map((line,i)=>
            line===""
              ? <div key={i} style={{height:6}}/>
              : <div key={i}>{line}</div>
          )}
        </div>
      )}
    </div>
  );
};
const Divider = () => <div style={{height:1,background:T.border,margin:"16px 0"}} />;
const Spinner = ({size=24,color=T.navy}) => (
  <div style={{width:size,height:size,border:`3px solid ${T.border}`,borderTop:`3px solid ${color}`,borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}} />
);
const ChartTip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",fontSize:11,boxShadow:"0 2px 8px rgba(25,29,84,0.10)"}}>
      <div style={{color:T.muted,marginBottom:4,fontWeight:600,fontSize:10}}>{label}</div>
      {payload.map((p,i)=>{const v=p.value;const displayName=p.name==="value"?label:p.name;const isErrCode=/^[QM][1-3]$/.test(displayName);const isSpeed=displayName==="기본"||displayName==="응용"||displayName==="심화";const isCount=isErrCode||displayName&&(displayName.includes("회")||displayName.includes("건")||displayName.includes("오답")||displayName.includes("횟수"));const disp=typeof v==="number"?(Number.isInteger(v)||isCount||isSpeed?Math.round(v):v.toFixed(1)):v;if(isErrCode)return<div key={i} style={{color:p.color||T.navy,fontWeight:700,fontSize:12,lineHeight:1.8}}>{displayName} {disp}</div>;return<div key={i} style={{color:p.color||T.navy,fontWeight:700,fontSize:11}}>{displayName}: {disp}{isSpeed?"초":isCount?"회":""}</div>;})}
    </div>
  );
};
const css = {
  input:  {width:"100%",background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:T.text,fontSize:14,boxSizing:"border-box",outline:"none"},
  select: {width:"100%",background:"#ffffff",border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",color:"#1a1a2e",fontSize:14,colorScheme:"light"},
  label:  {fontSize:12,color:T.muted,marginBottom:6,display:"block",letterSpacing:"0.04em",fontWeight:700},
  btnPrimary:  {background:T.grad,border:"none",borderRadius:10,padding:"12px 28px",color:T.white,fontSize:14,fontWeight:800,cursor:"pointer"},
  btnOrange:   {background:T.gradOrange,border:"none",borderRadius:10,padding:"12px 28px",color:T.white,fontSize:14,fontWeight:800,cursor:"pointer"},
  btnGhost:    {background:"transparent",border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 20px",color:T.textMid,fontSize:13,cursor:"pointer"},
  btnOutline:  {background:"transparent",border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 14px",color:T.textMid,fontSize:12,cursor:"pointer"},
};

// 생년월일 입력 공통 컴포넌트 (년/월/일 세 드롭다운) — T 선언 이후에 위치해야 함
// showGrade=true 이면 학년 태그 표시 (학생용)
const BirthInput = ({year, month, day, onYear, onMonth, onDay, showGrade=false}) => {
  const grade = showGrade ? calcGrade(year ? Number(year) : null, month ? Number(month) : null) : null;
  const selStyle = {padding:"9px 6px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:14,fontFamily:"'Noto Sans KR',sans-serif",background:"#fff",cursor:"pointer"};
  const curYear = new Date().getFullYear();
  return (
    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
      <select value={year||""} onChange={e=>onYear(e.target.value)} style={{...selStyle,flex:"1 1 90px"}}>
        <option value="">년도</option>
        {Array.from({length:curYear-1950+1},(_,i)=>curYear-i).map(y=><option key={y} value={y}>{y}년</option>)}
      </select>
      <select value={month||""} onChange={e=>onMonth(e.target.value)} style={{...selStyle,flex:"1 1 70px"}}>
        <option value="">월</option>
        {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}월</option>)}
      </select>
      <select value={day||""} onChange={e=>onDay(e.target.value)} style={{...selStyle,flex:"1 1 70px"}}>
        <option value="">일</option>
        {Array.from({length:31},(_,i)=><option key={i+1} value={i+1}>{i+1}일</option>)}
      </select>
      {grade && <span style={{fontSize:12,color:T.muted,whiteSpace:"nowrap"}}>({grade})</span>}
    </div>
  );
};

// ══════════════════════════════════════════════════════
// LOGO COMPONENT
// "project 20HA" — 20 얇게, 나머지 볼드, 산돌고딕체
// ══════════════════════════════════════════════════════
const Logo = ({size="md", dark=false, onClick=null, headerMode=false}) => {
  const c = dark ? T.white : T.navy;
  const s = size==="lg" ? {project:12,num:44,meta:44} : size==="md" ? {project:10,num:24,meta:24} : {project:8,num:18,meta:18};
  if(headerMode) {
    // 헤더: META - X 만 표시
    return (
      <div onClick={onClick} style={{display:"inline-flex",alignItems:"baseline",gap:0,cursor:onClick?"pointer":"default",lineHeight:1}}>
        <span style={{fontSize:s.meta,fontWeight:100,color:c,letterSpacing:"-0.02em",lineHeight:1}}>META </span>
        <span style={{fontSize:s.meta,fontWeight:300,color:c,letterSpacing:"-0.02em",lineHeight:1}}>– </span>
        <span style={{fontSize:s.meta,fontWeight:700,color:c,letterSpacing:"-0.02em",lineHeight:1}}>X</span>
      </div>
    );
  }
  return (
    <div className="logo-20ha" onClick={onClick} style={{display:"inline-flex",flexDirection:"column",lineHeight:1,gap:3,cursor:onClick?"pointer":"default"}}>
      <div style={{display:"flex",alignItems:"baseline",gap:4}}>
        <span style={{fontSize:s.project,fontWeight:700,color:dark?T.white:T.navy,letterSpacing:"0.04em"}}>Project</span>
        <span style={{fontSize:s.project,fontWeight:400,color:dark?"rgba(255,255,255,0.8)":"rgba(25,29,84,0.6)",letterSpacing:"0.04em"}}>20</span>
        <span style={{fontSize:s.project,fontWeight:700,color:dark?T.white:T.navy,letterSpacing:"0.04em"}}>HA</span>
      </div>
      <div style={{display:"flex",alignItems:"baseline",gap:0}}>
        <span style={{fontSize:s.num,fontWeight:100,color:c,letterSpacing:"-0.02em",lineHeight:1}}>META </span>
        <span style={{fontSize:s.num,fontWeight:300,color:c,letterSpacing:"-0.02em",lineHeight:1}}>– </span>
        <span style={{fontSize:s.num,fontWeight:700,color:c,letterSpacing:"-0.02em",lineHeight:1}}>X</span>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// SOCIAL LOGIN BUTTONS
// ══════════════════════════════════════════════════════
const SocialBtn = ({icon,label,color,bg,border,onClick,loading}) => (
  <button onClick={onClick} disabled={loading}
    style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"12px 16px",borderRadius:10,border:`1px solid ${border||T.border}`,background:bg||T.white,color:color||T.text,fontSize:14,fontWeight:700,cursor:"pointer",transition:"all 0.15s",marginBottom:8,opacity:loading?0.7:1}}>
    {loading ? <Spinner size={18}/> : <span style={{fontSize:20,lineHeight:1}}>{icon}</span>}
    <span>{label}</span>
  </button>
);

// 카카오 로고 SVG
const KakaoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E">
    <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.74 1.618 5.148 4.075 6.585L5.1 20.7a.3.3 0 00.435.337l4.182-2.79A11.6 11.6 0 0012 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
  </svg>
);

// 구글 로고 SVG
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// 네이버 로고
const NaverIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
  </svg>
);

// ══════════════════════════════════════════════════════
// PASSWORD RESET SCREEN
// ══════════════════════════════════════════════════════
const PasswordResetScreen = ({ onDone }) => {
  const [newPw, setNewPw]   = useState("");
  const [newPwC, setNewPwC] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);
  const [err, setErr]       = useState("");
  const isMobile = useMobile();

  const handleReset = async () => {
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if(newPw !== newPwC){ setErr("비밀번호가 일치하지 않습니다."); return; }
    if(!pwRegex.test(newPw)){ setErr("영문 대소문자, 특수문자 포함 8자 이상이어야 합니다."); return; }
    setSaving(true); setErr("");
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if(error){ setErr("변경 실패: " + error.message); return; }
    setDone(true);
    setTimeout(onDone, 2000);
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Noto Sans KR',sans-serif",padding:20}}>
      <Card style={{width:"100%",maxWidth:400,padding:"40px 36px"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <Logo size="md"/>
        </div>
        <div style={{fontSize:20,fontWeight:800,color:T.navy,marginBottom:6}}>새 비밀번호 설정</div>
        <div style={{fontSize:13,color:T.muted,marginBottom:20}}>사용할 새 비밀번호를 입력해주세요.</div>
        {done ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}>{HI.check(48,"#16A34A")}</div>
            <div style={{fontSize:15,fontWeight:700,color:T.navy}}>비밀번호가 변경됐어요!</div>
            <div style={{fontSize:13,color:T.muted,marginTop:6}}>잠시 후 로그인 화면으로 이동합니다...</div>
          </div>
        ) : (
          <form onSubmit={e=>{e.preventDefault();handleReset();}} autoComplete="new-password">
            <div style={{display:"grid",gap:12,marginBottom:12}}>
              <div>
                <label style={css.label}>새 비밀번호 <span style={{fontWeight:400,color:T.muted}}>(대소문자+특수문자 8자↑)</span></label>
                <input name="new-password" type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" style={css.input}/>
              </div>
              <div>
                <label style={css.label}>새 비밀번호 확인</label>
                <input name="new-password-confirm" type="password" value={newPwC} onChange={e=>setNewPwC(e.target.value)} placeholder="••••••••" autoComplete="new-password" style={css.input}/>
              </div>
            </div>
            {err && <div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:T.danger,marginBottom:12}}>{err}</div>}
            <button type="submit" disabled={saving} style={{...css.btnPrimary,width:"100%",padding:"13px 0",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {saving?<><Spinner size={18} color="#fff"/>변경 중...</>:"비밀번호 변경"}
            </button>
          </form>
        )}
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// AUTH SCREEN — 로그인 + 소셜 + 데모 버튼
// ══════════════════════════════════════════════════════
const AuthScreen = ({ onLogin }) => {
  const [loading, setLoading] = useState({});
  const [error, setError]     = useState("");
  const [email, setEmail]     = useState(()=>localStorage.getItem("20ha_saved_email")||"");
  const [pw, setPw]           = useState("");
  const [rememberMe, setRememberMe] = useState(()=>!!localStorage.getItem("20ha_saved_email"));
  const [mode, setMode]       = useState("login"); // "login"|"signup"
  const [suRole, setSuRole]   = useState("student"); // "student" | "parent"
  const [suName, setSuName]   = useState("");
  const [suBirthYear, setSuBirthYear]   = useState("");
  const [suBirthMonth, setSuBirthMonth] = useState("");
  const [suBirthDay, setSuBirthDay]     = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPw, setSuPw]       = useState("");
  const [suPwC, setSuPwC]     = useState("");
  const [suTarget, setSuTarget] = useState(85);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [ageAgreed, setAgeAgreed] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [fpEmail, setFpEmail] = useState("");
  const [fpSent, setFpSent] = useState(false);
  const isMobile = useMobile();

  const setLoad = (k,v) => setLoading(p=>({...p,[k]:v}));

  const handleLogin = async (overrideEmail, overridePw) => {
    const e = overrideEmail || email;
    const p = overridePw   || pw;
    if(!e||!p){ setError("이메일과 비밀번호를 입력하세요."); return; }
    if(mode==="login"&&p.length<8){ setError("비밀번호를 확인해주세요."); return; }
    setLoad("email",true); setError("");
    const {data,error:err} = await supabase.auth.signInWithPassword({email:e, password:p});
    setLoad("email",false);
    if(err){ setError(translateSupabaseError(err.message)); return; }
    if(rememberMe) localStorage.setItem("20ha_saved_email", e);
    else localStorage.removeItem("20ha_saved_email");
    // Chrome 비밀번호 저장 프롬프트 트리거
    if(window.PasswordCredential) {
      try {
        const cred = new window.PasswordCredential({ id: e, password: p });
        await navigator.credentials.store(cred);
      } catch(_) {}
    }
    onLogin(data.session);
  };

  const handleForgotPassword = async () => {
    if(!fpEmail){ setError("이메일을 입력해주세요."); return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fpEmail)){ setError("유효하지 않은 이메일 형식입니다."); return; }
    setLoad("fp", true); setError("");
    // 1) 가입된 이메일인지 사전 체크 (Supabase는 보안상 항상 success를 반환하므로 RPC로 별도 확인)
    const { data: exists, error: chkErr } = await supabase.rpc("auth_email_exists", { p_email: fpEmail });
    if(chkErr){
      setLoad("fp", false);
      setError("확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if(!exists){
      setLoad("fp", false);
      setError("가입되지 않은 이메일입니다. 이메일을 확인하거나 회원가입을 진행해주세요.");
      return;
    }
    // 2) 실제 재설정 메일 발송
    const { error:err } = await supabase.auth.resetPasswordForEmail(fpEmail, {
      redirectTo: "https://meta-x.ai.kr"
    });
    setLoad("fp", false);
    if(err){ setError(translateSupabaseError(err.message)); return; }
    setFpSent(true);
  };

  const handleSendOtp = async () => {
    setError("");
    if(!suEmail){ setError("이메일을 입력해주세요."); return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suEmail)){ setError("유효하지 않은 이메일 형식입니다."); return; }
    setLoad("sendOtp",true);
    const tempPw = `Tmp${Date.now()}`;
    let { data: signUpData, error:err } = await supabase.auth.signUp({ email:suEmail, password:tempPw });
    // 케이스 1: 명시적 "already registered" 에러
    // 케이스 2: identities=[] → 이미 인증된 이메일 (확인된 기존 계정)
    // 케이스 3: identities 있지만 created_at이 과거 → OTP 보냈지만 인증 안 한 기존 계정
    //           → cleanup 후 재생성해야 새 OTP가 확실히 발송됨
    const createdAgo = signUpData?.user?.created_at
      ? Date.now() - new Date(signUpData.user.created_at).getTime()
      : 0;
    const isExisting =
      (err && (err.message.toLowerCase().includes("already registered") || err.message.toLowerCase().includes("already been registered"))) ||
      (!err && signUpData?.user?.identities?.length === 0) ||
      (!err && signUpData?.user?.identities?.length > 0 && createdAgo > 10000);
    if(isExisting) {
      err = null;
      const { data: cleaned } = await supabase.rpc("cleanup_incomplete_signup", { p_email: suEmail });
      if(cleaned) {
        const retry = await supabase.auth.signUp({ email:suEmail, password:tempPw });
        err = retry.error;
      } else {
        err = { message: "already registered" };
      }
    }
    setLoad("sendOtp",false);
    if(err){ setError(translateSupabaseError(err.message)); return; }
    setOtpSent(true); setOtpVerified(false); setOtpCode("");
  };

  const handleVerifyOtp = async () => {
    if(otpCode.length !== 6){ setError("6자리 코드를 입력해주세요."); return; }
    setLoad("otp",true); setError("");
    const {error:err} = await supabase.auth.verifyOtp({ email:suEmail, token:otpCode, type:"signup" });
    setLoad("otp",false);
    if(err){
      const m = err.message?.toLowerCase() || "";
      if(m.includes("expired") || m.includes("otp_expired") || m.includes("token has expired")){
        setError("인증 코드가 만료되었습니다. 인증 메일을 다시 요청해주세요.");
        setOtpSent(false); setOtpCode(""); // 인증 메일 보내기 버튼으로 돌아가기
      } else {
        setError("인증 코드가 올바르지 않습니다. 다시 확인해주세요.");
      }
      return;
    }
    setOtpSent(false); setOtpVerified(true);
  };

  const handleSignup = async () => {
    setError("");
    if(!otpVerified){ setError("이메일 인증을 먼저 완료해주세요."); return; }
    if(!termsAgreed||!privacyAgreed||!ageAgreed){ setError("필수 동의 항목을 모두 체크해 주세요."); return; }
    if(!suName||!suPw){ setError("모든 항목을 입력해 주세요."); return; }
    if(suName.trim()!==suName||suName.includes(" ")){ setError("이름에 공백을 포함할 수 없습니다."); return; }
    if(suName.trim().length<2){ setError("이름은 2자 이상 입력해주세요."); return; }
    const pwRegex=/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if(suPw!==suPwC){ setError("비밀번호가 일치하지 않습니다."); return; }
    if(!pwRegex.test(suPw)){ setError("비밀번호는 영문 대소문자, 특수문자를 포함한 8자 이상이어야 합니다."); return; }
    setLoad("signup",true);
    const {data,error:err} = await supabase.auth.updateUser({
      password:suPw, data:{name:suName, grade:suRole==="student"?calcGrade(Number(suBirthYear),suBirthMonth?Number(suBirthMonth):null):"", target_ei:85, role:suRole}
    });
    if(err){
      // 세션 유지 — 사용자가 바로 재시도 가능
      setLoad("signup",false);
      setError(translateSupabaseError(err.message));
      return;
    }
    if(data?.user){
      const { error:profErr } = await supabase.from("profiles").upsert({
        id:data.user.id, name:suName,
        grade:suRole==="student"?calcGrade(Number(suBirthYear),null):"",
        birth_year:suBirthYear?Number(suBirthYear):null,
        birth_month:suBirthMonth?Number(suBirthMonth):null,
        birth_day:suBirthDay?Number(suBirthDay):null,
        target_ei:85, role:suRole, approval_status:"pending"
      });
      if(profErr){
        setLoad("signup",false);
        setError("프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
        return;
      }
      // 학생 회원가입 시 20HA 2기 명단(cert_students)과 이름 매칭되면 자동 연동
      if(suRole === "student"){
        try {
          await supabase.rpc("try_link_2ki_on_signup", { p_profile_id: data.user.id, p_name: suName.trim() });
        } catch (e) { /* 실패해도 가입 자체는 성공 처리 */ }
      }
    }
    await supabase.auth.signOut();
    setLoad("signup",false);
    setSignupDone(true);
  };

  const translateSupabaseError = (msg) => {
  if(!msg) return "오류가 발생했습니다.";
  const m = msg.toLowerCase();
  if(m.includes("already registered")||m.includes("already been registered")||m.includes("user already")) return "이미 가입된 이메일입니다.";
  if(m.includes("invalid login")||m.includes("invalid credentials")||m.includes("invalid email or password")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if(m.includes("email not confirmed")) return "이메일 인증이 완료되지 않았습니다.";
  if(m.includes("too many requests")||m.includes("too many")) return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  if(m.includes("user not found")) return "등록되지 않은 이메일입니다.";
  if(m.includes("signup is disabled")||m.includes("signups not allowed")) return "현재 신규 가입이 비활성화되어 있습니다.";
  if(m.includes("password should be")) return "비밀번호는 영문 대소문자, 특수문자를 포함한 8자 이상이어야 합니다.";
  if(m.includes("unable to validate email")) return "유효하지 않은 이메일 형식입니다.";
  if(m.includes("email address") && m.includes("invalid")) return "유효하지 않은 이메일 형식입니다.";
  if(m.includes("network")) return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
  if(m.includes("token has expired")||m.includes("otp_expired")) return "인증 코드가 만료되었습니다. 인증 메일을 다시 요청해주세요.";
  if(m.includes("expired")) return "세션이 만료되었습니다. 다시 시도해주세요.";
  // 영어 메시지 그대로 노출 방지 - 알 수 없는 오류
  if(/[a-zA-Z]{4,}/.test(msg) && !/[가-힣]/.test(msg)) return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  return msg;
};
const handleSocial = async (provider) => {
    setLoad(provider,true); setError("");
    const {error:err} = await supabase.auth.signInWithOAuth({
      provider, options:{ redirectTo: window.location.origin }
    });
    if(err){ setError(translateSupabaseError(err.message)); setLoad(provider,false); }
  };

  const brandPanel = (
    <div style={{flex:1,background:T.grad,display:"flex",flexDirection:"column",justifyContent:"center",padding:"60px 64px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-80,right:-80,width:400,height:400,background:"rgba(255,255,255,0.04)",borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-120,left:-60,width:500,height:500,background:"rgba(246,139,30,0.1)",borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{position:"relative"}}>
        <Logo size="lg" dark />
        <div style={{height:1,background:"rgba(255,255,255,0.15)",margin:"28px 0"}}/>
        <div style={{fontSize:15,color:"rgba(255,255,255,0.6)",lineHeight:1.85,maxWidth:340,marginBottom:40}}>
          보이지 않던 공부의 과정을 데이터로 읽어내다.<br/>Meta-X, 성장의 흐름을 기록하는 학습 시스템
        </div>
        {[
          {icon:"clipboard",text:"학습데이터 기록 — 공부 시간, 수행 여부, 이해도 등 학습 과정을 데이터로 기록합니다."},
          {icon:"chart",    text:"학습 상태 시각화 — 아이의 학습 흐름과 현재 상태를 한눈에 확인할 수 있습니다."},
          {icon:"search",   text:"학습 패턴 분석 — 반복적으로 막히는 지점과 공부 습관을 데이터로 분석합니다."},
          {icon:"check",    text:"자기점검 시스템 — 학생이 자신의 학습을 스스로 점검하고 조정하도록 돕습니다."},
        ].map(f=>(
          <div key={f.text} style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            <div style={{width:34,height:34,background:"rgba(255,255,255,0.1)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {HI[f.icon]?.(18,"rgba(255,255,255,0.85)")}
            </div>
            <span style={{fontSize:14,color:"rgba(255,255,255,0.7)"}}>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 가입 완료 화면
  if(signupDone) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",fontFamily:"'Noto Sans KR',sans-serif"}}>
      {!isMobile && brandPanel}
      <div style={{width:isMobile?"100%":480,background:T.surface,borderLeft:isMobile?"none":`1px solid ${T.border}`,display:"flex",flexDirection:"column",justifyContent:"center",padding:"48px 44px"}}>
        <div style={{textAlign:"center"}}>
          <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}>{HI.check(52,"#16A34A")}</div>
          <div style={{fontSize:20,fontWeight:800,color:T.navy,marginBottom:8}}>가입 완료!</div>
          <div style={{fontSize:14,color:T.textMid,lineHeight:1.8,marginBottom:24}}>
            관리자 승인 후 로그인하실 수 있습니다.<br/>담당 선생님께 승인을 요청해 주세요.
          </div>
          <button onClick={()=>{setSignupDone(false);setMode("login");}} style={{...css.btnPrimary,padding:"12px 32px"}}>로그인 화면으로</button>
        </div>
      </div>
    </div>
  );

  const loginForm = (
    <div>
      <div style={{fontSize:22,fontWeight:900,color:T.navy,marginBottom:4}}>
        {mode==="login"?"로그인":mode==="forgot"?"비밀번호 찾기":"회원가입"}
      </div>
      <div style={{fontSize:13,color:T.muted,marginBottom:20}}>
        {mode==="login"?"계정으로 로그인하세요.":mode==="forgot"?"가입 시 사용한 이메일을 입력해주세요.":"계정을 만들어 학습을 시작하세요."}
      </div>

      {mode==="login" && (
        <form onSubmit={e=>{e.preventDefault();handleLogin();}} autoComplete="on">
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0"}}>
            <div style={{flex:1,height:1,background:T.border}}/>
            <span style={{fontSize:12,color:T.muted,fontWeight:600}}>이메일로 로그인</span>
            <div style={{flex:1,height:1,background:T.border}}/>
          </div>

          <div style={{marginBottom:12}}>
            <label style={css.label}>이메일</label>
            <input name="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" autoComplete="email" style={css.input}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={css.label}>비밀번호</label>
            <input name="password" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" style={css.input}/>
          </div>
          <div onClick={()=>setRememberMe(v=>!v)} style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,cursor:"pointer"}}>
            <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${rememberMe?T.navy:T.borderStrong}`,background:rememberMe?T.navy:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
              {rememberMe&&<span style={{color:T.white,fontSize:11,lineHeight:1,fontWeight:800}}>✓</span>}
            </div>
            <span style={{fontSize:13,color:T.textMid,userSelect:"none"}}>자동 로그인</span>
          </div>

          {error && <div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:T.danger,marginBottom:12}}>{error}</div>}

          <button type="submit" disabled={loading.email} style={{...css.btnPrimary,width:"100%",padding:"13px 0",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading.email?<><Spinner size={18} color="#fff"/>로그인 중...</>:"로그인 →"}
          </button>

          <div style={{textAlign:"center",marginTop:10,fontSize:12}}>
            <span onClick={()=>{setMode("forgot");setError("");setFpSent(false);setFpEmail("");}} style={{color:T.muted,cursor:"pointer",textDecoration:"underline"}}>비밀번호를 잊으셨나요?</span>
          </div>
          <div style={{textAlign:"center",marginTop:10,fontSize:13,color:T.muted}}>
            계정이 없으신가요? <span onClick={()=>{setMode("signup");setError("");}} style={{color:T.orange,fontWeight:700,cursor:"pointer"}}>이메일로 가입</span>
          </div>
        </form>
      )}

      {mode==="forgot" && (<>
        {fpSent ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:40,marginBottom:14}}>📧</div>
            <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:8}}>이메일을 보냈어요!</div>
            <div style={{fontSize:13,color:T.textMid,lineHeight:1.8,marginBottom:20}}>
              <strong>{fpEmail}</strong>로 비밀번호 재설정 링크를 보냈어요.<br/>
              이메일을 확인하고 링크를 클릭해 주세요. (스팸함도 확인!)
            </div>
            <button onClick={()=>{setMode("login");setFpSent(false);setError("");}} style={{...css.btnGhost,padding:"10px 28px"}}>로그인으로 돌아가기</button>
          </div>
        ) : (<>
          <div style={{marginBottom:12}}>
            <label style={css.label}>이메일</label>
            <input value={fpEmail} onChange={e=>setFpEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleForgotPassword()} placeholder="가입 시 사용한 이메일" style={css.input}/>
          </div>
          {error && <div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:T.danger,marginBottom:12}}>{error}</div>}
          <button onClick={handleForgotPassword} disabled={loading.fp} style={{...css.btnPrimary,width:"100%",padding:"13px 0",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading.fp?<><Spinner size={18} color="#fff"/>전송 중...</>:"재설정 이메일 보내기"}
          </button>
          <div style={{textAlign:"center",marginTop:14,fontSize:13,color:T.muted}}>
            <span onClick={()=>{setMode("login");setError("");}} style={{color:T.navy,fontWeight:700,cursor:"pointer"}}>← 로그인으로 돌아가기</span>
          </div>
        </>)}
      </>)}

      {mode==="signup" && (<>
        {/* 역할 선택 */}
        <div style={{display:"flex",gap:8,marginBottom:16,background:T.surfaceAlt,borderRadius:10,padding:4}}>
          {[{v:"student",icon:"cap",label:"학생"},{v:"parent",icon:"users",label:"학부모"}].map(({v,icon,label})=>(
            <button key={v} onClick={()=>setSuRole(v)}
              style={{flex:1,padding:"9px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,
                background:suRole===v?T.navy:"transparent",color:suRole===v?T.white:T.muted,transition:"all 0.15s",
                display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              {navIcon(icon,13,suRole===v?T.white:T.muted)} {label}
            </button>
          ))}
        </div>
        <div style={{display:"grid",gap:12,marginBottom:12}}>
          <div><label style={css.label}>이름 <span style={{color:"#e53e3e"}}>*</span></label><input value={suName} onChange={e=>setSuName(e.target.value)} placeholder="홍길동" required style={css.input}/></div>
          <div>
            <label style={css.label}>생년월일 <span style={{color:"#e53e3e"}}>*</span></label>
            <BirthInput year={suBirthYear} month={suBirthMonth} day={suBirthDay}
              onYear={setSuBirthYear} onMonth={setSuBirthMonth} onDay={setSuBirthDay}
              showGrade={suRole==="student"}/>
          </div>

          <div>
            <label style={css.label}>이메일</label>
            <div style={{display:"flex",gap:8}}>
              <input value={suEmail} onChange={e=>{setSuEmail(e.target.value);setOtpSent(false);setOtpVerified(false);setOtpCode("");}} placeholder="example@email.com" disabled={otpVerified} style={{...css.input,flex:1,opacity:otpVerified?0.6:1}}/>
              {otpVerified
                ? <span style={{flexShrink:0,color:"#16A34A",fontWeight:700,fontSize:13,padding:"0 8px"}}>✓ 인증완료</span>
                : <button onClick={handleSendOtp} disabled={loading.sendOtp||otpSent} style={{...css.btnPrimary,padding:"0 14px",fontSize:12,fontWeight:700,whiteSpace:"nowrap",flexShrink:0,opacity:otpSent?0.5:1}}>
                    {loading.sendOtp?<Spinner size={14} color="#fff"/>:otpSent?"재전송":"인증메일 보내기"}
                  </button>
              }
            </div>
          </div>
          {otpSent&&(
            <div style={{background:"#F0F8FF",border:`1px solid #BFDBFE`,borderRadius:10,padding:"12px 14px"}}>
              <div style={{fontSize:12,color:"#1D4ED8",marginBottom:8,fontWeight:700}}>📧 {suEmail}으로 전송된 6자리 코드를 입력해주세요.</div>
              <div style={{display:"flex",gap:8}}>
                <input value={otpCode} onChange={e=>setOtpCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" maxLength={6}
                  style={{...css.input,flex:1,fontSize:20,fontWeight:900,textAlign:"center",letterSpacing:8,padding:"10px 14px"}}/>
                <button onClick={handleVerifyOtp} disabled={loading.otp||otpCode.length!==6}
                  style={{...css.btnPrimary,padding:"0 16px",fontSize:13,fontWeight:700,flexShrink:0,opacity:otpCode.length!==6?0.5:1}}>
                  {loading.otp?<Spinner size={14} color="#fff"/>:"확인"}
                </button>
              </div>
              <button onClick={async()=>{setOtpCode("");setError("");await handleSendOtp();}}
                style={{background:"none",border:"none",color:"#6B7280",fontSize:11,cursor:"pointer",marginTop:6,padding:0}}>코드 재전송</button>
            </div>
          )}
          <div><label style={css.label}>비밀번호 <span style={{fontWeight:400,color:T.muted}}>(대소문자+특수문자 포함 8자↑)</span></label><input type="password" value={suPw} onChange={e=>setSuPw(e.target.value)} placeholder="••••••••" style={css.input}/></div>
          <div><label style={css.label}>비밀번호 확인</label><input type="password" value={suPwC} onChange={e=>setSuPwC(e.target.value)} placeholder="••••••••" style={css.input}/></div>
        </div>
        <div style={{background:T.orangePale,border:`1px solid ${T.orange}30`,borderRadius:10,padding:"10px 14px",fontSize:12,color:T.textMid,marginBottom:12}}>
          ⚠️ 가입 후 <strong>관리자 승인</strong>이 완료되어야 로그인할 수 있습니다.
        </div>
        {/* 서비스 이용약관 동의 */}
        <div style={{border:`1px solid ${T.border}`,borderRadius:10,marginBottom:10}}>
          <div style={{height:100,overflowY:"auto",padding:"12px 14px",fontSize:11,lineHeight:1.7,color:"#555",background:"#FAFAFA",borderRadius:"10px 10px 0 0"}}>
            <div style={{fontWeight:700,color:T.navy,marginBottom:6,fontSize:12}}>서비스 이용약관</div>
            <p><strong>제1조 (목적)</strong><br/>본 약관은 (주)아이작교육그룹(이하 "회사")이 제공하는 META-X 서비스(이하 "서비스") 이용에 관한 조건을 정함을 목적으로 합니다.</p>
            <p style={{marginTop:6}}><strong>제2조 (서비스 이용)</strong><br/>서비스는 학습 데이터 기록 및 분석 기능을 제공합니다. 서비스 이용은 회원 가입 및 관리자 승인 후 가능합니다.</p>
            <p style={{marginTop:6}}><strong>제3조 (회원의 의무)</strong><br/>회원은 타인의 정보를 도용하거나 서비스를 악용해서는 안 됩니다. 정직한 학습 데이터 입력이 권장됩니다.</p>
            <p style={{marginTop:6}}><strong>제4조 (서비스 변경 및 중단)</strong><br/>회사는 운영상 필요에 따라 서비스 내용을 변경하거나 중단할 수 있으며, 이 경우 사전 공지합니다.</p>
            <p style={{marginTop:6}}><strong>제5조 (면책)</strong><br/>회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대해 책임지지 않습니다.</p>
            <p style={{marginTop:6,color:"#888"}}>문의: (주)아이작교육그룹 &nbsp;|&nbsp; ☎ 02-1522-5316</p>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderTop:`1px solid ${T.border}`}}>
            <input type="checkbox" checked={termsAgreed} onChange={e=>setTermsAgreed(e.target.checked)}
              style={{width:16,height:16,accentColor:T.navy,cursor:"pointer",flexShrink:0}}/>
            <span style={{fontSize:13,color:T.text,fontWeight:600}}>(필수) 서비스 이용약관에 동의합니다.</span>
          </label>
        </div>

        {/* 개인정보 처리방침 동의 */}
        <div style={{border:`1px solid ${T.border}`,borderRadius:10,marginBottom:10}}>
          <div style={{height:120,overflowY:"auto",padding:"12px 14px",fontSize:11,lineHeight:1.7,color:"#555",background:"#FAFAFA",borderRadius:"10px 10px 0 0"}}>
            <div style={{fontWeight:700,color:T.navy,marginBottom:6,fontSize:12}}>개인정보 처리방침</div>
            <p><strong>(주)아이작교육그룹</strong>(이하 "회사")은 META-X 서비스(이하 "서비스") 운영을 위해 아래와 같이 개인정보를 수집·이용합니다.</p>
            <p style={{marginTop:6}}><strong>1. 수집 항목</strong><br/>이름, 이메일 주소, 학년, 학습 기록 데이터</p>
            <p style={{marginTop:6}}><strong>2. 수집·이용 목적</strong><br/>회원 식별 및 가입 관리, 학습 데이터 분석·제공, 서비스 운영 및 고객 지원</p>
            <p style={{marginTop:6}}><strong>3. 보유 및 이용 기간</strong><br/>서비스 탈퇴 시까지. 단, 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간까지 보유.</p>
            <p style={{marginTop:6}}><strong>4. 개인정보 제3자 제공</strong><br/>회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.</p>
            <p style={{marginTop:6}}><strong>5. 동의 거부 권리</strong><br/>위 개인정보 수집·이용에 동의하지 않을 수 있으나, 미동의 시 서비스 이용이 제한됩니다.</p>
            <p style={{marginTop:6,color:"#888"}}>문의: (주)아이작교육그룹 &nbsp;|&nbsp; ☎ 02-1522-5316</p>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderTop:`1px solid ${T.border}`}}>
            <input type="checkbox" checked={privacyAgreed} onChange={e=>setPrivacyAgreed(e.target.checked)}
              style={{width:16,height:16,accentColor:T.navy,cursor:"pointer",flexShrink:0}}/>
            <span style={{fontSize:13,color:T.text,fontWeight:600}}>(필수) 개인정보 처리방침에 동의합니다.</span>
          </label>
        </div>
        {/* 나이 확인 */}
        <label style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:12,cursor:"pointer"}}>
          <input type="checkbox" checked={ageAgreed} onChange={e=>setAgeAgreed(e.target.checked)}
            style={{width:16,height:16,accentColor:T.navy,cursor:"pointer",flexShrink:0,marginTop:2}}/>
          <span style={{fontSize:12,color:T.textMid,lineHeight:1.6}}>
            (필수) 본인은 <strong>만 14세 이상</strong>이거나, 만 14세 미만인 경우 <strong>보호자(부모님)의 동의</strong>를 받았습니다.
          </span>
        </label>
        {error && <div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:T.danger,marginBottom:12}}>{error}</div>}
        <button onClick={handleSignup} disabled={loading.signup} style={{...css.btnOrange,width:"100%",padding:"13px 0",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:(!otpVerified||!privacyAgreed||!termsAgreed||!ageAgreed)?0.4:1}}>
          {loading.signup?<><Spinner size={18} color="#fff"/>가입 중...</>:"가입하기 →"}
        </button>
        <div style={{textAlign:"center",marginTop:14,fontSize:13,color:T.muted}}>
          이미 계정이 있으신가요? <span onClick={()=>{setMode("login");setError("");}} style={{color:T.navy,fontWeight:700,cursor:"pointer"}}>로그인</span>
        </div>
      </>)}
    </div>
  );

  if(isMobile) return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Noto Sans KR',sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{background:T.grad,padding:"48px 28px 36px",textAlign:"center"}}>
        <Logo size="lg" dark/>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",marginTop:14}}>성장의 흐름을 기록하는 학습 시스템</div>
      </div>
      <div style={{flex:1,padding:"24px 20px"}}><Card>{loginForm}</Card></div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",fontFamily:"'Noto Sans KR',sans-serif"}}>
      {brandPanel}
      <div style={{width:480,background:T.surface,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",justifyContent:"center",padding:"48px 44px",overflowY:"auto"}}>
        {loginForm}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// PROFILE SETUP SCREEN (소셜 로그인 최초 가입)
// ══════════════════════════════════════════════════════
const ProfileSetupScreen = ({user, onComplete}) => {
  const [name, setName]           = useState(user.user_metadata?.full_name||user.user_metadata?.name||"");
  const [birthYear, setBirthYear]   = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay]     = useState("");
  const [target, setTarget]     = useState(85);
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  const save = async () => {
    if(!name){ setError("이름을 입력해 주세요."); return; }
    if(!birthYear){ setError("생년월일을 입력해 주세요."); return; }
    setSaving(true);
    const by = Number(birthYear), bm = birthMonth?Number(birthMonth):null, bd = birthDay?Number(birthDay):null;
    await supabase.from("profiles").upsert({
      id:user.id, name,
      grade: calcGrade(by, bm),
      birth_year: by, birth_month: bm, birth_day: bd,
      target_ei:85, role:"student", approval_status:"pending"
    });
    setSaving(false);
    setDone(true);
  };

  if(done) return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Noto Sans KR',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <Card style={{width:"100%",maxWidth:400,textAlign:"center",padding:"40px 32px"}}>
        <div style={{fontSize:48,marginBottom:16}}>⏳</div>
        <Logo size="md"/>
        <div style={{height:1,background:T.border,margin:"20px 0"}}/>
        <div style={{fontSize:18,fontWeight:800,color:T.navy,marginBottom:8}}>승인 대기 중</div>
        <div style={{fontSize:14,color:T.textMid,lineHeight:1.8,marginBottom:24}}>
          가입 신청이 완료됐습니다.<br/>관리자 승인 후 로그인하실 수 있습니다.
        </div>
        <div style={{background:T.orangePale,border:`1px solid ${T.orange}30`,borderRadius:12,padding:"12px 16px",fontSize:13,color:T.textMid,marginBottom:24}}>
          📞 승인 관련 문의는 담당 선생님께 연락해 주세요.
        </div>
        <button onClick={onComplete} style={{...css.btnGhost,padding:"10px 28px"}}>로그인 화면으로</button>
      </Card>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Noto Sans KR',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <Card style={{width:"100%",maxWidth:420}}>
        <Logo size="md"/>
        <div style={{height:1,background:T.border,margin:"16px 0"}}/>
        <div style={{fontSize:18,fontWeight:800,color:T.navy,marginBottom:4}}>프로필 설정</div>
        <div style={{fontSize:13,color:T.muted,marginBottom:20}}>소셜 가입 완료! 아래 정보를 입력해 주세요.</div>
        <div style={{display:"grid",gap:14,marginBottom:16}}>
          <div><label style={css.label}>이름</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동" style={css.input}/></div>
          <div>
            <label style={css.label}>생년월일 <span style={{color:"#e53e3e"}}>*</span></label>
            <BirthInput year={birthYear} month={birthMonth} day={birthDay}
              onYear={setBirthYear} onMonth={setBirthMonth} onDay={setBirthDay}
              showGrade={true}/>
          </div>

        </div>
        {error && <div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:T.danger,marginBottom:12}}>{error}</div>}
        <div style={{background:T.orangePale,border:`1px solid ${T.orange}30`,borderRadius:10,padding:"10px 14px",fontSize:12,color:T.textMid,marginBottom:16}}>
          ⚠️ 저장 후 관리자 승인이 완료되어야 로그인할 수 있습니다.
        </div>
        <button onClick={save} disabled={saving} style={{...css.btnPrimary,width:"100%",padding:"13px 0",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {saving?<><Spinner size={18} color="#fff"/>저장 중...</>:"저장하고 승인 대기 →"}
        </button>
        <button onClick={async()=>{ await supabase.auth.signOut(); window.location.reload(); }}
          style={{...css.btnGhost,width:"100%",marginTop:10,padding:"10px 0",textAlign:"center"}}>
          ← 로그인 화면으로 돌아가기
        </button>
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// COMPLETE PROFILE SCREEN (가입 미완료 사용자 - 이름/비밀번호 입력)
// ══════════════════════════════════════════════════════
const CompleteProfileScreen = ({ session, onDone }) => {
  const [name, setName]           = useState("");
  const [role, setRole]           = useState("student");
  const [birthYear, setBirthYear]   = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay]     = useState("");
  const [pw, setPw]             = useState("");
  const [pwC, setPwC]           = useState("");
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  const save = async () => {
    setError("");
    if(!name.trim() || name.trim().length < 2){ setError("이름을 2자 이상 입력해주세요."); return; }
    if(!birthYear){ setError("생년월일을 입력해주세요."); return; }
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if(!pwRegex.test(pw)){ setError("비밀번호는 영문 대소문자+특수문자 8자 이상이어야 합니다."); return; }
    if(pw !== pwC){ setError("비밀번호가 일치하지 않습니다."); return; }
    setSaving(true);
    const uid = session?.user?.id;
    const by = Number(birthYear), bm = birthMonth?Number(birthMonth):null, bd = birthDay?Number(birthDay):null;
    const grd = role==="student" ? calcGrade(by, bm) : "";
    const { error: ue } = await supabase.auth.updateUser({ password: pw, data: { name, role, grade: grd } });
    if(!ue && uid) {
      await supabase.from("profiles").upsert({ id: uid, name, grade: grd, birth_year: by, birth_month: bm, birth_day: bd, role, approval_status:"pending", target_ei:85, is_active:true });
    }
    setSaving(false);
    if(ue){ setError("오류가 발생했습니다. 다시 시도해주세요."); return; }
    setDone(true);
  };

  if(done) return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Noto Sans KR',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <Card style={{width:"100%",maxWidth:400,textAlign:"center",padding:"40px 32px"}}>
        <div style={{fontSize:48,marginBottom:16}}>⏳</div>
        <Logo size="md"/>
        <div style={{height:1,background:T.border,margin:"20px 0"}}/>
        <div style={{fontSize:18,fontWeight:800,color:T.navy,marginBottom:8}}>승인 대기 중</div>
        <div style={{fontSize:14,color:T.textMid,lineHeight:1.8,marginBottom:24}}>가입 신청이 완료됐습니다.<br/>관리자 승인 후 로그인하실 수 있습니다.</div>
        <button onClick={onDone} style={{...css.btnGhost,padding:"10px 28px"}}>로그인 화면으로</button>
      </Card>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Noto Sans KR',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <Card style={{width:"100%",maxWidth:420}}>
        <Logo size="md"/>
        <div style={{height:1,background:T.border,margin:"16px 0"}}/>
        <div style={{fontSize:18,fontWeight:800,color:T.navy,marginBottom:4}}>가입 정보 입력</div>
        <div style={{fontSize:13,color:T.muted,marginBottom:20}}>이메일 인증이 완료됐습니다. 아래 정보를 입력해 가입을 완료해주세요.</div>
        <div style={{display:"grid",gap:14,marginBottom:16}}>
          <div><label style={css.label}>이름 <span style={{color:"#e53e3e"}}>*</span></label><input value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동" style={css.input}/></div>
          <div>
            <label style={css.label}>역할</label>
            <div style={{display:"flex",gap:8}}>
              {[["student","학생"],["parent","학부모"]].map(([v,l])=>(
                <button key={v} onClick={()=>setRole(v)} style={{...( role===v?css.btnPrimary:css.btnGhost),flex:1,padding:"10px 0",fontSize:13}}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={css.label}>생년월일 <span style={{color:"#e53e3e"}}>*</span></label>
            <BirthInput year={birthYear} month={birthMonth} day={birthDay}
              onYear={setBirthYear} onMonth={setBirthMonth} onDay={setBirthDay}
              showGrade={role==="student"}/>
          </div>
          <div><label style={css.label}>비밀번호 <span style={{fontWeight:400,color:T.muted,fontSize:11}}>(대소문자+특수문자 8자↑)</span></label><input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" style={css.input}/></div>
          <div><label style={css.label}>비밀번호 확인</label><input type="password" value={pwC} onChange={e=>setPwC(e.target.value)} placeholder="••••••••" style={css.input}/></div>
        </div>
        {error&&<div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:T.danger,marginBottom:12}}>{error}</div>}
        <button onClick={save} disabled={saving} style={{...css.btnOrange,width:"100%",padding:"13px 0",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {saving?<><Spinner size={18} color="#fff"/>저장 중...</>:"가입 완료 →"}
        </button>
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// DATA INPUT FORM
// ══════════════════════════════════════════════════════
const DataInputForm = ({uid, onSave, onCancel}) => {
  const [step, setStep]   = useState(0);
  const [err, setErr]     = useState("");
  const [saving, setSaving] = useState(false);
  const [saveWarnings, setSaveWarnings] = useState([]);
  const isMobile = useMobile();
  const [form, setForm]   = useState({
    date:new Date().toISOString().slice(0,10), subject:"수학", bookLevel:1,
    startTime:"", endTime:"", breakTime:0, questionCount:20,
    qBasic:0, qMid:0, qAdv:0,
    tBasic:0, tMid:0, tAdv:0,
    quant:Object.fromEntries(QUANT_ITEMS.map(k=>[k,80])),
    qual:Object.fromEntries(QUAL_ITEMS.map(k=>[k,3])),
    quantEnabled:{}, qualEnabled:{},
    coinFilter:{cc:0,ci:0,ic:0,ii:0},
    errorAnalysis:{Q1:0,Q2:0,Q3:0,M1:0,M2:0,M3:0},
  });
  const subjectCfg = SUBJECT_CONFIG[form.subject] || SUBJECT_CONFIG["수학"];
  const handleSubjectChange = s => setForm(f=>({...f, subject:s, qBasic:0, qMid:0, qAdv:0, quantEnabled:{}, qualEnabled:{}}));
  const toMin = t=>{if(!t)return 0;const[h,m]=t.split(":").map(Number);return h*60+m;};
  const netTime = Math.max(0,toMin(form.endTime)-toMin(form.startTime)-Number(form.breakTime));
  const breakRatio = Number(form.breakTime)/Math.max(1,toMin(form.endTime)-toMin(form.startTime))*100;

  // 단계별 시간 자동 분배: q값 바뀌면 균등, netTime만 바뀌면 비율 유지
  const prevQRef = useRef({qBasic:0,qMid:0,qAdv:0});
  useEffect(()=>{
    if(!subjectCfg.qLevels) return;
    const hasB=form.qBasic>0, hasM=form.qMid>0, hasA=form.qAdv>0;
    const count=[hasB,hasM,hasA].filter(Boolean).length;
    const qChanged=prevQRef.current.qBasic!==form.qBasic||prevQRef.current.qMid!==form.qMid||prevQRef.current.qAdv!==form.qAdv;
    prevQRef.current={qBasic:form.qBasic,qMid:form.qMid,qAdv:form.qAdv};
    if(count===0||netTime===0){setForm(f=>({...f,tBasic:0,tMid:0,tAdv:0}));return;}
    const distrib=(nt)=>{
      const each=Math.floor(nt/count), rem=nt%count;
      let i=0; return [hasB,hasM,hasA].map(a=>a?each+(i++<rem?1:0):0);
    };
    if(qChanged){
      const v=distrib(netTime);
      setForm(f=>({...f,tBasic:v[0],tMid:v[1],tAdv:v[2]}));
    } else {
      setForm(f=>{
        const sum=(f.tBasic||0)+(f.tMid||0)+(f.tAdv||0);
        if(sum===netTime) return f;
        if(sum===0){const v=distrib(netTime);return{...f,tBasic:v[0],tMid:v[1],tAdv:v[2]};}
        const b=hasB?Math.round((f.tBasic||0)/sum*netTime):0;
        const m=hasM?Math.round((f.tMid||0)/sum*netTime):0;
        const a=hasA?netTime-b-m:0;
        return {...f,tBasic:b,tMid:m,tAdv:Math.max(0,a)};
      });
    }
  },[form.qBasic,form.qMid,form.qAdv,netTime]);
  const metrics = (()=>{
    const aqKeys=subjectCfg.quant.filter(k=>form.quantEnabled[k]);
    const alKeys=subjectCfg.qual.filter(k=>form.qualEnabled[k]);
    const qT=aqKeys.reduce((s,k)=>s+Number(form.quant[k]||0),0);
    const qlT=alKeys.reduce((s,k)=>s+((form.qual[k]||0)/5*100),0);
    const denom=(aqKeys.length*100*1.0+alKeys.length*100*0.5)/100;
    const strategyScore=denom>0?(qT*1.0+qlT*0.5)/denom:0;
    const qB=form.qBasic||0, qM=form.qMid||0, qA=form.qAdv||0;
    // 단계별 시간 - 직접 입력값 사용 (수학), 비수학은 전체 시간을 basic으로
    const bTime=subjectCfg.qLevels?(form.tBasic||0):netTime;
    const mTime=subjectCfg.qLevels?(form.tMid||0):0;
    const aTime=subjectCfg.qLevels?(form.tAdv||0):0;
    // 단계별 문항당 소요시간(초)으로 효율성 계산
    const spB=qB>0?bTime*60/qB:0, spM=qM>0?mTime*60/qM:0, spA=qA>0?aTime*60/qA:0;
    let efficiencyIndex;
    if(subjectCfg.qLevels){
      // 수학: 기본60초, 응용90초, 심화150초 기준
      const effB=qB>0?Math.min(100,Math.max(0,100-(spB/60)*30)):null;
      const effM=qM>0?Math.min(100,Math.max(0,100-(spM/90)*35)):null;
      const effA=qA>0?Math.min(100,Math.max(0,100-(spA/150)*40)):null;
      const effVals=[effB,effM,effA].filter(v=>v!==null);
      efficiencyIndex=effVals.length>0?effVals.reduce((s,v)=>s+v,0)/effVals.length:50;
    } else {
      // 비수학: 전체 문항 기준 90초/문항
      const totalQ=qB; const sp=totalQ>0?netTime*60/totalQ:0;
      efficiencyIndex=totalQ>0?Math.min(100,Math.max(0,100-(sp/90)*30)):50;
    }
    const{cc,ci,ic,ii}=form.coinFilter; const tot=cc+ci+ic+ii;
    const metacognitionAccuracy=tot>0?((cc+ii)/tot)*100:0;
    return{strategyScore:+strategyScore.toFixed(1),efficiencyIndex:+efficiencyIndex.toFixed(1),metacognitionAccuracy:+metacognitionAccuracy.toFixed(1),engramIndex:calcEI({strategyScore,efficiencyIndex,metacognitionAccuracy}),bTime,mTime,aTime};
  })();

  const doSave = async()=>{
    setSaveWarnings([]); setSaving(true); setErr("");
    const{error}=await supabase.from("learning_logs").insert({
      uid, date:form.date, subject:form.subject, book_level:form.bookLevel,
      start_time:form.startTime, end_time:form.endTime, break_time:form.breakTime, net_time:netTime,
      question_count:(form.qBasic||0)+(form.qMid||0)+(form.qAdv||0)||form.questionCount,
      q_basic:form.qBasic||0, q_mid:form.qMid||0, q_adv:form.qAdv||0,
      t_basic:Math.round(metrics.bTime), t_mid:Math.round(metrics.mTime), t_adv:Math.round(metrics.aTime),
      strategy_score:metrics.strategyScore, efficiency_index:metrics.efficiencyIndex,
      metacognition_accuracy:metrics.metacognitionAccuracy, engram_index:metrics.engramIndex,
      coin_cc:form.coinFilter.cc, coin_ci:form.coinFilter.ci,
      coin_ic:form.coinFilter.ic, coin_ii:form.coinFilter.ii,
      err_q1:form.errorAnalysis.Q1, err_q2:form.errorAnalysis.Q2, err_q3:form.errorAnalysis.Q3,
      err_m1:form.errorAnalysis.M1, err_m2:form.errorAnalysis.M2, err_m3:form.errorAnalysis.M3,
      quant_data:form.quant, qual_data:form.qual,
    });
    setSaving(false);
    if(error){setErr("저장 오류: "+error.message);return;}
    onSave();
  };

  const save = async()=>{
    if(!form.date){setErr("⚠️ 날짜를 입력해주세요.");return;}
    if(!form.subject){setErr("⚠️ 과목을 선택해주세요.");return;}
    if(!form.startTime||!form.endTime){setErr("⚠️ 시작 시간과 종료 시간을 입력해주세요.");return;}
    if(toMin(form.endTime)<=toMin(form.startTime)){setErr("⚠️ 종료 시간이 시작 시간보다 빠릅니다.");return;}
    if(breakRatio>50){setErr("⚠️ 쉬는 시간이 전체 학습 시간의 50%를 초과했습니다.");return;}
    const totalQ=(form.qBasic||0)+(form.qMid||0)+(form.qAdv||0);
    const coinSum=Object.values(form.coinFilter).reduce((s,v)=>s+v,0);
    // 문제 풀이가 있는 경우에만 CO-IN 입력 필수
    if(totalQ>0&&coinSum===0){setErr("⚠️ CO-IN Filter를 입력해주세요.");return;}
    // 문항 수 불일치 경고 검사 (문제 풀이가 있는 경우에만)
    const warns=[];
    const{cc,ci,ic,ii}=form.coinFilter; const coinTotal=cc+ci+ic+ii;
    if(totalQ>0&&coinTotal!==totalQ) warns.push(`CO-IN 합계(${coinTotal}문항)가 총 문항 수(${totalQ}문항)와 다릅니다.`);
    if(subjectCfg.showQM&&totalQ>0){
      const qmTotal=Object.values(form.errorAnalysis).reduce((s,v)=>s+v,0);
      const wrongCount=ci+ii;
      if(qmTotal!==wrongCount) warns.push(`QM 오답 합계(${qmTotal}문항)가 오답 수 [C-I], [I-I] 합계(${wrongCount}문항)와 다릅니다.`);
    }
    if(warns.length>0){setSaveWarnings(warns);return;}
    await doSave();
  };

  const STEPS=["① 기본 정보","② 메타인지"];
  return(
    <div style={{maxWidth:820,margin:"0 auto"}}>
      {/* 진행 인디케이터 제거 — 단일 페이지 레이아웃 */}

      {err&&<div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 16px",color:T.danger,fontSize:13,marginBottom:12}}>{err}</div>}

      {(step===0||true)&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* 카드1: 날짜 · 과목 */}
          <Card>
            <div style={{fontSize:12,fontWeight:700,color:T.muted,marginBottom:12,letterSpacing:"0.06em",display:"flex",alignItems:"center",gap:5}}>{HI.calendar(12,T.muted)} 날짜 · 과목</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>
                <label style={css.label}>날짜</label>
                <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={css.input}/>
              </div>
              <div>
                <label style={css.label}>과목</label>
                <select value={form.subject} onChange={e=>handleSubjectChange(e.target.value)} style={css.select}>
                  {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </Card>
          {/* 카드2: 문항 수 */}
          <Card>
            <div style={{fontSize:12,fontWeight:700,color:T.muted,marginBottom:12,letterSpacing:"0.06em"}}>📚 문제집으로 공부한 문항 수</div>
            {subjectCfg.qLevels?(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[{label:"기본(개념, 연산) 문제",sub:"예시: A step/ 1단계",key:"qBasic",color:T.navy},{label:"응용 문제",sub:"예시: B step/ 2단계",key:"qMid",color:T.orange},{label:"심화 문제",sub:"예시: C step/ 3단계",key:"qAdv",color:"#7C3AED"}].map(({label,sub,key,color})=>(
                    <div key={key}>
                      <label style={{...css.label,color}}>{label}</label>
                      <div style={{fontSize:10,color:T.muted,marginBottom:4}}>{sub}</div>
                      <input type="number" min={0} max={200} value={form[key]||0}
                        onChange={e=>setForm(f=>({...f,[key]:Number(e.target.value)}))}
                        style={{...css.input,borderColor:color+"60",textAlign:"center",fontWeight:700,color}}/>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:10,padding:"8px 12px",background:T.surfaceAlt,borderRadius:8,fontSize:12,color:T.muted}}>
                  총 문항: <strong style={{color:T.navy}}>{(form.qBasic||0)+(form.qMid||0)+(form.qAdv||0)}문항</strong>
                </div>
              </>
            ):(
              <div style={{maxWidth:200}}>
                <label style={css.label}>총 문항 수</label>
                <input type="number" min={0} max={500} value={form.qBasic||0}
                  onChange={e=>setForm(f=>({...f,qBasic:Number(e.target.value),qMid:0,qAdv:0}))}
                  style={{...css.input,textAlign:"center",fontWeight:700,color:T.navy}}/>
              </div>
            )}
          </Card>
          {/* 카드3: 시간 */}
          <Card>
            <div style={{fontSize:12,fontWeight:700,color:T.muted,marginBottom:12,letterSpacing:"0.06em"}}>⏱ 학습 시간</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div>
                <label style={css.label}>시작 시간</label>
                <input type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))} style={css.input}/>
              </div>
              <div>
                <label style={css.label}>종료 시간</label>
                <input type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))} style={css.input}/>
              </div>
            </div>
            <label style={css.label}>쉬는 시간: <strong style={{color:T.orange}}>{form.breakTime}분</strong> · 순수 풀이: <strong style={{color:T.navy}}>{netTime}분</strong></label>
            <input type="range" min={0} max={60} value={form.breakTime} onChange={e=>setForm(f=>({...f,breakTime:Number(e.target.value)}))} style={sliderFill(form.breakTime,0,60,T.orange)}/>
            {breakRatio>50&&<div style={{fontSize:12,color:T.danger,marginTop:4}}>⚠️ 쉬는 시간 50% 초과</div>}

            {/* 단계별 풀이 시간 - 수학+문항 있을 때 표시. 드래그 bar + 직접 입력 연동 */}
            {subjectCfg.qLevels&&(form.qBasic>0||form.qMid>0||form.qAdv>0)&&netTime>0&&(()=>{
              const hasB=form.qBasic>0, hasM=form.qMid>0, hasA=form.qAdv>0;
              const activeCount=[hasB,hasM,hasA].filter(Boolean).length;
              const tB=form.tBasic||0, tM=form.tMid||0, tA=form.tAdv||0;
              const allocated=tB+tM+tA;
              // bar 비율 (netTime 기준)
              const pB=netTime>0?Math.min(100,tB/netTime*100):0;
              const pM=netTime>0?Math.min(100-pB,tM/netTime*100):0;
              const pA=netTime>0?Math.min(100-pB-pM,tA/netTime*100):0;
              // 핸들 위치 (%)
              const h1pct=activeCount===2?(hasB?pB:pM):pB;
              const h2pct=pB+pM;
              // 드래그: 1분 단위 스냅, 합계=netTime 유지
              const barRef={current:null};
              const onBarDrag=(e,ref)=>{
                if(!ref.current)return;
                const rect=ref.current.getBoundingClientRect();
                const getMins=(clientX)=>Math.round(Math.max(0,Math.min(netTime,(clientX-rect.left)/rect.width*netTime)));
                const move=(ev)=>{
                  const clientX=ev.touches?ev.touches[0].clientX:ev.clientX;
                  const mins=getMins(clientX);
                  if(activeCount===2){
                    if(hasB&&hasM){const b=Math.max(1,Math.min(netTime-1,mins));setForm(f=>({...f,tBasic:b,tMid:netTime-b}));}
                    else if(hasB&&hasA){const b=Math.max(1,Math.min(netTime-1,mins));setForm(f=>({...f,tBasic:b,tAdv:netTime-b}));}
                    else{const m=Math.max(1,Math.min(netTime-1,mins));setForm(f=>({...f,tMid:m,tAdv:netTime-m}));}
                  } else {
                    setForm(f=>{
                      const h1m=f.tBasic, h2m=f.tBasic+f.tMid;
                      if(Math.abs(mins-h1m)<=Math.abs(mins-h2m)){
                        const b=Math.max(1,Math.min(h2m-1,mins));return{...f,tBasic:b,tMid:h2m-b};
                      } else {
                        const h2=Math.max(h1m+1,Math.min(netTime-1,mins));return{...f,tMid:h2-h1m,tAdv:netTime-h2};
                      }
                    });
                  }
                };
                const up=()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);window.removeEventListener("touchmove",move);window.removeEventListener("touchend",up);};
                window.addEventListener("mousemove",move);window.addEventListener("mouseup",up);
                window.addEventListener("touchmove",move,{passive:false});window.addEventListener("touchend",up);
                e.preventDefault();
              };
              return(
                <div style={{marginTop:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.muted,marginBottom:8}}>단계별 풀이 시간
                    <span style={{fontWeight:400,marginLeft:6,fontSize:11}}>경계선을 드래그하여 조절 (1분 단위)</span>
                  </div>
                  {/* 드래그 bar */}
                  <div ref={el=>barRef.current=el}
                    style={{position:"relative",height:36,borderRadius:8,overflow:"hidden",display:"flex",cursor:"ew-resize",userSelect:"none",background:T.border}}
                    onMouseDown={e=>onBarDrag(e,barRef)} onTouchStart={e=>onBarDrag(e,barRef)}
                  >
                    {hasB&&pB>0&&<div style={{width:`${pB}%`,background:T.navy,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                      {pB>=12&&<span style={{fontSize:10,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>기본 {tB}분</span>}
                    </div>}
                    {hasM&&pM>0&&<div style={{width:`${pM}%`,background:T.orange,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                      {pM>=12&&<span style={{fontSize:10,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>응용 {tM}분</span>}
                    </div>}
                    {hasA&&pA>0&&<div style={{width:`${pA}%`,background:"#7C3AED",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                      {pA>=12&&<span style={{fontSize:10,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>심화 {tA}분</span>}
                    </div>}
                    {activeCount>=2&&<div style={{position:"absolute",left:`${h1pct}%`,top:0,bottom:0,width:3,background:"rgba(255,255,255,0.9)",transform:"translateX(-50%)",boxShadow:"0 0 4px rgba(0,0,0,0.4)",borderRadius:2}}/>}
                    {activeCount===3&&<div style={{position:"absolute",left:`${h2pct}%`,top:0,bottom:0,width:3,background:"rgba(255,255,255,0.9)",transform:"translateX(-50%)",boxShadow:"0 0 4px rgba(0,0,0,0.4)",borderRadius:2}}/>}
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>
      )}

      {(step===1||true)&&(
        <div style={{display:"flex",flexDirection:"column",gap:14,marginTop:12}}>
          <Card>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:14,display:"flex",alignItems:"center",gap:5}}>{HI.chart(13,T.navy)} CO-IN Filter</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{key:"cc",label:"C-C",desc:"맞을 것 같았고 실제로 맞음",color:GRAPH.ccColor},{key:"ci",label:"C-I",desc:"맞을 것 같았으나 틀림",color:GRAPH.ciColor},{key:"ic",label:"I-C",desc:"틀릴 것 같았으나 맞음",color:GRAPH.icColor},{key:"ii",label:"I-I",desc:"틀릴 것 같았고 실제로 틀림",color:GRAPH.iiColor}].map(({key,label,desc,color})=>(
                <div key={key} style={{background:color+"0e",border:`1px solid ${color}30`,borderRadius:12,padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <div><div style={{fontSize:14,fontWeight:800,color}}>{label}</div><div style={{fontSize:10,color:T.muted,marginTop:2,lineHeight:1.4}}>{desc}</div></div>
                    <div style={{whiteSpace:"nowrap",flexShrink:0,marginLeft:6,lineHeight:1}}>
                      <span style={{fontSize:24,fontWeight:900,color,fontFamily:"'DM Mono',monospace"}}>{form.coinFilter[key]}</span><span style={{fontSize:11,color,opacity:0.7}}>문항</span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>
                    {[0,1,2,3,4,5,6,7,8,9,10].map(n=>(
                      <div key={n} onClick={()=>setForm(f=>({...f,coinFilter:{...f.coinFilter,[key]:n}}))}
                        style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer",fontWeight:700,
                          background:form.coinFilter[key]===n?color:T.surfaceAlt,color:form.coinFilter[key]===n?T.white:T.muted,
                          border:`1px solid ${form.coinFilter[key]===n?color:T.border}`}}>{n}</div>
                    ))}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <input type="number" min={0} max={999} placeholder="직접 입력"
                      onFocus={e=>{ if(form.coinFilter[key]<=10) e.target.value=""; }}
                      onChange={e=>{ const v=e.target.value; if(v===""||v==="-") return; const n=parseInt(v,10); if(!isNaN(n)&&n>=0) setForm(f=>({...f,coinFilter:{...f.coinFilter,[key]:n}})); }}
                      style={{width:"100%",padding:"5px 8px",borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,color:T.text,background:T.white,outline:"none"}}/>
                    <span style={{fontSize:11,color:T.muted,whiteSpace:"nowrap"}}>문항</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          {subjectCfg.showQM&&(<Card>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:14}}>❌ QM 오답분석</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {ERR_CODES.map(code=>{
                const ec=code[0]==="Q"?T.danger:T.orange;
                return(
                <div key={code}>
                  <div style={{fontSize:11,textAlign:"center",marginBottom:6,color:ec,fontWeight:700}}>
                    {code}<br/><span style={{color:T.muted,fontWeight:400,fontSize:9}}>{ERR_LABELS[code]}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"center",gap:3,flexWrap:"wrap",marginBottom:4}}>
                    {[0,1,2,3,4,5].map(n=>(
                      <div key={n} onClick={()=>setForm(f=>({...f,errorAnalysis:{...f.errorAnalysis,[code]:n}}))}
                        style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,fontWeight:700,
                          background:form.errorAnalysis[code]===n?ec:T.surfaceAlt,
                          color:form.errorAnalysis[code]===n?T.white:T.muted,
                          border:`1px solid ${form.errorAnalysis[code]===n?ec:T.border}`}}>{n}</div>
                    ))}
                  </div>
                  <input type="number" min={0} max={99} placeholder="직접 입력"
                    onFocus={e=>{ if(form.errorAnalysis[code]<=5) e.target.value=""; }}
                    onChange={e=>{ const v=e.target.value; if(v===""||v==="-") return; const n=parseInt(v,10); if(!isNaN(n)&&n>=0) setForm(f=>({...f,errorAnalysis:{...f.errorAnalysis,[code]:n}})); }}
                    style={{width:"100%",padding:"4px 6px",borderRadius:6,border:`1px solid ${T.border}`,fontSize:11,color:T.text,background:T.white,outline:"none",textAlign:"center"}}/>
                </div>
              );})}
            </div>
          </Card>)}
        </div>
      )}

      {saveWarnings.length>0&&(
        <div style={{background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:12,padding:"14px 16px",marginTop:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.orange,marginBottom:8}}>⚠️ 문항 수 불일치</div>
          {saveWarnings.map((w,i)=><div key={i} style={{fontSize:12,color:T.text,marginBottom:4}}>• {w}</div>)}
          <div style={{fontSize:12,color:T.muted,marginTop:8,marginBottom:12}}>이대로 입력하시겠습니까?</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={doSave} disabled={saving} style={{...css.btnOrange,flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:13}}>
              {saving?<><Spinner size={14} color="#fff"/>저장 중...</>:"이대로 저장"}
            </button>
            <button onClick={()=>setSaveWarnings([])} style={{...css.btnGhost,flex:1,fontSize:13}}>다시 확인</button>
          </div>
        </div>
      )}
      <div style={{fontSize:11,color:T.muted,textAlign:"center",marginTop:16,marginBottom:6}}>
        ⚠️ 저장된 데이터는 수정할 수 없습니다. 입력 내용을 다시 한번 확인해 주세요.
      </div>
      {/* 하단 CTA 배너 */}
      <div style={{borderRadius:12, background:"linear-gradient(135deg,#191D54,#3D4499)", padding:"16px 20px", color:"#fff", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12}}>
        <div>
          <div style={{fontSize:13, fontWeight:700, marginBottom:2, display:"flex", alignItems:"center", gap:5}}>{HI.chart(13,"rgba(255,255,255,0.9)")} 진도를 업데이트할 준비가 됐나요?</div>
          <div style={{fontSize:11, opacity:0.7}}>입력 데이터는 매주 학습 인사이트 생성에 사용됩니다.</div>
        </div>
        <div style={{display:"flex", gap:8, flexShrink:0}}>
          <button onClick={onCancel} style={{background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, padding:"9px 16px", color:"#fff", fontSize:13, cursor:"pointer", fontWeight:600}}>취소</button>
          <button onClick={save} disabled={saving||saveWarnings.length>0} style={{background:"#F68B1E", border:"none", borderRadius:8, padding:"9px 20px", color:"#fff", fontSize:13, cursor:"pointer", fontWeight:800, display:"flex", alignItems:"center", gap:6, opacity:saveWarnings.length>0?0.4:1}}>
            {saving?<><Spinner size={14} color="#fff"/>저장 중...</>:"💾 저장"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// STUDENT DASHBOARD
// ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════
// KPI CARD WITH TOOLTIP
// ══════════════════════════════════════════════════════
const KpiCard = ({label,desc,kpi,value,unit="",color,sub,subColor,isMobile}) => {
  const [show,setShow] = useState(false);
  const [pos,setPos]   = useState({x:0,y:0});
  return (
    <Card style={{padding:"16px 18px",position:"relative"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:2}}>
        <div style={{fontSize:11,color:T.navy,fontWeight:700,lineHeight:1.4,flex:1}}>{label}</div>
        {kpi&&(
          <div
            onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setPos({x:r.left,y:r.bottom+6});setShow(true);}}
            onMouseLeave={()=>setShow(false)}
            style={{width:15,height:15,borderRadius:"50%",background:T.muted+"25",display:"flex",alignItems:"center",justifyContent:"center",cursor:"help",flexShrink:0,marginLeft:4}}>
            <span style={{fontSize:9,color:T.muted,fontWeight:800}}>?</span>
          </div>
        )}
      </div>
      <div style={{fontSize:10,color:T.muted,marginBottom:6,lineHeight:1.4}}>{desc}</div>
      <NavyNum value={value} unit={unit} size={isMobile?20:24} color={color}/>
      {sub&&<div style={{fontSize:11,color:subColor,marginTop:5,fontWeight:600}}>{sub}</div>}
      {show&&kpi&&(
        <div style={{position:"fixed",...(pos.x+276>window.innerWidth?{right:8,left:"auto"}:{left:pos.x}),top:pos.y,zIndex:9999,pointerEvents:"none",
          background:T.navy,color:T.white,borderRadius:10,padding:"12px 16px",fontSize:12,
          width:260,lineHeight:1.8,boxShadow:"0 4px 20px rgba(0,0,0,0.25)"}}>
          {kpi.split("\n").map((line,i)=>
            line===""
              ? <div key={i} style={{height:6}}/>
              : <div key={i}>{line}</div>
          )}
        </div>
      )}
    </Card>
  );
};

// ══════════════════════════════════════════════════════
// LEARNING CALENDAR
// ══════════════════════════════════════════════════════
const LearningCalendar = ({logs}) => {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const logDates = new Set(logs.map(l => l.date));
  const logByDate = logs.reduce((acc, l) => {
    if(!acc[l.date]) acc[l.date] = [];
    acc[l.date].push(l);
    return acc;
  }, {});

  const firstDay = new Date(year, month, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const todayStr = today.toISOString().slice(0,10);
  const WEEK = ["일","월","화","수","목","금","토"];
  const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

  const [tooltip, setTooltip] = useState(null);

  const cells = [];
  for(let i=0; i<firstDay; i++) cells.push(null);
  for(let d=1; d<=daysInMonth; d++) cells.push(d);

  return (
    <Card style={{marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:T.navy,display:"flex",alignItems:"center",gap:5}}>{HI.calendar(14,T.navy)} 학습 달력</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>색칠된 날 = 학습 기록이 있는 날이에요</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <button onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);}}
            style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:14,color:T.navy,flexShrink:0}}>‹</button>
          <span style={{fontSize:13,fontWeight:700,color:T.navy,whiteSpace:"nowrap",textAlign:"center"}}>{year}년 {MONTHS[month]}</span>
          <button onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);}}
            style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:14,color:T.navy}}>›</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
        {WEEK.map((w,i) => (
          <div key={w} style={{textAlign:"center",fontSize:11,fontWeight:700,padding:"4px 0",
            color:i===0?"#E8394A":i===6?"#2563EB":T.muted}}>{w}</div>
        ))}
        {cells.map((d, i) => {
          if(!d) return <div key={`e${i}`}/>;
          const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const hasLog = logDates.has(dateStr);
          const dayLogs = logByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const ei = hasLog ? (dayLogs.reduce((s,l)=>s+(l.engram_index||0),0)/dayLogs.length) : 0;
          const dotColor = ei>=81?GRAPH.ccColor:ei>=66?T.navy:ei>=51?T.orange:GRAPH.ciColor;
          return (
            <div key={d}
              onMouseEnter={(e)=>{ if(hasLog){ const r=e.currentTarget.getBoundingClientRect(); setTooltip({d,dateStr,dayLogs,ei,x:r.left+r.width/2,y:r.top}); }}}
              onMouseLeave={()=>setTooltip(null)}
              style={{
                minHeight:30,
                borderRadius:6,
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                cursor:hasLog?"pointer":"default",
                background:hasLog?dotColor+"18":isToday?T.navy+"0a":T.surfaceAlt,
                border:`1px solid ${isToday?T.navy:hasLog?dotColor+"40":T.border}`,
                transition:"all 0.15s",
              }}>
              <span style={{fontSize:11,fontWeight:isToday?800:hasLog?700:400,
                color:isToday?T.navy:hasLog?dotColor:T.muted}}>{d}</span>
              {hasLog && <div style={{width:4,height:4,borderRadius:"50%",background:dotColor,marginTop:1}}/>}
            </div>
          );
        })}
      </div>
      {tooltip && (
        <div style={{position:"fixed",
          left:tooltip.x+80>window.innerWidth?"auto":tooltip.x,
          right:tooltip.x+80>window.innerWidth?8:"auto",
          top:tooltip.y-8,
          transform:tooltip.x+80>window.innerWidth?"translateY(-100%)":"translate(-50%,-100%)",
          background:T.navy,color:T.white,borderRadius:10,padding:"10px 14px",fontSize:12,
          zIndex:9999,pointerEvents:"none",boxShadow:"0 4px 16px rgba(0,0,0,0.2)",minWidth:140,whiteSpace:"nowrap"}}>
          <strong>{tooltip.dateStr}</strong> — {tooltip.dayLogs.length}건 학습
          {tooltip.dayLogs.map((l,i)=>(
            <div key={i} style={{marginTop:4,color:"rgba(255,255,255,0.8)"}}>
              {l.subject} · EI <strong style={{color:T.orange}}>{(l.engram_index||0).toFixed(1)}</strong>
            </div>
          ))}
          <div style={{position:"absolute",bottom:-6,left:"50%",transform:"translateX(-50%)",
            width:12,height:12,background:T.navy,clipPath:"polygon(0 0,100% 0,50% 100%)"}}/>
        </div>
      )}
      <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
        {[{c:GRAPH.ccColor,l:"A등급 이상 (81~100)"},{c:T.navy,l:"B등급 (66~80)"},{c:T.orange,l:"C등급 (51~65)"},{c:GRAPH.ciColor,l:"D등급 (~50)"}].map(({c,l})=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.muted}}>
            <div style={{width:10,height:10,borderRadius:3,background:c+"40",border:`1px solid ${c}`}}/>
            {l}
          </div>
        ))}
      </div>
    </Card>
  );
};

// ══════════════════════════════════════════════════════
// AI 학습 조언 (Claude API)
// ══════════════════════════════════════════════════════
const AIAdvice = ({logs, profile}) => {
  const getCacheKey = () => {
    if(!logs||logs.length===0) return "";
    const sorted = [...logs].sort((a,b)=>b.date.localeCompare(a.date));
    return `${sorted[0]?.id}_${logs.length}`;
  };

  const [advice, setAdvice]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [lastFetch, setLastFetch] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [loadingCache, setLoadingCache] = useState(true);

  // 마운트 시 DB에서 캐시 조회
  useEffect(()=>{
    const checkCache = async () => {
      if(!profile?.id || !logs?.length){ setLoadingCache(false); return; }
      const cacheKey = getCacheKey();
      const { data } = await supabase
        .from("ai_advice_logs")
        .select("response, created_at")
        .eq("uid", profile.id)
        .eq("cache_key", cacheKey)
        .order("created_at", {ascending:false})
        .limit(1)
        .single();
      if(data){
        setAdvice(data.response);
        setLastFetch(new Date(data.created_at).toLocaleString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}));
        setIsCached(true);
      }
      setLoadingCache(false);
    };
    checkCache();
  },[logs?.length, profile?.id]);

  const getAdvice = async (forceRefresh=false) => {
    if(logs.length === 0){ setError("학습 기록이 없어요. 먼저 데이터를 입력해 주세요!"); return; }
    // 캐시 있고 강제 갱신 아니면 스킵
    if(isCached && !forceRefresh){ setError(""); return; }
    setLoading(true); setError(""); setAdvice("");

    // ── 데이터 준비
    const all    = [...logs].sort((a,b)=>a.date.localeCompare(b.date));
    // 최근 7일 기준, 7건 미만이면 최근 7건 fallback
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);
    const recent7d = all.filter(l => new Date(l.date) >= sevenDaysAgo);
    const recent   = recent7d.length >= 7 ? recent7d : all.slice(-7);
    const recentLabel = recent7d.length >= 7
      ? `최근 7일 (${recent[0].date}~${recent[recent.length-1].date})`
      : `최근 7건 (${recent[0].date}~${recent[recent.length-1].date})`;
    const latest = all[all.length-1];

    // EI 통계
    const avgEI  = (recent.reduce((s,l)=>s+(l.engram_index||0),0)/recent.length).toFixed(1);
    const allAvgEI = (all.reduce((s,l)=>s+(l.engram_index||0),0)/all.length).toFixed(1);
    const eiTrend = all.length>=2 ? (latest.engram_index - all[Math.max(0,all.length-8)].engram_index).toFixed(1) : null;

    // Co-In 메타인지
    const coinTot = recent.reduce((s,l)=>s+(l.coin_cc||0)+(l.coin_ci||0)+(l.coin_ic||0)+(l.coin_ii||0),0);
    const coinCC  = recent.reduce((s,l)=>s+(l.coin_cc||0),0);
    const coinCI  = recent.reduce((s,l)=>s+(l.coin_ci||0),0);
    const coinIC  = recent.reduce((s,l)=>s+(l.coin_ic||0),0);
    const coinII  = recent.reduce((s,l)=>s+(l.coin_ii||0),0);
    const ciRate  = coinTot>0 ? (coinCI/coinTot*100).toFixed(1) : 0;
    const metaAcc = coinTot>0 ? ((coinCC+coinII)/coinTot*100).toFixed(1) : 0;

    // 오답 유형 합산
    const errTot = {Q1:0,Q2:0,Q3:0,M1:0,M2:0,M3:0};
    recent.forEach(l=>{ errTot.Q1+=(l.err_q1||0);errTot.Q2+=(l.err_q2||0);errTot.Q3+=(l.err_q3||0);errTot.M1+=(l.err_m1||0);errTot.M2+=(l.err_m2||0);errTot.M3+=(l.err_m3||0); });
    const topErr = Object.entries(errTot).sort((a,b)=>b[1]-a[1]).filter(([,v])=>v>0).slice(0,3).map(([k,v])=>`${k}(${v}회)`).join(", ");

    // 과목별 Co-In + 평균 EI
    const subjectMap = {};
    recent.forEach(l=>{
      if(!subjectMap[l.subject]) subjectMap[l.subject]={tot:0,ci:0,ic:0,eis:[]};
      const tot=(l.coin_cc||0)+(l.coin_ci||0)+(l.coin_ic||0)+(l.coin_ii||0);
      subjectMap[l.subject].tot+=tot;
      subjectMap[l.subject].ci+=(l.coin_ci||0);
      subjectMap[l.subject].ic+=(l.coin_ic||0);
      subjectMap[l.subject].eis.push(l.engram_index||0);
    });
    const subjectCoIn = Object.entries(subjectMap).map(([s,d])=>{
      const avgEIs=(d.eis.reduce((a,b)=>a+b,0)/d.eis.length).toFixed(1);
      const ciPct=d.tot>0?(d.ci/d.tot*100).toFixed(1):0;
      const icPct=d.tot>0?(d.ic/d.tot*100).toFixed(1):0;
      return `  ${s}: C-I ${ciPct}%(${d.tot}문항 중 ${d.ci}회) / I-C ${icPct}%(${d.ic}회) / 평균EI ${avgEIs}점`;
    }).join("\n");

    // 학습 시간 패턴
    const avgNetTime = (recent.reduce((s,l)=>s+(l.net_time||0),0)/recent.length).toFixed(0);
    const avgQCount  = (recent.reduce((s,l)=>s+(l.question_count||0),0)/recent.length).toFixed(0);

    // 전략 지수
    const avgStrategy = (recent.reduce((s,l)=>s+(l.strategy_score||0),0)/recent.length).toFixed(1);
    const avgEfficiency = (recent.reduce((s,l)=>s+(l.efficiency_index||0),0)/recent.length).toFixed(1);

    const prompt = `당신은 20HA META-X 학습 프로그램의 코치 AI입니다.
[용어 정의]
EI(엔그램 지수): 학습 각인도 종합 점수(100점 만점)
Co-In(메타인지): C-C 정확한 자기예측 / C-I 과잉확신 / I-C 과소평가 / I-I 정직한 오답 인식
오답 유형(수학 전용) — Q(지식 결여): Q1 개념미숙, Q2 추론실패, Q3 지식공백 / M(실행 오류): M1 계산실수, M2 문제오독, M3 단순실수

아래 학습 데이터를 바탕으로 학생에게 직접 전달하는 코칭 메시지를 작성해주세요.
조건:
- 반드시 존댓말 사용 (~해요, ~세요)
- 2~3문장
- 이름 언급 금지
- 수치 나열이나 칭찬 위주 금지 — 개선 포인트와 오늘 실천할 구체적 행동 중심으로
- 가장 시급한 문제 1가지만 콕 집어서

[학습 데이터] (${recentLabel})
EI: 평균 ${avgEI}점 / 목표 ${profile?.target_ei}점 / 추세 ${eiTrend!==null?(Number(eiTrend)>=0?"+":"")+eiTrend+"점":"유지"}
전략수행: ${avgStrategy}점 / 효율성: ${avgEfficiency}점
학습패턴: 평균 ${avgNetTime}분 / ${avgQCount}문항/회
오답Top3: ${topErr||"없음"}

메타인지 Co-In 분포 (총 ${coinTot}문항):
  C-C ${coinTot>0?(coinCC/coinTot*100).toFixed(1):0}%(${coinCC}회) / C-I ${ciRate}%(${coinCI}회) / I-C ${coinTot>0?(coinIC/coinTot*100).toFixed(1):0}%(${coinIC}회) / I-I ${coinTot>0?(coinII/coinTot*100).toFixed(1):0}%(${coinII}회)

과목별 Co-In:
${subjectCoIn}`;

    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if(!apiKey){ setError("REACT_APP_GEMINI_API_KEY 환경변수를 Vercel에 추가해 주세요."); setLoading(false); return; }
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        { method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.7}}) }
      );
      const data = await res.json();
      if(data.error){ setError("AI 오류: " + data.error.message); setLoading(false); return; }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "조언을 가져올 수 없었어요.";
      const now  = new Date();
      const time = now.toLocaleString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
      const cacheKey = getCacheKey();
      const snapshot = { avgEI, allAvgEI, metaAcc, ciRate, avgStrategy, avgEfficiency, topErr, subjectCoIn, avgNetTime, avgQCount, recentLabel };
      await supabase.from("ai_advice_logs").insert({ uid:profile.id, prompt, response:text, data_snapshot:snapshot, cache_key:cacheKey });
      setAdvice(text);
      setLastFetch(time);
      setIsCached(true);
    } catch(e) {
      setError("네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
    }
    setLoading(false);
  };

  return (
    <Card style={{marginBottom:12,background:"linear-gradient(135deg,#F7F8FC,#EEF1FF)"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:T.navy}}>🤖 AI 학습 코치</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>{isCached ? "새 학습 기록 추가 시 새로운 코칭을 받을 수 있습니다." : "최근 7일 학습 데이터 기반 AI 맞춤 피드백"}</div>
        </div>
        {!isCached &&
          <button onClick={()=>getAdvice(false)} disabled={loading||loadingCache}
            style={{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,
              background:T.navy,color:T.white,display:"flex",alignItems:"center",gap:6,flexShrink:0,opacity:(loading||loadingCache)?0.7:1}}>
            {loading ? <><Spinner size={13} color="#fff"/>분석 중...</> : "✨ 조언 받기"}
          </button>
        }
      </div>
      {error && (
        <div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:T.danger}}>{error}</div>
      )}
      {advice && (
        <div style={{background:T.white,borderRadius:10,padding:"14px 16px",border:`1px solid ${T.border}`}}>
          <div style={{fontSize:13,color:T.text,lineHeight:1.85,whiteSpace:"pre-wrap"}}>{advice}</div>
          {lastFetch && <div style={{fontSize:11,color:T.muted,marginTop:8,textAlign:"right"}}>{lastFetch}</div>}
        </div>
      )}
      {!advice && !error && !loading && (
        <div style={{textAlign:"center",padding:"20px 0",color:T.muted,fontSize:13}}>
          버튼을 누르면 나만의 맞춤 조언을 드려요! 🎯
        </div>
      )}
    </Card>
  );
};

const StudentDashboard = ({logs, profile, isAdminView=false}) => {
  const [subjectFilter, setSubjectFilter] = useState("전체");
  const isMobile = useMobile();
  const normLogs = useMemo(() => logs.map(l=>({
    ...l, engramIndex:l.engram_index, strategyScore:l.strategy_score,
    efficiencyIndex:l.efficiency_index, metacognitionAccuracy:l.metacognition_accuracy,
    coinFilter:{cc:l.coin_cc,ci:l.coin_ci,ic:l.coin_ic,ii:l.coin_ii},
    errorAnalysis:{Q1:l.err_q1,Q2:l.err_q2,Q3:l.err_q3,M1:l.err_m1,M2:l.err_m2,M3:l.err_m3},
    subject:l.subject, bookLevel:l.book_level, netTime:l.net_time, questionCount:l.question_count,
    qBasic:l.q_basic||0, qMid:l.q_mid||0, qAdv:l.q_adv||0,
  })), [logs]);
  const allSubjects=["전체",...new Set(normLogs.map(l=>l.subject))];
  const filtered=subjectFilter==="전체"?normLogs:normLogs.filter(l=>l.subject===subjectFilter);
  const ninetyDaysAgo=new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate()-90);
  const ninetyStr=ninetyDaysAgo.toISOString().slice(0,10);
  const sorted=[...filtered].filter(l=>l.date>=ninetyStr).sort((a,b)=>a.date.localeCompare(b.date));
  const _dateEI={};sorted.forEach(l=>{if(!_dateEI[l.date])_dateEI[l.date]=[];_dateEI[l.date].push(l.engramIndex);});
  const dailyAvg=Object.entries(_dateEI).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,eis])=>({date,engramIndex:+(eis.reduce((s,v)=>s+v,0)/eis.length).toFixed(1)}));
  const maData=dailyAvg.map((d,i)=>{const w=dailyAvg.slice(Math.max(0,i-6),i+1);return{...d,movingAvg:+(w.reduce((s,v)=>s+v.engramIndex,0)/w.length).toFixed(1)};});
  const latest=dailyAvg[dailyAvg.length-1],prev=dailyAvg[dailyAvg.length-2];
  const delta=latest&&prev?+(latest.engramIndex-prev.engramIndex).toFixed(1):null;
  const todayStr=new Date().toISOString().slice(0,10);
  const latestIsToday=latest?.date===todayStr;
  const coinT=filtered.reduce((acc,l)=>{const cf=l.coinFilter||{};Object.entries(cf).forEach(([k,v])=>{acc[k]=(acc[k]||0)+v;});return acc;},{cc:0,ci:0,ic:0,ii:0});
  const coinTot=Object.values(coinT).reduce((s,v)=>s+v,0);
  const mAcc=coinTot>0?(((coinT.cc+coinT.ii)/coinTot)*100).toFixed(1):0;
  const errT=filtered.reduce((acc,l)=>{const ea=l.errorAnalysis||{};Object.entries(ea).forEach(([k,v])=>{acc[k]=(acc[k]||0)+v;});return acc;},{});
  const totalErr=Object.values(errT).reduce((s,v)=>s+v,0);
  const errPie=ERR_CODES.map(c=>({name:c,value:errT[c]||0,label:ERR_LABELS[c]})).filter(d=>d.value>0);
  const ERR_C={Q1:GRAPH.errQ[0],Q2:GRAPH.errQ[1],Q3:GRAPH.errQ[2],M1:GRAPH.errM[0],M2:GRAPH.errM[1],M3:GRAPH.errM[2]};
  const COIN_C={"C-C":GRAPH.ccColor,"C-I":GRAPH.ciColor,"I-C":GRAPH.icColor,"I-I":GRAPH.iiColor};
  const coinScatter=normLogs.flatMap(l=>{const d=l.coinFilter||{};return[...Array(d.cc||0).fill(0).map(()=>({x:0.5+Math.random()*0.9,y:0.5+Math.random()*0.9,type:"C-C"})),...Array(d.ci||0).fill(0).map(()=>({x:0.5+Math.random()*0.9,y:-0.3-Math.random()*0.9,type:"C-I"})),...Array(d.ic||0).fill(0).map(()=>({x:-0.3-Math.random()*0.9,y:0.5+Math.random()*0.9,type:"I-C"})),...Array(d.ii||0).fill(0).map(()=>({x:-0.5-Math.random()*0.9,y:-0.5-Math.random()*0.9,type:"I-I"}))];});
  const targetEI=profile?.target_ei||85;

  if(normLogs.length===0) return(
    <div style={{textAlign:"center",padding:"80px 20px"}}>
      <div style={{fontSize:48,marginBottom:16}}>📚</div>
      <div style={{fontSize:18,fontWeight:700,color:T.navy,marginBottom:8}}>아직 학습 기록이 없습니다</div>
      <div style={{fontSize:14,color:T.muted}}>상단의 <strong style={{color:T.orange}}>+ 학습 입력</strong> 버튼으로 첫 데이터를 입력해 보세요.</div>
    </div>
  );

  return(
    <div>
      {!isAdminView && <AIAdvice logs={logs} profile={profile}/>}
      <LearningCalendar logs={logs}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
        {[
          {label:latestIsToday?"오늘 EI 점수":(latest?`최근 EI (${latest.date.slice(5).replace('-','/')})`:  "최근 EI 점수"),desc:"최근 학습이 뇌에 얼마나 효과적으로 각인되었는지를 나타내는 종합 점수",kpi:"S(93~) A(81~) B(66~) C(51~) D(~50)\n\n세 가지 역량(전략 수행·풀이 효율·메타인지)을\n종합해 산출하는 학습 각인도 지수입니다.\n점수가 높을수록 오래 기억에 남는 학습을 했다는 의미예요.",value:latest?.engramIndex??"—",color:latest?EI_COLOR(latest.engramIndex):T.navy,sub:delta!==null?`${delta>=0?"▲":"▼"} ${Math.abs(delta)} 전 기록 대비`:null,subColor:delta>=0?T.success:T.danger},
          (()=>{
            const curEI = latest?.engramIndex??null;
            const curG = curEI!=null?gradeInfo(curEI):null;
            const nextG = curG?GRADE_NEXT[curG.g]:null;
            const nextMin = nextG?GRADE_MIN[nextG]:null;
            const diff = curEI!=null&&nextMin!=null?(nextMin-curEI).toFixed(1):null;
            const atTop = curG?.g==="S";
            return {
              label:"다음 등급까지",
              desc:"현재 등급에서 다음 등급 최솟값까지 남은 점수",
              kpi:"현재 최근 EI 기준으로 다음 등급까지 얼마나 남았는지 보여줍니다.\n목표 설정과 무관한 절대적 지표입니다.",
              value: atTop?"MAX":diff!=null?`+${diff}`:"—",
              unit: atTop?"":diff!=null?"점":"",
              color: atTop?"#16A34A":curG?curG.c:T.orange,
              sub: curG&&!atTop?`현재 ${curG.g}등급 → ${nextG}등급`:curG?"S등급 달성!":null,
              subColor: atTop?"#16A34A":T.muted,
            };
          })(),
          {label:"메타인지 지수",desc:"내 예측과 실제 결과가 일치한 비율",kpi:"문제를 풀기 전 맞출지 틀릴지 예측했을 때\n그 예측이 얼마나 정확했는지를 나타냅니다.\n\n높을수록 자신의 실력을 정확히 파악하고 있다는 뜻이에요.\n낮으면 과신하거나 과소평가하는 경향이 있을 수 있어요.",value:mAcc,unit:"%",color:"#7C3AED"},
          {label:"누적 학습일",desc:"지금까지 기록된 총 학습 세션 수",kpi:"데이터를 입력한 날의 총 횟수입니다.\n꾸준히 쌓일수록 분석의 정확도가 높아져요.",value:normLogs.length,unit:"일",color:T.navyMid},
        ].map(({label,desc="",kpi,value,unit="",color,sub,subColor})=>(
          <KpiCard key={label} label={label} desc={desc} kpi={kpi} value={value} unit={unit} color={color} sub={sub} subColor={subColor} isMobile={isMobile}/>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {allSubjects.map(s=>(
          <button key={s} onClick={()=>setSubjectFilter(s)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${subjectFilter===s?T.navy:T.border}`,cursor:"pointer",fontSize:12,fontWeight:700,background:subjectFilter===s?T.navy:T.white,color:subjectFilter===s?T.white:T.muted}}>{s}</button>
        ))}
      </div>
      <Card style={{marginBottom:12}}>
        <SectionTitle sub="일별 EI(막대) · 7일 이동평균(선) · 목표선(점선)" tooltip="엔그램 지수(EI)는 학습이 뇌에 얼마나 효과적으로 각인되었는지를 수치화한 종합 지표입니다.\n\n이동평균선이 목표선(점선)에 가까울수록\n목표에 근접한 안정적 성장을 의미합니다.">📈 엔그램 지수(EI) 추이</SectionTitle>
        <ResponsiveContainer width="100%" height={isMobile?180:210}>
          <ComposedChart data={maData} margin={{top:4,right:8,bottom:4,left:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="date" tick={{fill:T.muted,fontSize:10}} tickFormatter={d=>d.slice(5)}/>
            <YAxis domain={[0,100]} tick={{fill:T.muted,fontSize:10}} width={28}/>
            <Tooltip content={<ChartTip/>}/>
            <ReferenceLine y={targetEI} stroke={T.orange} strokeDasharray="5 5" label={{value:`목표 ${targetEI}`,fill:T.orange,fontSize:11,position:"insideTopRight",offset:4}}/>
            <Bar dataKey="engramIndex" name="일일 EI" fill={T.navy+"28"} stroke={T.navy+"60"} radius={[4,4,0,0]}/>
            <Line type="monotone" dataKey="movingAvg" name="7일 평균" stroke={T.orange} strokeWidth={2.5} dot={false}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12,marginBottom:12}}>
        <Card>
          <SectionTitle sub="C-C: 정확한 자기예측 · C-I: 과잉확신 · I-C: 과소평가 · I-I: 정직한 오답 인식" tooltip="Co-In(Confidence-Incorrect) 메타인지 필터입니다.\n\nC-C: 맞을 것 같았고 실제로 맞음 → 이상적\nC-I: 맞을 것 같았으나 틀림 → 과잉확신 경보(30% 초과 시 Red Flag)\nI-C: 틀릴 것 같았으나 맞음 → 과소평가\nI-I: 틀릴 것 같았고 실제로 틀림 → 정직한 인식\n\nC-C 비율이 높을수록 메타인지 정확도 우수">🧠 내 예측 vs 실제 결과</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={[
              {label:"C-C 정확한 예측",value:coinT.cc||0,full:Math.max(coinT.cc||0,coinT.ci||0,coinT.ic||0,coinT.ii||0,1)},
              {label:"C-I 과잉확신",value:coinT.ci||0,full:Math.max(coinT.cc||0,coinT.ci||0,coinT.ic||0,coinT.ii||0,1)},
              {label:"I-I 정직한 인식",value:coinT.ii||0,full:Math.max(coinT.cc||0,coinT.ci||0,coinT.ic||0,coinT.ii||0,1)},
              {label:"I-C 과소평가",value:coinT.ic||0,full:Math.max(coinT.cc||0,coinT.ci||0,coinT.ic||0,coinT.ii||0,1)},
            ]} margin={{top:10,right:24,bottom:10,left:24}}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="label" tick={{fontSize:10,fill:T.muted,fontWeight:600}}/>
              <Radar name="횟수" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2}/>
              <Tooltip content={<ChartTip/>}/>
            </RadarChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",marginBottom:12}}>
            {[["C-C",GRAPH.ccColor,coinT.cc||0],["C-I",GRAPH.ciColor,coinT.ci||0],["I-C",T.orange,coinT.ic||0],["I-I",T.navyMid,coinT.ii||0]].map(([k,c,v])=>(
              <span key={k} style={{fontSize:11,color:c,fontWeight:700}}>● {k}: {v}회</span>
            ))}
          </div>
          {/* COIN 백분율 띠그래프 */}
          {(()=>{
            const tot=(coinT.cc||0)+(coinT.ci||0)+(coinT.ic||0)+(coinT.ii||0);
            if(tot===0) return null;
            const bars=[
              {k:"C-C",v:coinT.cc||0,color:GRAPH.ccColor},
              {k:"C-I",v:coinT.ci||0,color:GRAPH.ciColor},
              {k:"I-C",v:coinT.ic||0,color:T.orange},
              {k:"I-I",v:coinT.ii||0,color:"#9CA3AF"},
            ];
            return(
              <div style={{marginBottom:14}}>
                <div style={{height:18,borderRadius:9,overflow:"hidden",display:"flex",gap:2}}>
                  {bars.map(({k,v,color})=>{
                    const p=v/tot*100;
                    if(p<0.5) return null;
                    return(
                      <div key={k} style={{flex:`0 0 ${p}%`,background:color,borderRadius:0,transition:"flex 0.6s ease",position:"relative"}}
                        title={`${k}: ${v}회 (${p.toFixed(1)}%)`}/>
                    );
                  })}
                </div>
                <div style={{display:"flex",gap:10,marginTop:6,flexWrap:"wrap",justifyContent:"center"}}>
                  {bars.map(({k,v,color})=>{
                    const p=+(v/tot*100).toFixed(0);
                    return(
                      <div key={k} style={{display:"flex",alignItems:"center",gap:3,fontSize:10}}>
                        <div style={{width:8,height:8,borderRadius:2,background:color,flexShrink:0}}/>
                        <span style={{color:T.muted}}>{k} <strong style={{color}}>{p}%</strong></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          {/* C-I / I-C 위험 지표 강조 */}
          {(coinT.ci||0)+(coinT.ic||0)>0&&(()=>{
            const tot=Object.values(coinT).reduce((s,v)=>s+v,0)||1;
            const ciR=+((coinT.ci||0)/tot*100).toFixed(0);
            const icR=+((coinT.ic||0)/tot*100).toFixed(0);
            const ciDanger=ciR>30, ciWarn=ciR>15;
            const icDanger=icR>30, icWarn=icR>15;
            const anyDanger=ciDanger||icDanger;
            const anyWarn=ciWarn||icWarn;
            const borderColor=anyDanger?"#FECACA":anyWarn?"#FED7AA":"#BBF7D0";
            const bgColor=anyDanger?"#FFF5F5":anyWarn?"#FFFBEB":"#F0FDF4";
            const titleColor=anyDanger?T.danger:anyWarn?T.orange:T.success;
            const titleIcon=anyDanger?"warn":anyWarn?"warn":"check";
            const titleText=anyDanger?"메타인지 위험 지표":anyWarn?"메타인지 주의 지표":"메타인지 양호";
            return(
              <div style={{background:bgColor,border:`1px solid ${borderColor}`,borderRadius:10,padding:"10px 14px"}}>
                <div style={{fontSize:11,fontWeight:800,color:titleColor,marginBottom:8,display:"flex",alignItems:"center",gap:4}}>
                  {HI[titleIcon]?.(12,titleColor)} {titleText}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:11,color:GRAPH.ciColor,fontWeight:700}}>C-I 과잉확신</span>
                      <span style={{fontSize:11,fontWeight:800,color:ciDanger?T.danger:ciWarn?T.orange:T.success}}>
                        {ciR}% {ciDanger?"🔴 위험":ciWarn?"🟡 주의":"🟢 양호"}
                      </span>
                    </div>
                    <div style={{height:6,background:T.surfaceAlt,borderRadius:3}}>
                      <div style={{height:"100%",width:`${Math.min(ciR,100)}%`,background:GRAPH.ciColor,borderRadius:3,transition:"width 0.5s"}}/>
                    </div>
                  </div>
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:11,color:GRAPH.icColor,fontWeight:700}}>I-C 과소평가</span>
                      <span style={{fontSize:11,fontWeight:800,color:icDanger?T.danger:icWarn?T.orange:T.success}}>
                        {icR}% {icDanger?"🔴 위험":icWarn?"🟡 주의":"🟢 양호"}
                      </span>
                    </div>
                    <div style={{height:6,background:T.surfaceAlt,borderRadius:3}}>
                      <div style={{height:"100%",width:`${Math.min(icR,100)}%`,background:GRAPH.icColor,borderRadius:3,transition:"width 0.5s"}}/>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </Card>
        <Card>
          <SectionTitle sub="Q1 개념미숙 · Q2 추론실패 · Q3 지식공백 · M1 계산실수 · M2 문제오독 · M3 단순실수" tooltip="오답 유형 6분류 체계입니다.\n\n[Q - 지식 결여]\nQ1: 해당 개념을 아예 모름 → 개념 학습 필요\nQ2: 알지만 문제에 적용 실패 → 응용 훈련 필요\nQ3: 배우지 않은 범위 → 커리큘럼 확인\n\n[M - 실행 오류]\nM1: 계산·풀이 과정 실수 → 검산 습관\nM2: 문제 조건을 잘못 읽음 → 정독 훈련\nM3: 알면서도 틀림 → 집중력 관리">❌ 왜 틀렸을까? 오답 분석</SectionTitle>
          {totalErr>0 ? (<>
            {/* 막대그래프: Q1~M3 */}
            <ResponsiveContainer width="100%" height={163}>
              <BarChart data={ERR_CODES.map(c=>({name:c,value:errT[c]||0}))} margin={{top:8,right:16,bottom:4,left:4}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:T.muted,fontWeight:700}}/>
                <YAxis tick={{fontSize:10,fill:T.muted}} width={24} allowDecimals={false}/>
                <Tooltip content={<ChartTip/>}/>
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {ERR_CODES.map(c=><Cell key={c} fill={ERR_C[c]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* 원그래프: Q전체 vs M전체 */}
            <div style={{display:"flex",alignItems:"center",gap:0,marginTop:10,paddingLeft:8}}>
              <ResponsiveContainer width="50%" height={110}>
                <PieChart>
                  <Pie data={[
                    {name:"몰라서 틀림",value:(errT.Q1||0)+(errT.Q2||0)+(errT.Q3||0),fill:GRAPH.errQ[0]},
                    {name:"실수로 틀림",value:(errT.M1||0)+(errT.M2||0)+(errT.M3||0),fill:GRAPH.errM[0]},
                  ].filter(d=>d.value>0)} cx="55%" cy="55%" innerRadius={28} outerRadius={42} paddingAngle={4} dataKey="value">
                    {[GRAPH.errQ[0],GRAPH.errM[0]].map((c,i)=><Cell key={i} fill={c}/>)}
                  </Pie>
                  <Tooltip content={<ChartTip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:10,height:10,borderRadius:3,background:GRAPH.errQ[0]}}/>
                  <span style={{fontSize:11,color:T.textMid}}>몰라서 틀림: <strong>{(errT.Q1||0)+(errT.Q2||0)+(errT.Q3||0)}회</strong></span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:10,height:10,borderRadius:3,background:GRAPH.errM[0]}}/>
                  <span style={{fontSize:11,color:T.textMid}}>실수로 틀림: <strong>{(errT.M1||0)+(errT.M2||0)+(errT.M3||0)}회</strong></span>
                </div>
              </div>
            </div>
          </>) : <div style={{height:190,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,fontSize:13}}>오답 데이터 없음</div>}
        </Card>
      </div>
      <Card style={{marginBottom:12}}>
        <SectionTitle sub="문항 1개를 푸는 데 걸린 평균 시간(초)입니다. 그래프가 우하향할수록 같은 시간에 더 많은 문제를 처리하게 된다는 뜻으로, 풀이 효율이 향상된 것입니다. 문제집 단계별 난이도가 가중치로 보정됩니다." tooltip="문항 1개를 푸는 데 평균적으로 얼마나 걸렸는지 보여줍니다.\n\n숫자가 낮아질수록(우하향) 같은 시간에 더 많은\n문제를 처리할 수 있게 된다는 뜻이에요.\n\n문제집 난이도에 따라 보정된 값을 사용합니다.">⚡ 문제 풀이 속도</SectionTitle>
        {(()=>{
          const isMathView = subjectFilter==="수학" || subjectFilter==="전체";
          const allDates=[...new Set(sorted.map(l=>l.date.slice(5)))].sort();
          const speedData=allDates.map(d=>{
            const dayLogs=sorted.filter(l=>l.date.slice(5)===d);
            const calcLvl=(key)=>{const ls=dayLogs.filter(l=>l[key]>0);const tot=ls.reduce((s,l)=>s+l[key],0);return ls.length>0&&tot>0?+(ls.reduce((s,l)=>s+l.netTime*60,0)/tot).toFixed(1):null;};
            return{date:d, basic:calcLvl('qBasic'), mid:calcLvl('qMid'), adv:calcLvl('qAdv')};
          });
          return(
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={speedData} margin={{top:4,right:8,bottom:4,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fill:T.muted,fontSize:10}}/>
                <YAxis tick={{fill:T.muted,fontSize:10}} unit="초" width={48}/>
                <Tooltip content={<ChartTip/>}/>
                <Legend formatter={v=><span style={{fontSize:11,color:T.textMid}}>{v}</span>}/>
                <Line type="monotone" dataKey="basic" name={isMathView?"기본":"전체"} stroke={T.navy} strokeWidth={2} dot={{r:2}} connectNulls/>
                {isMathView&&<Line type="monotone" dataKey="mid" name="응용" stroke={T.orange} strokeWidth={2} dot={{r:2}} connectNulls/>}
                {isMathView&&<Line type="monotone" dataKey="adv" name="심화" stroke="#7C3AED" strokeWidth={2} dot={{r:2}} connectNulls/>}
              </LineChart>
            </ResponsiveContainer>
          );
        })()}
      </Card>
      <Card>
        <SectionTitle sub="전략수행: 20HA 학습 전략(워밍업·채점·복습 등)을 얼마나 충실히 실천했는가 / 효율성: 순공부 시간 대비 문항 처리 속도 / 메타인지: 내 실력을 얼마나 정확히 예측하는가(Co-In 기반)" tooltip="EI를 구성하는 3가지 핵심 역량을 독립적으로 추적합니다.\n\n전략수행: 학습 전략을 얼마나 잘 실천했는가\n효율성: 시간 대비 얼마나 많은 문제를 풀었는가\n메타인지: 자신의 실력을 얼마나 정확히 파악하는가\n\n각 지수를 따로 보면 어느 영역이 부족한지 알 수 있어요.">📊 3가지 핵심 지표 변화</SectionTitle>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={sorted} margin={{top:4,right:8,bottom:4,left:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="date" tick={{fill:T.muted,fontSize:10}} tickFormatter={d=>d.slice(5)}/>
            <YAxis domain={[0,100]} tick={{fill:T.muted,fontSize:10}} width={28}/>
            <Tooltip content={<ChartTip/>}/>
            <Line type="monotone" dataKey="strategyScore" name="전략수행" stroke={T.navy} strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="efficiencyIndex" name="효율성" stroke={T.orange} strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="metacognitionAccuracy" name="메타인지" stroke="#7C3AED" strokeWidth={2} dot={false}/>
            <Legend formatter={v=><span style={{fontSize:11,color:T.textMid}}>{v}</span>}/>
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// PARENT DASHBOARD
// ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════
// PARENT HOME — 자녀 아이디 관리 (추가/삭제만)
// ══════════════════════════════════════════════════════
const ParentHomeView = ({children, parentId, onChildrenUpdate}) => {
  const [addEmail, setAddEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const isMobile = useMobile();

  const handleAdd = async () => {
    if(!addEmail){ setMsg({type:"err",text:"이메일을 입력해주세요."}); return; }
    setAddLoading(true); setMsg(null);
    const { data, error } = await supabase.rpc("find_student_by_email", { student_email: addEmail.trim().toLowerCase() });
    if(error || !data || data.length === 0) {
      setMsg({type:"err",text:"해당 이메일의 학생을 찾을 수 없습니다. 학생이 가입 및 승인 완료된 상태여야 합니다."});
      setAddLoading(false); return;
    }
    const student = data[0];
    if(children.some(c => c.profile?.id === student.id)) {
      setMsg({type:"err",text:"이미 연결된 학생입니다."}); setAddLoading(false); return;
    }
    const { error: insErr } = await supabase.from("parent_students").insert({ parent_id: parentId, student_id: student.id });
    if(insErr && insErr.code !== '23505'){ setMsg({type:"err",text:"연결 중 오류가 발생했습니다."}); setAddLoading(false); return; }
    const { data: cl } = await supabase.rpc("get_child_logs", { child_id: student.id });
    onChildrenUpdate([...children, { profile: {...student, role:"student"}, logs: cl || [] }], student.id);
    setAddEmail("");
    setMsg({type:"ok",text:`${student.name}(${student.grade}) 학생이 연결됐어요. 좌측 메뉴에 추가됐습니다.`});
    setAddLoading(false);
  };

  const handleDelete = async (childId, childName) => {
    if(!window.confirm(`${childName} 학생 연결을 해제할까요?`)) return;
    const { error } = await supabase.from("parent_students").delete().eq("parent_id", parentId).eq("student_id", childId);
    if(error){ alert("삭제 중 오류가 발생했습니다."); return; }
    onChildrenUpdate(children.filter(c => c.profile.id !== childId), null);
    setMsg({type:"ok",text:`${childName} 학생 연결이 해제되었습니다.`});
  };

  return (
    <div style={{display:"grid",gap:14}}>
      <div style={{fontSize:18,fontWeight:800,color:T.navy}}>👥 자녀 아이디 관리</div>

      {/* 자녀 추가 */}
      <Card style={{padding:"18px 20px"}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:10}}>자녀 이메일로 연결</div>
        <div style={{fontSize:11,color:T.muted,marginBottom:12,lineHeight:1.5}}>
          자녀가 회원가입 + 관리자 승인 완료된 상태여야 연결할 수 있어요.
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <input value={addEmail} onChange={e=>{setAddEmail(e.target.value);setMsg(null);}}
            onKeyDown={e=>e.key==="Enter"&&handleAdd()}
            placeholder="example@email.com"
            style={{...css.input,margin:0,flex:"1 1 220px",fontSize:13,padding:"10px 14px"}}/>
          <button onClick={handleAdd} disabled={addLoading}
            style={{...css.btnPrimary,padding:"10px 18px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
            {addLoading?<Spinner size={14} color="#fff"/>:"+ 추가"}
          </button>
        </div>
        {msg && (
          <div style={{
            marginTop:12,padding:"10px 14px",borderRadius:8,fontSize:12,
            background:msg.type==="ok"?"#F0FDF4":"#FEF2F2",
            border:`1px solid ${msg.type==="ok"?"#BBF7D0":"#FECACA"}`,
            color:msg.type==="ok"?"#166534":T.danger,
          }}>
            {msg.type==="ok"?"✅ ":"⚠️ "}{msg.text}
          </div>
        )}
      </Card>

      {/* 연결된 자녀 목록 */}
      <Card style={{padding:"18px 20px"}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>
          연결된 자녀 <span style={{fontSize:12,color:T.muted,fontWeight:400,marginLeft:4}}>({children.length}명)</span>
        </div>
        {children.length === 0 ? (
          <div style={{textAlign:"center",padding:"32px 16px",color:T.muted,fontSize:13}}>
            연결된 자녀가 없어요. 위에서 자녀 이메일을 입력해 연결해보세요.
          </div>
        ) : (
          <div style={{display:"grid",gap:8}}>
            {children.map(c=>(
              <div key={c.profile.id} style={{
                display:"flex",alignItems:"center",gap:10,padding:"12px 14px",
                borderRadius:10,border:`1px solid ${T.border}`,background:T.surface,
              }}>
                <div style={{width:36,height:36,borderRadius:"50%",background:T.navy+"15",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {HI.cap(18,T.navy)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.navy}}>
                    {c.profile.name}
                    <span style={{fontSize:11,fontWeight:400,color:T.muted,marginLeft:6}}>
                      ({calcGrade(c.profile.birth_year, c.profile.birth_month) || c.profile.grade || "-"})
                    </span>
                  </div>
                  <div style={{fontSize:11,color:T.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {c.profile.email}
                  </div>
                </div>
                <button onClick={()=>handleDelete(c.profile.id, c.profile.name)}
                  style={{...css.btnOutline,padding:"6px 12px",fontSize:11,color:T.danger,borderColor:T.danger}}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const ParentDashboard = ({children, selChildId, setSelChildId, parentId, onChildrenUpdate}) => {
  const [addEmail, setAddEmail]   = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg]       = useState(null); // {type:"ok"|"err", text}
  const [childView, setChildView] = useState("dashboard"); // "dashboard" | "history"
  const isMobile = useMobile();

  const selChild = children.find(c => c.profile?.id === selChildId);

  const handleAddChild = async () => {
    if(!addEmail){ setAddMsg({type:"err", text:"이메일을 입력해주세요."}); return; }
    setAddLoading(true); setAddMsg(null);
    // 이메일로 학생 검색
    const { data, error } = await supabase.rpc("find_student_by_email", { student_email: addEmail.trim().toLowerCase() });
    if(error || !data || data.length === 0) {
      setAddMsg({type:"err", text:"해당 이메일의 학생을 찾을 수 없습니다. 학생이 가입 및 승인 완료된 상태여야 합니다."}); setAddLoading(false); return;
    }
    const student = data[0];
    // 이미 연결된 경우
    if(children.some(c => c.profile?.id === student.id)) {
      setAddMsg({type:"err", text:"이미 연결된 학생입니다."}); setAddLoading(false); return;
    }
    const { error: insErr } = await supabase.from("parent_students").insert({ parent_id: parentId, student_id: student.id });
    if(insErr && insErr.code !== '23505'){ setAddMsg({type:"err", text:"연결 중 오류가 발생했습니다."}); setAddLoading(false); return; }
    // 새 자녀 데이터 로드
    const { data: cl } = await supabase.rpc("get_child_logs", { child_id: student.id });
    onChildrenUpdate([...children, { profile: {...student, role:"student"}, logs: cl || [] }], student.id);
    setAddEmail("");
    setAddMsg({type:"ok", text:`${student.name}(${student.grade}) 학생이 연결됐어요!`});
    setAddLoading(false);
  };

  return (
    <div>
      {/* 자녀 탭 */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {children.map(c => (
          <button key={c.profile.id} onClick={()=>setSelChildId(c.profile.id)}
            style={{padding:"8px 16px",borderRadius:20,border:`2px solid ${selChildId===c.profile.id?T.navy:T.border}`,
              background:selChildId===c.profile.id?T.navy:"transparent",
              color:selChildId===c.profile.id?T.white:T.textMid,cursor:"pointer",
              fontSize:13,fontWeight:700,transition:"all 0.15s"}}>
            <span style={{display:"flex",alignItems:"center",gap:5}}>
              {HI.cap(13,selChildId===c.profile.id?T.white:T.textMid)}
              {c.profile.name} <span style={{opacity:0.7,fontWeight:400}}>({calcGrade(c.profile.birth_year, c.profile.birth_month) || c.profile.grade})</span>
            </span>
          </button>
        ))}
        {/* 자녀 추가 */}
        <div style={{display:"flex",gap:6,alignItems:"center",flex:isMobile?"1 1 100%":"initial"}}>
          <input value={addEmail} onChange={e=>{setAddEmail(e.target.value);setAddMsg(null);}}
            onKeyDown={e=>e.key==="Enter"&&handleAddChild()}
            placeholder="자녀 이메일 입력" style={{...css.input,margin:0,width:isMobile?"100%":200,fontSize:12,padding:"8px 12px"}}/>
          <button onClick={handleAddChild} disabled={addLoading}
            style={{...css.btnPrimary,padding:"8px 14px",fontSize:12,fontWeight:700,flexShrink:0,display:"flex",alignItems:"center",gap:4}}>
            {addLoading?<Spinner size={13} color="#fff"/>:"+ 추가"}
          </button>
        </div>
      </div>
      {addMsg && (
        <div style={{background:addMsg.type==="ok"?"#F0FDF4":"#FEF2F2",border:`1px solid ${addMsg.type==="ok"?"#BBF7D0":"#FECACA"}`,
          borderRadius:8,padding:"10px 14px",fontSize:13,color:addMsg.type==="ok"?"#166534":T.danger,marginBottom:12}}>
          {addMsg.type==="ok"?"✅ ":"⚠️ "}{addMsg.text}
        </div>
      )}

      {children.length === 0 ? (
        <Card style={{textAlign:"center",padding:"48px 24px"}}>
          <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}>{HI.users(44,T.muted)}</div>
          <div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:8}}>연결된 자녀가 없어요</div>
          <div style={{fontSize:13,color:T.muted}}>위에서 자녀의 이메일을 입력해 연결해보세요.</div>
        </Card>
      ) : selChild ? (<>
        {/* 자녀 뷰 탭 */}
        <div style={{display:"flex",gap:2,marginBottom:16,background:T.surfaceAlt,borderRadius:10,padding:4,width:"fit-content"}}>
          {[{v:"dashboard",icon:"cap",label:"메타인지 현황"},{v:"history",icon:"calendar",label:"학습 기록"}].map(({v,icon,label})=>(
            <button key={v} onClick={()=>setChildView(v)}
              style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,
                background:childView===v?T.navy:"transparent",color:childView===v?T.white:T.muted,transition:"all 0.15s",
                display:"flex",alignItems:"center",gap:5}}>
              {navIcon(icon,13,childView===v?T.white:T.muted)} {label}
            </button>
          ))}
        </div>
        {childView==="dashboard"
          ? <StudentDashboard logs={selChild.logs} profile={selChild.profile} isAdminView={true}/>
          : <LogHistory logs={selChild.logs} onDelete={null} isAdmin={false} allProfiles={[selChild.profile]}/>
        }
      </>) : null}
    </div>
  );
};

// ══════════════════════════════════════════════════════
// ADMIN DASHBOARD (진단 + 회원 관리)
// ── 2기 명단 상수 (렌더마다 재생성 방지) ──────────────
const ROSTER2 = [
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
// 한글 조사 헬퍼: 받침 유무 자동 판별
const _hasJong = (s) => {
  const c = s.charCodeAt(s.length-1);
  if (c < 0xAC00 || c > 0xD7A3) return false;
  return ((c - 0xAC00) % 28) !== 0;
};
const J_eul = (s) => `${s}${_hasJong(s) ? "을" : "를"}`;   // 을/를
const J_i   = (s) => `${s}${_hasJong(s) ? "이" : "가"}`;   // 이/가
const J_eun = (s) => `${s}${_hasJong(s) ? "은" : "는"}`;   // 은/는
const J_eu_ro = (s) => `${s}${_hasJong(s) ? "으로" : "로"}`; // 으로/로

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
const ROSTER2_NAVER_DATES   = _genDates([0, 3])
  .filter(d => !(d.getFullYear()===2026 && d.getMonth()===4 && d.getDate()===17))
  .concat([new Date(2026, 6, 12)]); // 7/12 일요일
const ROSTER2_MORNING_DATES = _genDates([1, 3, 5]);
const ROSTER2_NIGHT_DATES   = _genDates([0, 1, 2, 4, 5, 6])
  // 마지막 7/11(토)은 일정상 제외
  .filter(d => !(d.getFullYear()===2026 && d.getMonth()===6 && d.getDate()===11));
const ROSTER2_DAY_KO        = ['일','월','화','수','목','금','토'];
const roster2FmtKey = (dt) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
const roster2Fmt    = (dt) => `${dt.getMonth()+1}/${dt.getDate()}`;

// 카페 인증 지각 판정: 회차일 다음날 12:00 KST 까지는 정시 인정
// sessionDate: ROSTER2_NAVER_DATES의 Date (KST 자정), posted_at: ISO 또는 Date
const isLateByDeadline = (posted_at, sessionDate) => {
  if (!sessionDate) return false;
  const deadlineMs = sessionDate.getTime() + 36 * 3600 * 1000; // +1일 12시간
  return new Date(posted_at).getTime() > deadlineMs;
};

// 2기 출석 데이터 (사용 안 함 — DB attendance_logs로 마이그레이션 완료)
// 5/17~5/22 기존 데이터는 모두 attendance_logs에 저장되어 있음
// 새 출석은 /attendance 메뉴에서 CSV 업로드로 추가
const INIT_ATTENDANCE2 = {};

// ══════════════════════════════════════════════════════
// 학생: 20HA 인증 현황 탭
// ══════════════════════════════════════════════════════
const StudentCertView = ({profile, viewerMode="self"}) => {
  // viewerMode: "self" = 학생 본인 / "parent" = 학부모가 자녀 보기
  const [peerGrades, setPeerGrades] = useState({});
  const [myCafeCerts, setMyCafeCerts] = useState([]);
  const [classCertStats, setClassCertStats] = useState({}); // {name: cert_count}
  const [classSessionAvgs, setClassSessionAvgs] = useState({}); // {sessionNum: avg_score}
  const [myAttLogs, setMyAttLogs] = useState([]);            // [{session_date, session_type}]
  const [classAttStats, setClassAttStats] = useState({});    // {name: {morning, night}}
  const isMobile = useMobile();
  useEffect(() => {
    // 학년 정보: RLS 우회용 SECURITY DEFINER RPC 사용 (학생/학부모도 다른 학생 학년 조회 가능)
    supabase.rpc("get_student_grades").then(({data}) => {
      if(data && data.length>0) {
        const map = {};
        data.forEach(p => { map[p.name] = calcGrade(p.birth_year, p.birth_month) || p.grade || ""; });
        setPeerGrades(map);
      }
    });
    // 카페 인증 글 (본인 또는 자녀)
    const cafeCertReq = viewerMode === "parent"
      ? supabase.rpc("get_child_cafe_certs", {p_child_id: profile.id})
      : supabase.rpc("get_my_cafe_certs");
    cafeCertReq.then(({data}) => {
      setMyCafeCerts(data || []);
    });
    // 클래스 전체 카페 인증 카운트 (랭킹/평균용)
    supabase.rpc("get_class_cert_stats").then(({data}) => {
      const map = {};
      (data||[]).forEach(r => { map[r.student_name] = r.cert_count; });
      setClassCertStats(map);
    });
    // 회차별 클래스 평균 점수 (그래프용)
    supabase.rpc("get_class_cert_session_avgs").then(({data}) => {
      const map = {};
      (data||[]).forEach(r => { map[r.session_num] = Number(r.avg_score); });
      setClassSessionAvgs(map);
    });
    // 출석 (본인 또는 자녀)
    const attReq = viewerMode === "parent"
      ? supabase.rpc("get_child_attendance_logs", {p_child_id: profile.id})
      : supabase.rpc("get_my_attendance_logs");
    attReq.then(({data}) => {
      setMyAttLogs(data || []);
    });
    // 클래스 전체 출석 카운트 (랭킹/평균용)
    supabase.rpc("get_class_attendance_stats").then(({data}) => {
      const map = {};
      (data||[]).forEach(r => { map[r.student_name] = {morning: r.morning_count, night: r.night_count}; });
      setClassAttStats(map);
    });
  }, []);

  const fk = (dt) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  const myIdx = ROSTER2.findIndex(s => s.name === profile.name);

  const naverTotal   = ROSTER2_NAVER_DATES.length;
  const morningTotal = ROSTER2_MORNING_DATES.length;
  const nightTotal   = ROSTER2_NIGHT_DATES.length;
  const grandTotal   = naverTotal + morningTotal + nightTotal;

  // 본인의 카페 인증 회차 set (cert.posted_at → ROSTER2_NAVER_DATES의 회차 idx)
  const kstStr_ = (ts) => {
    const k = new Date(new Date(ts).getTime() + 9*3600*1000);
    return `${k.getUTCFullYear()}-${String(k.getUTCMonth()+1).padStart(2,'0')}-${String(k.getUTCDate()).padStart(2,'0')}`;
  };
  const myCertSessions = new Set();
  myCafeCerts.forEach(c => {
    const postStr = kstStr_(c.posted_at);
    for (let i = ROSTER2_NAVER_DATES.length - 1; i >= 0; i--) {
      if (postStr >= fk(ROSTER2_NAVER_DATES[i])) {
        myCertSessions.add(i);
        break;
      }
    }
  });

  // 본인 출석 set: "M-YYYY-MM-DD" 또는 "N-YYYY-MM-DD" (M=모닝, N=나잇)
  const myAttSet = new Set();
  myAttLogs.forEach(l => myAttSet.add(`${l.session_type}-${l.session_date}`));

  // 전체 통계: 모두 DB 기반
  const allStats = ROSTER2.map((s) => {
    // 본인은 myAttSet, 타 학생은 classAttStats
    let morning, night;
    if (s.name === profile.name) {
      morning = ROSTER2_MORNING_DATES.filter(dt => myAttSet.has(`M-${fk(dt)}`)).length;
      night   = ROSTER2_NIGHT_DATES.filter(dt => myAttSet.has(`N-${fk(dt)}`)).length;
    } else {
      morning = classAttStats[s.name]?.morning || 0;
      night   = classAttStats[s.name]?.night   || 0;
    }
    // N(카페): 본인은 myCertSessions, 그 외 학생은 classCertStats
    const n = s.name === profile.name ? myCertSessions.size : (classCertStats[s.name] || 0);
    return {name: s.name, naver: n, morning, night, total: n + morning + night};
  });
  const myStat = myIdx >= 0 ? allStats[myIdx] : {naver:0, morning:0, night:0, total:0};
  const ranked = [...allStats].sort((a, b) => b.total - a.total);
  const myRank = myIdx >= 0 ? ranked.findIndex(s => s.name === profile.name) + 1 : null;
  const top10  = ranked.slice(0, 10);

  // 클래스 평균
  const avgNaver   = Math.round(allStats.reduce((s,x)=>s+x.naver,0)   / allStats.length);
  const avgMorning = Math.round(allStats.reduce((s,x)=>s+x.morning,0) / allStats.length);
  const avgNight   = Math.round(allStats.reduce((s,x)=>s+x.night,0)   / allStats.length);
  const avgTotal   = avgNaver + avgMorning + avgNight;

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
  const thisWeek = Array.from({length:7}, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate()+i); return d; });

  // 주차별 달성률 (8주, 시작: 2026-05-17 일요일)
  const WEEK_START = new Date(2026, 4, 17);
  const NAVER_WEEK_START = new Date(2026, 4, 20); // 카페 인증 주 시작 (수)
  const currentWeekIdx = Math.min(7, Math.max(0, Math.floor((today - WEEK_START) / 604800000)));
  const weeklyData = Array.from({length:8}, (_, w) => {
    const allDates = [
      ...ROSTER2_NAVER_DATES.filter(dt => Math.floor((dt-NAVER_WEEK_START)/604800000)===w).map(dt=>({dt,type:"N"})),
      ...ROSTER2_MORNING_DATES.filter(dt => Math.floor((dt-WEEK_START)/604800000)===w).map(dt=>({dt,type:"M"})),
      ...ROSTER2_NIGHT_DATES.filter(dt => Math.floor((dt-WEEK_START)/604800000)===w).map(dt=>({dt,type:"나"})),
    ];
    const possible = allDates.length;
    // 전부 DB 기반 (카페=myCertSessions, 모닝/나잇=myAttSet)
    const done = allDates.filter(({dt,type}) => {
      if (type === "N") {
        const sessionIdx = ROSTER2_NAVER_DATES.findIndex(d => fk(d) === fk(dt));
        return sessionIdx >= 0 && myCertSessions.has(sessionIdx);
      }
      // type "M" = 모닝, type "나" = 나잇 → DB는 "N"
      const dbType = type === "나" ? "N" : "M";
      return myAttSet.has(`${dbType}-${fk(dt)}`);
    }).length;
    return {w:w+1, possible, done, pct: possible>0 ? Math.round(done/possible*100) : 0, isCurrent: w===currentWeekIdx};
  });

  // 목표까지 남은 횟수 (목표 80%)
  const TARGET_PCT = 80;
  const targetCount = Math.ceil(grandTotal * TARGET_PCT / 100);
  const remaining = Math.max(0, targetCount - myStat.total);

  const pct = (v, t) => t > 0 ? Math.round(v / t * 100) : 0;

  // 오늘 각 카테고리 상태 계산
  const todayKey = fk(today);
  const getActivityStatus = (dates, attendanceKey) => {
    const isScheduled = dates.some(dt => fk(dt) === todayKey);
    if (isScheduled) {
      let done;
      if (attendanceKey === "N") {
        // 카페 인증 — 회차 단위
        const sessionIdx = ROSTER2_NAVER_DATES.findIndex(dt => fk(dt) === todayKey);
        done = sessionIdx >= 0 && myCertSessions.has(sessionIdx);
      } else {
        // 모닝/나잇 — attendance_logs
        const dbType = attendanceKey === "나" ? "N" : "M";
        done = myAttSet.has(`${dbType}-${todayKey}`);
      }
      return done ? "완료" : "진행중";
    }
    const hasFuture = dates.some(dt => dt > today);
    return hasFuture ? "예정" : "종료";
  };
  const statusNaver   = getActivityStatus(ROSTER2_NAVER_DATES,   "N");
  const statusMorning = getActivityStatus(ROSTER2_MORNING_DATES, "M");
  const statusNight   = getActivityStatus(ROSTER2_NIGHT_DATES,   "나");

  const CATS = [
    {key:"morning", label:"미라클모닝",  icon:"sun",   iconBg:"#FFF0E6", v:myStat.morning, t:morningTotal, color:"#EA580C"},
    {key:"naver",   label:"카페 인증",   icon:"naver", iconBg:"#E8F5E9", v:myStat.naver,   t:naverTotal,   color:"#03C75A"},
    {key:"night",   label:"미라클나이트",icon:"moon",  iconBg:"#EEF0FF", v:myStat.night,   t:nightTotal,   color:"#6366F1"},
  ];

  // ── 멘토 인사이트 메시지 풀 (진행 회차 기반)
  const totalPct   = pct(myStat.total, grandTotal);
  const weeksLeft  = Math.max(0, 7 - currentWeekIdx);
  const thisWeekPct = weeklyData[currentWeekIdx]?.pct ?? 0;

  // 오늘까지 진행된 회차 (오늘은 진행 중이라 제외 → 어제까지)
  const pastCount = (dates) => dates.filter(d => d < todayMidnight).length;
  const morningPast = pastCount(ROSTER2_MORNING_DATES);
  const naverPast   = pastCount(ROSTER2_NAVER_DATES);
  const nightPast   = pastCount(ROSTER2_NIGHT_DATES);
  const grandPast   = morningPast + naverPast + nightPast;

  // 진행 회차 대비 달성률
  const totalPctPast = grandPast > 0 ? Math.round(myStat.total / grandPast * 100) : 0;

  // 활동별 진행 회차 기반 달성률 (past>0인 활동만 비교 대상)
  const actPctsPast = [
    {label:"미라클모닝",   p: morningPast>0 ? Math.round(myStat.morning/morningPast*100) : 0, past: morningPast, done: myStat.morning, remaining: Math.max(0, morningTotal - myStat.morning), total: morningTotal},
    {label:"카페 인증",    p: naverPast>0   ? Math.round(myStat.naver/naverPast*100)     : 0, past: naverPast,   done: myStat.naver,   remaining: Math.max(0, naverTotal   - myStat.naver),   total: naverTotal},
    {label:"미라클나이트", p: nightPast>0   ? Math.round(myStat.night/nightPast*100)     : 0, past: nightPast,   done: myStat.night,   remaining: Math.max(0, nightTotal   - myStat.night),   total: nightTotal},
  ];
  const validActs = actPctsPast.filter(a => a.past > 0);
  const weakest   = validActs.length ? [...validActs].sort((a,b)=>a.p-b.p)[0] : null;
  const strongest = validActs.length ? [...validActs].sort((a,b)=>b.p-a.p)[0] : null;

  const mentorPool = [
    // 순위
    ...(myRank===1                                    ? ["현재 클래스 1위! 이 기세를 끝까지 유지해보세요. 🏆"] : []),
    ...(myRank===2                                    ? [`1위와 ${ranked[0].total-myStat.total}회 차이예요. 따라잡을 수 있어요!`] : []),
    ...(myRank===3                                    ? ["TOP 3! 지금 이 자리를 지키는 것도 실력이에요."] : []),
    ...(myRank>3 && myRank<=Math.ceil(ROSTER2.length*.2) ? [`상위 20% 안에 있어요. 조금만 더 하면 TOP 3도 보여요.`] : []),
    // 약점 활동 (진행 회차 기반, past>0인 것만)
    ...(weakest && weakest.p < 50                     ? [`지금까지 ${weakest.label} ${weakest.p}% — 균형을 위해 조금만 신경 써보세요.`] : []),
    ...(weakest && weakest.p >= 50 && weakest.p < 80  ? [`${J_eul(weakest.label)} 한 번만 더 챙기면 균형이 잡혀요. (현재 ${weakest.p}%)`] : []),
    // 강점 활동
    ...(strongest && strongest.p === 100              ? [`${strongest.label} 지금까지 100% 완벽! 흠잡을 데가 없어요. ✅`] : []),
    ...(strongest && strongest.p >= 80 && strongest.p < 100 ? [`${J_i(strongest.label)} ${strongest.p}% — 이 활동의 루틴이 잘 잡혀있어요.`] : []),
    // 진행 대비 전체 달성률
    ...(grandPast===0                                 ? ["프로젝트가 막 시작했어요. 첫 일정부터 차근차근 채워봐요."] : []),
    ...(grandPast>0 && totalPctPast>=90               ? [`지금까지 ${totalPctPast}% 달성! 거의 모든 일정을 완수하고 있어요. 🌟`] : []),
    ...(grandPast>0 && totalPctPast>=70 && totalPctPast<90 ? [`진행된 일정의 ${totalPctPast}%를 채우고 있어요. 잘 따라가는 중이에요.`] : []),
    ...(grandPast>0 && totalPctPast>=40 && totalPctPast<70 ? [`현재 ${totalPctPast}%, 안정적으로 따라가고 있어요. 한 발씩만 더 챙겨보세요.`] : []),
    ...(grandPast>0 && totalPctPast>0 && totalPctPast<40    ? [`시작했어요. ${myStat.total}회가 쌓였어요. 다음 한 번이 루틴을 만들어요.`] : []),
    ...(grandPast>0 && totalPctPast===0               ? ["아직 첫 인증을 기다리고 있어요. 오늘 딱 하나만 해볼까요?"] : []),
    // 주차
    ...(currentWeekIdx<=1                             ? ["프로젝트 초반이에요. 지금 만드는 루틴이 8주를 결정해요."] : []),
    ...(currentWeekIdx>=2 && currentWeekIdx<=4        ? [`${currentWeekIdx+1}주차, 페이스가 잡힐 시기예요. 꾸준함이 답이에요.`] : []),
    ...(currentWeekIdx>=5 && weeksLeft>0              ? ["마지막 스퍼트 구간이에요. 지금 만드는 성과가 최종 결과예요."] : []),
    ...(weeksLeft===0                                 ? ["마지막 주예요. 오늘 하는 인증 하나하나가 기록이에요."] : []),
    // 이번 주 (활동 일정이 이번 주에 있을 때만)
    ...(thisWeekPct>=80 && weeklyData[currentWeekIdx]?.possible>0 ? [`이번 주 ${thisWeekPct}%! 이번 주 정말 잘하고 있어요. 🌟`] : []),
    // 클래스 비교
    ...(myStat.total>avgTotal*1.5 && avgTotal>0       ? ["클래스 평균의 1.5배 이상을 달성 중이에요. 탁월한 성과예요! ✨"] : []),
    ...(myStat.total>avgTotal && myStat.total<=avgTotal*1.5 && avgTotal>0 ? [`클래스 평균보다 ${myStat.total-avgTotal}회 앞서 있어요.`] : []),
    ...(myStat.total<avgTotal && avgTotal>0           ? [`평균까지 ${avgTotal-myStat.total}회예요. 오늘 조금 더 채워볼까요?`] : []),
    ...(myStat.total===avgTotal && avgTotal>0         ? ["클래스 평균 딱 그 자리에 있어요. 한 발 더 내딛어볼까요?"] : []),
  ];
  const mentorMsg = mentorPool.length > 0
    ? mentorPool[(myStat.total + myRank + currentWeekIdx) % mentorPool.length]
    : "꾸준히 인증하는 것 자체가 이미 대단한 일이에요.";

  // ── 마스터리 도전 메시지 풀 (행동 가이드 + 동기부여, 진행 회차 기반)
  const remainingTo100 = Math.max(0, grandTotal - myStat.total);
  const remainingTo80  = Math.max(0, Math.ceil(grandTotal * 0.8) - myStat.total);
  // 약점 활동의 진행 회차 중 놓친 횟수
  const weakestMissed = weakest ? Math.max(0, weakest.past - weakest.done) : 0;

  const masteryPool = [
    // 🏆 100% 완주
    ...(totalPct >= 100 ? [
      "🏆 100% 완주! 8주를 완벽하게 채웠어요.",
      "흠 잡을 데 없는 8주, 자기 통제력의 정점이에요. 🏅",
    ] : []),

    // 🎯 80~99% (목표 달성, 100% 챌린지)
    ...(totalPct >= 80 && totalPct < 100 ? [
      `🎯 목표 80% 달성! 100%까지 ${remainingTo100}회 — 완주에 도전해봐요.`,
      ...(weakest && weakest.p < 100
        ? [`${J_eul(weakest.label)} 마저 챙기면 100% — 마지막 한 발이에요. (현재 ${weakest.p}%)`]
        : []),
    ] : []),

    // 60~80% (목표 직전)
    ...(totalPct >= 60 && totalPct < 80 ? [
      `목표 80%까지 ${remainingTo80}회 — 손 닿을 거리예요.`,
      ...(weakest ? [`${J_eul(weakest.label)} 조금만 더 챙기면 목표 달성이에요. (현재 ${weakest.p}%)`] : []),
    ] : []),

    // 30~60% (페이스 안정 + 약점 보강)
    ...(totalPct >= 30 && totalPct < 60 ? [
      ...(weakest && weakest.p < 60 && weakestMissed > 0
        ? [`${weakest.label} ${weakest.p}% — 진행된 ${weakest.past}회 중 ${weakestMissed}회를 놓쳤어요. 다음부터 챙겨봐요.`]
        : []),
      `현재 진행된 일정의 ${totalPctPast}% 달성 — 페이스 잘 잡고 있어요. 마지막까지 꾸준히!`,
      ...(weakest && weakest.p >= 60 ? [`전체적으로 균형이 잡혀있어요. 이 페이스만 유지하면 충분해요.`] : []),
    ] : []),

    // 10~30% (따라잡기)
    ...(totalPct >= 10 && totalPct < 30 ? [
      ...(weakest && weakest.p === 0
        ? [`${weakest.label} 0회 — 다음 ${weakest.label} 일정부터 챙겨봐요. 가장 빠르게 따라잡을 수 있어요.`]
        : []),
      ...(weakest && weakest.p > 0 && weakest.p < 60
        ? [`${J_eun(weakest.label)} 가장 늦었어요. (${weakest.p}%) 여기에 집중하면 페이스가 살아나요.`]
        : []),
      `지금부터 매 회차를 챙기면 충분히 따라잡을 수 있어요.`,
    ] : []),

    // 1~10% (시작 직후)
    ...(totalPct > 0 && totalPct < 10 ? [
      "시작했어요. 작은 한 걸음이 8주를 만들어요.",
      ...(weakest && weakest.past > 0
        ? [`다음 ${weakest.label} 일정부터 챙겨봐요. 가장 빠르게 따라잡을 수 있어요.`]
        : []),
      ...(weakestMissed === 0 && weakest
        ? [`지금까지 챙긴 회차는 모두 완수! 다음 일정도 놓치지 말고 챙겨봐요.`]
        : []),
    ] : []),

    // 0회 (시작 전)
    ...(myStat.total === 0 && grandPast > 0 ? [
      "첫 인증이 가장 어려워요. 오늘 일정부터 하나만 도전!",
      "한 회차씩 쌓이는 게 결국 8주 결과예요. 지금 시작해볼까요?",
    ] : []),

    // 프로젝트 시작 전
    ...(grandPast === 0 ? [
      "프로젝트가 막 시작했어요. 첫 회차부터 차근차근 채워봐요.",
    ] : []),

    // 마지막 주 미완
    ...(weeksLeft === 0 && totalPct < 100 ? [
      `마지막 주, 100%까지 ${remainingTo100}회 — 끝까지 달려요!`,
    ] : []),
  ];
  const masteryMsg = masteryPool.length > 0
    ? masteryPool[(myStat.total + currentWeekIdx) % masteryPool.length]
    : "한 회차씩 차근차근 챙기면 8주가 채워져요.";

  return (
    <div style={{display:"grid", gap:12}}>

      {/* ① 히어로 카드 — Stitch 스타일 */}
      <div style={{borderRadius:20, background:"linear-gradient(135deg,#0D1340 0%,#141B5C 50%,#1E2878 100%)", padding:"28px 32px", color:"#fff", position:"relative", overflow:"hidden"}}>
        {/* 배경 장식 */}
        <div style={{position:"absolute",top:-60,right:-60,width:240,height:240,borderRadius:"50%",background:"rgba(255,255,255,0.03)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-80,right:"30%",width:300,height:300,borderRadius:"50%",background:"rgba(28,40,120,0.5)",pointerEvents:"none"}}/>

        <div style={{position:"relative"}}>
          {/* Academic Progress 배지 */}
          <div style={{display:"inline-block",background:"#fc9024",borderRadius:20,padding:"4px 14px",fontSize:11,fontWeight:700,color:"#fff",marginBottom:14,letterSpacing:"0.02em"}}>
            20HA 2기 진행 중
          </div>

          {/* 제목 + 순위 */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:22,fontWeight:900,color:"#ffffff",lineHeight:1.3,marginBottom:10}}>
                나의 20HA 인증 현황
              </div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:1.75,maxWidth:480}}>
                8주 동안 미라클모닝·카페 인증·미라클나이트를 실천하는 자기계발 챌린지.<br/>
                매일의 작은 실천이 쌓여 진짜 변화를 만들어요.
              </div>
            </div>
            {/* 순위 */}
            <div style={{marginLeft:24,flexShrink:0,textAlign:"center",background:"rgba(255,255,255,0.08)",borderRadius:14,padding:"12px 20px",border:"1px solid rgba(255,255,255,0.18)"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.7)",fontWeight:600,letterSpacing:"0.06em",marginBottom:6}}>클래스 순위</div>
              <div style={{display:"flex",alignItems:"baseline",gap:3,justifyContent:"center"}}>
                <span style={{fontSize:36,fontWeight:900,color:"#fc9024",lineHeight:1}}>{myRank ?? "—"}</span>
                <span style={{fontSize:14,color:"rgba(255,255,255,0.75)"}}>위</span>
              </div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.55)",marginTop:4}}>/ {ROSTER2.length}명 중</div>
            </div>
          </div>

          {/* 진행 바 + % */}
          <div style={{display:"flex",alignItems:"center",gap:16,marginTop:18}}>
            <div style={{flex:1,position:"relative"}}>
              <div style={{height:8,background:"rgba(255,255,255,0.15)",borderRadius:4,position:"relative"}}>
                {/* 진행 채우기 (왼쪽부터) */}
                <div style={{height:"100%",width:`${totalPct}%`,background:"linear-gradient(90deg,#fc9024,#ffb77e)",borderRadius:4,transition:"width 1s ease"}}/>
                {/* 80% 목표 마커 — 강조 */}
                <div style={{position:"absolute",left:"80%",top:-4,bottom:-4,width:3,background:"#fff",zIndex:2,boxShadow:"0 0 8px rgba(255,255,255,0.7)",borderRadius:2}}/>
              </div>
              {/* 라벨: 0% / 🎯 목표 80% (80% 위치) / 100% */}
              <div style={{position:"relative",marginTop:8,height:14,fontSize:10,color:"rgba(255,255,255,0.5)"}}>
                <span style={{position:"absolute",left:0}}>0%</span>
                <span style={{position:"absolute",left:"80%",transform:"translateX(-50%)",color:"#fff",fontWeight:800,fontSize:11,whiteSpace:"nowrap"}}>🎯 목표 80%</span>
                <span style={{position:"absolute",right:0}}>100%</span>
              </div>
            </div>
            <div style={{flexShrink:0,textAlign:"right"}}>
              <div style={{fontSize:22,fontWeight:900,color:"#fff",lineHeight:1}}>{totalPct}%</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",marginTop:4}}>{myStat.total} / {grandTotal}회</div>
            </div>
          </div>
        </div>
      </div>

      {/* ② 항목별 3칸 — Stitch 스타일 카드 */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8}}>
        {CATS.map(({label, icon, iconBg, v, t, color}) => (
          <div key={label} style={{borderRadius:16, background:"#FFFFFF", border:"1px solid #E2E6F3",
            padding:"20px 14px 16px", boxShadow:"0 2px 8px rgba(25,29,84,0.06)",
            display:"flex", flexDirection:"column", alignItems:"center", gap:10, textAlign:"center"}}>
            {/* 아이콘 원형 */}
            <div style={{width:60, height:60, borderRadius:"50%", background:iconBg,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              {icon === "naver" ? (
                <div style={{width:30, height:30, background:"#03C75A", borderRadius:6,
                  display:"flex", alignItems:"center", justifyContent:"center"}}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
                  </svg>
                </div>
              ) : (
                HI[icon]?.(28, color) || <span style={{fontSize:26}}>{icon}</span>
              )}
            </div>
            {/* 제목 */}
            <div style={{fontSize:14, color:"#8B91C0", fontWeight:500, letterSpacing:"0.02em"}}>{label}</div>
            {/* 진행 바 */}
            <div style={{width:"100%", padding:"0 6px"}}>
              <div style={{height:8, background:`${color}22`, borderRadius:6, overflow:"hidden"}}>
                <div style={{height:"100%", width:`${pct(v,t)}%`, background:color, borderRadius:6, transition:"width 0.8s ease"}}/>
              </div>
            </div>
            {/* 횟수 */}
            <div style={{fontSize:15, fontWeight:700, color:"#191D54"}}>{v} / {t}회</div>
          </div>
        ))}
      </div>

      {/* ③ 8주 전체 일정 */}
      {(()=>{
        const myGrade = calcGrade(profile.birth_year, profile.birth_month) || profile.grade || "";
        // 학년 → 학교급 그룹 변환 ("초N"→"초등부", "중N"→"중등부", "고N"→"고등부")
        const gradeGroup = (g) => {
          if (!g) return "";
          if (g.startsWith("초")) return "초등부";
          if (g.startsWith("중")) return "중등부";
          if (g.startsWith("고")) return "고등부";
          return "";
        };
        const myGroup = gradeGroup(myGrade);
        const sameGroupRanked = myGroup && Object.keys(peerGrades).length>0
          ? [...allStats].filter(s=>gradeGroup(peerGrades[s.name]||"")===myGroup).sort((a,b)=>b.total-a.total).slice(0,3)
          : [];
        const meInTop3 = ranked.slice(0,3).some(s => s.name === profile.name);
        const meInGroupTop3 = sameGroupRanked.some(s => s.name === profile.name);
        const ACTIVITIES = [
          {label:"미라클모닝", dates:ROSTER2_MORNING_DATES, type:"M",   color:"#EA580C"},
          {label:"카페 인증",  dates:ROSTER2_NAVER_DATES,   type:"N",   color:"#03C75A"},
          {label:"미라클나이트",dates:ROSTER2_NIGHT_DATES,   type:"나",  color:"#6366F1"},
        ];
        const RankRow = ({s, rank, isMe, highlightFirst}) => {
          const medalColors=["#F59E0B","#94A3B8","#B87333"];
          const goldHL = rank===0 && highlightFirst;
          return(
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:9,
              background:isMe?"#EEF2FF":goldHL?"#FFFBEB":"transparent",
              border:`1px solid ${isMe?"#C7D2FE":goldHL?"#FDE68A":"transparent"}`}}>
              <span style={{width:24,height:24,borderRadius:6,background:medalColors[rank]||"#CBD5E1",
                display:"inline-flex",alignItems:"center",justifyContent:"center",
                fontSize:11,fontWeight:900,color:"#fff",flexShrink:0}}>{rank+1}</span>
              <div style={{flex:1,fontSize:13,fontWeight:isMe?800:500,color:T.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {s.name}{isMe&&<span style={{fontSize:9,color:"#4F46E5",marginLeft:3}}>(나)</span>}
              </div>
              <div style={{fontSize:12,fontWeight:800,color:isMe?"#4F46E5":goldHL?T.orange:T.navy,flexShrink:0}}>{pct(s.total,grandTotal)}%</div>
            </div>
          );
        };
        return(<>
          <Card style={{padding:"16px 18px"}}>
            <div style={{fontSize:13,fontWeight:800,color:T.navy,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
              {HI.calendar(15,T.navy)} 8주 전체 일정
            </div>
            {/* 주차 × 활동 히트맵 그리드 */}
            {(()=>{
              const cell = isMobile ? 18 : 22;
              const labelW = isMobile ? 66 : 80;
              // 주차별 시작 날짜 계산
              const weekStarts = Array.from({length:8}, (_,i) => new Date(WEEK_START.getTime()+i*7*86400000));
              return(
                <div style={{position:"relative"}}>
                  <div style={{overflowX:"auto", WebkitOverflowScrolling:"touch"}}>
                    <table style={{borderCollapse:"separate",borderSpacing:`${isMobile?2:3}px 0`,minWidth: labelW + 8*(cell+3)}}>
                      <thead>
                        {/* 월 표시 행 */}
                        <tr>
                          <td style={{width:labelW}}/>
                          {weekStarts.map((ws,i)=>{
                            const prevWs = i>0 ? weekStarts[i-1] : null;
                            const showMonth = i===0 || ws.getMonth() !== prevWs.getMonth();
                            return(
                              <td key={i} style={{textAlign:"center",fontSize:9,color:T.muted,fontWeight:600,
                                paddingTop:4,paddingBottom:2,whiteSpace:"nowrap",
                                background: currentWeekIdx===i ? "rgba(246,139,30,0.07)" : "transparent",
                                borderRadius: currentWeekIdx===i ? "8px 8px 0 0" : 0}}>
                                {showMonth ? `${ws.getMonth()+1}월` : ""}
                              </td>
                            );
                          })}
                        </tr>
                        {/* 주차 헤더 */}
                        <tr>
                          <td style={{width:labelW,paddingBottom:8}}/>
                          {Array.from({length:8},(_,i)=>(
                            <td key={i} style={{textAlign:"center",paddingBottom:8,paddingTop:0,
                              background: currentWeekIdx===i ? "rgba(246,139,30,0.07)" : "transparent"}}>
                              <span style={{
                                color: currentWeekIdx===i ? T.orange : T.muted,
                                fontWeight: currentWeekIdx===i ? 800 : 600,
                                fontSize: isMobile ? 9 : 10,
                              }}>{i+1}주</span>
                            </td>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ACTIVITIES.map(({label,dates,type,color}, actIdx)=>{
                          const isLast = actIdx === ACTIVITIES.length - 1;
                          return(
                          <tr key={label}>
                            <td style={{fontSize:isMobile?10:11,fontWeight:700,color,paddingRight:6,whiteSpace:"nowrap",verticalAlign:"middle",
                              paddingTop: actIdx===0?2:4, paddingBottom: isLast?6:4}}>
                              ● {label}
                            </td>
                            {weekStarts.map((wStart,wIdx)=>{
                              // 카페 인증(N)은 5/20 수요일 기준으로 주 분할 (수~화), 모닝/나잇은 일요일 기준
                              const actualWStart = type==="N"
                                ? new Date(NAVER_WEEK_START.getTime()+wIdx*7*86400000)
                                : wStart;
                              const wEnd=new Date(actualWStart.getTime()+7*86400000);
                              const wDates=[...dates].filter(dt=>dt>=actualWStart&&dt<wEnd).sort((a,b)=>a-b);
                              const isCurrentWeek = wIdx===currentWeekIdx;
                              return(
                                <td key={wIdx} style={{verticalAlign:"middle",
                                  paddingTop: actIdx===0?2:4, paddingBottom: isLast?6:4,
                                  paddingLeft:2, paddingRight:2,
                                  background: isCurrentWeek ? "rgba(246,139,30,0.07)" : "transparent",
                                  borderRadius: isCurrentWeek && isLast ? "0 0 8px 8px" : 0}}>
                                  <div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>
                                    {wDates.length===0
                                      ? <div style={{width:cell,height:cell,borderRadius:4,background:T.surfaceAlt,border:`1px solid ${T.border}`}}/>
                                      : wDates.map((dt,i)=>{
                                          const dk=fk(dt);
                                          let done;
                                          if (type === "N") {
                                            const sessionIdx = ROSTER2_NAVER_DATES.findIndex(d => fk(d) === dk);
                                            done = sessionIdx >= 0 && myCertSessions.has(sessionIdx);
                                          } else {
                                            const dbType = type === "나" ? "N" : "M";
                                            done = myAttSet.has(`${dbType}-${dk}`);
                                          }
                                          const isPast=dt<todayMidnight;
                                          const missed = isPast && !done;
                                          return(
                                            <div key={i} title={`${dt.getMonth()+1}/${dt.getDate()}`} style={{
                                              width:cell,height:cell,borderRadius:4,
                                              background:done?color:missed?"transparent":"#F0F2FA",
                                              border:`1px solid ${done?color:missed?`${color}35`:"#E2E6F3"}`,
                                              display:"flex",alignItems:"center",justifyContent:"center",
                                              flexShrink:0, position:"relative", overflow:"hidden"
                                            }}>
                                              {done && (
                                                <span style={{fontSize:isMobile?7:8,fontWeight:700,color:"#fff"}}>{dt.getDate()}</span>
                                              )}
                                              {missed && (<>
                                                {/* 사선 */}
                                                <div style={{position:"absolute",top:"50%",left:"-5%",width:"110%",height:"1.5px",
                                                  background:`${color}60`,transform:"rotate(-45deg)",transformOrigin:"center"}}/>
                                                <span style={{fontSize:isMobile?7:8,fontWeight:400,color:`${color}70`,zIndex:1}}>{dt.getDate()}</span>
                                              </>)}
                                              {!done && !missed && (
                                                <span style={{fontSize:isMobile?7:8,fontWeight:700,color:"#C8CEED"}}>{dt.getDate()}</span>
                                              )}
                                            </div>
                                          );
                                        })
                                    }
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* 모바일 스크롤 힌트 페이드 */}
                  {isMobile && (
                    <div style={{position:"absolute",top:0,right:0,bottom:0,width:24,background:"linear-gradient(to right,transparent,#fff)",pointerEvents:"none"}}/>
                  )}
                </div>
              );
            })()}
            {/* 범례 */}
            <div style={{display:"flex",gap:14,marginTop:12,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.muted}}>
                <div style={{width:12,height:12,borderRadius:3,background:"#03C75A"}}/> 완료
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.muted}}>
                <div style={{width:12,height:12,borderRadius:3,border:"1px solid #C8CEED",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:"50%",left:"-5%",width:"110%",height:"1.5px",background:"#94A3B8",transform:"rotate(-45deg)",transformOrigin:"center"}}/>
                </div> 미완료
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.muted}}>
                <div style={{width:12,height:12,borderRadius:3,background:"#F0F2FA",border:"1px solid #E2E6F3"}}/> 예정
              </div>
              <div style={{marginLeft:"auto",fontSize:10,color:T.muted,opacity:0.6}}>
                ⚠️ 인증 데이터는 실시간으로 반영되지 않을 수 있습니다.
              </div>
            </div>
          </Card>

          {/* ③-2 카페 인증 현황 (회차별 점수) */}
          <Card style={{padding:"16px 18px"}}>
            <div style={{fontSize:13,fontWeight:800,color:T.navy,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
              📝 나의 카페 인증 현황
              <span style={{fontSize:10,fontWeight:400,color:T.muted}}>· 회차별 점수 / 채점 상태</span>
            </div>
            {(()=>{
              const kstStr = ts => {
                const k = new Date(new Date(ts).getTime() + 9*3600*1000);
                return `${k.getUTCFullYear()}-${String(k.getUTCMonth()+1).padStart(2,'0')}-${String(k.getUTCDate()).padStart(2,'0')}`;
              };
              // 회차별로 본인 cert 매칭 (지각도 해당 회차에 포함)
              const sessionMap = {};
              ROSTER2_NAVER_DATES.forEach((dt, idx) => {
                sessionMap[idx] = {date: dt, cert: null, isLate: false};
              });
              myCafeCerts.forEach(c => {
                const postStr = kstStr(c.posted_at);
                for (let i = ROSTER2_NAVER_DATES.length - 1; i >= 0; i--) {
                  const certStr = fk(ROSTER2_NAVER_DATES[i]);
                  if (postStr >= certStr) {
                    if (!sessionMap[i].cert) {
                      sessionMap[i].cert = c;
                      sessionMap[i].isLate = isLateByDeadline(c.posted_at, ROSTER2_NAVER_DATES[i]);
                    }
                    break;
                  }
                }
              });

              const cols = isMobile ? 3 : 5;
              return (
                <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:8}}>
                  {ROSTER2_NAVER_DATES.map((dt, idx) => {
                    const sm = sessionMap[idx];
                    const cert = sm.cert;
                    const isLate = sm.isLate;
                    const hasScore = cert && cert.completeness_score !== null && cert.completeness_score !== undefined;
                    const submitted = !!cert;
                    const total = hasScore ? Number(cert.completeness_score) : null;
                    const isLow = total !== null && total < 80;
                    const dateLabel = `${dt.getMonth()+1}/${dt.getDate()}(${ROSTER2_DAY_KO[dt.getDay()]})`;
                    return (
                      <div key={idx} style={{
                        padding:"10px 8px",
                        borderRadius:10,
                        border:`1px solid ${isLow?"#FECACA":hasScore?"#86EFAC":submitted?"#FCD34D":"#E2E6F3"}`,
                        background:isLow?"#FEF2F2":hasScore?"#F0FDF4":submitted?"#FFFBEB":"#F8FAFC",
                        textAlign:"center",
                      }}>
                        {/* 1행: 회차 + 날짜 */}
                        <div style={{display:"flex",justifyContent:"center",alignItems:"baseline",gap:4,marginBottom:6}}>
                          <span style={{fontSize:11,fontWeight:800,color:T.navy}}>{idx+1}회</span>
                          <span style={{fontSize:10,color:T.muted}}>{dateLabel}</span>
                        </div>
                        {/* 2행: 상태/점수 (3분할 + 종합) */}
                        {hasScore ? (
                          <div>
                            <div style={{fontSize:9,color:T.muted,lineHeight:1.5,marginBottom:4}}>
                              <div>제출 {cert.submit_score ?? "—"} / 미션 {cert.mission_score ?? "—"}</div>
                              <div>충실도 {cert.fidelity_score ?? "—"}</div>
                            </div>
                            <div style={{fontSize:18,fontWeight:900,color:isLow?"#DC2626":"#16A34A",lineHeight:1}}>
                              {total}<span style={{fontSize:10,fontWeight:600,marginLeft:2}}>점</span>
                            </div>
                            {isLate && <div style={{fontSize:9,color:"#B45309",marginTop:3,fontWeight:600}}>⚠️ 지각</div>}
                          </div>
                        ) : submitted ? (
                          <div>
                            <div style={{fontSize:11,fontWeight:800,color:"#B45309"}}>제출 완료</div>
                            <div style={{fontSize:9,color:T.muted,marginTop:2}}>채점 중...</div>
                            {isLate && <div style={{fontSize:9,color:"#B45309",marginTop:2,fontWeight:600}}>⚠️ 지각</div>}
                          </div>
                        ) : (
                          <div style={{fontSize:11,color:T.muted,fontWeight:600}}>미제출</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {/* 점수 가이드라인 */}
            <div style={{marginTop:14,padding:"12px 14px",borderRadius:8,background:"#F8FAFC",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,fontWeight:800,color:T.navy,marginBottom:8}}>📌 점수 가이드라인 (총 100점)</div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3, 1fr)",gap:8,fontSize:10,color:T.muted,lineHeight:1.5}}>
                <div>
                  <span style={{fontWeight:700,color:T.navy}}>① 제출 (50점)</span><br/>
                  인증 주기(수/일) 내 제출 — 제출 50점 / 미제출 0점
                </div>
                <div>
                  <span style={{fontWeight:700,color:T.navy}}>② 필수 미션 (30점)</span><br/>
                  주차별 필수 미션 — 모두 포함 30 / 일부 포함 15
                </div>
                <div>
                  <span style={{fontWeight:700,color:T.navy}}>③ 내용 충실도 (20점)</span><br/>
                  학습 과정·결과의 구체성과 성실도 — 매우우수 20 / 우수 15 / 보통 10 / 미흡 5
                </div>
              </div>
            </div>
          </Card>

          {/* ③-3 카페 인증 점수 그래프 */}
          <Card style={{padding:"16px 18px"}}>
            {(()=>{
              const kstStr = ts => {
                const k = new Date(new Date(ts).getTime() + 9*3600*1000);
                return `${k.getUTCFullYear()}-${String(k.getUTCMonth()+1).padStart(2,'0')}-${String(k.getUTCDate()).padStart(2,'0')}`;
              };
              // 회차별 본인 점수 매핑 (지각 포함, 다중 글은 최고점)
              const myBySession = {};
              myCafeCerts.forEach(c => {
                const postStr = kstStr(c.posted_at);
                let sn = null;
                for (let i = ROSTER2_NAVER_DATES.length - 1; i >= 0; i--) {
                  if (postStr >= fk(ROSTER2_NAVER_DATES[i])) { sn = i+1; break; }
                }
                if (!sn) return;
                const sc = c.completeness_score;
                if (sc === null || sc === undefined) return;
                if (myBySession[sn] === undefined || Number(sc) > myBySession[sn]) {
                  myBySession[sn] = Number(sc);
                }
              });
              const myScores = Object.values(myBySession);
              const myAvg = myScores.length ? myScores.reduce((a,b)=>a+b,0)/myScores.length : null;
              const myHigh = myScores.length ? Math.max(...myScores) : null;
              const myLow  = myScores.length ? Math.min(...myScores) : null;
              const safeCount = myScores.filter(s => s>=80).length;
              const classAvgAll = Object.values(classSessionAvgs);
              const classAvgOverall = classAvgAll.length ? classAvgAll.reduce((a,b)=>a+b,0)/classAvgAll.length : null;
              const avgDiff = (myAvg!==null && classAvgOverall!==null) ? Math.round((myAvg - classAvgOverall) * 10) / 10 : null;
              const chartData = ROSTER2_NAVER_DATES.map((dt, idx) => {
                const sn = idx+1;
                return {
                  name: `${sn}회`,
                  date: `${dt.getMonth()+1}/${dt.getDate()}`,
                  myScore: myBySession[sn] ?? null,
                  classAvg: classSessionAvgs[sn] ?? null,
                };
              });
              const ChartTooltip = ({active, payload, label}) => {
                if (!active || !payload || !payload.length) return null;
                const me = payload.find(p=>p.dataKey==="myScore")?.value;
                const cls = payload.find(p=>p.dataKey==="classAvg")?.value;
                const d = chartData.find(x=>x.name===label);
                return (
                  <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",fontSize:11,boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>
                    <div style={{fontWeight:800,color:T.navy,marginBottom:4}}>{label} {d&&<span style={{color:T.muted,fontWeight:500}}>({d.date})</span>}</div>
                    <div style={{color:"#16A34A",fontWeight:700}}>내 점수: {me!==null&&me!==undefined?`${me}점`:"미제출"}</div>
                    <div style={{color:T.muted}}>전체 평균: {cls!==null&&cls!==undefined?`${cls}점`:"-"}</div>
                  </div>
                );
              };

              return (
              <>
                <div style={{fontSize:13,fontWeight:800,color:T.navy,marginBottom:12,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  📊 카페 인증 점수 그래프
                  <span style={{fontSize:10,fontWeight:400,color:T.muted}}>· 회차별 내 점수 vs 전체 평균</span>
                </div>

                {/* 요약 미니 카드 5개 */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:8,marginBottom:14}}>
                  <div style={{padding:"8px 10px",borderRadius:8,background:"#F0FDF4",border:"1px solid #BBF7D0",textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#15803D",fontWeight:700}}>📈 내 누적 평균</div>
                    <div style={{fontSize:16,fontWeight:900,color:"#16A34A",marginTop:2}}>
                      {myAvg!==null ? `${Math.round(myAvg*10)/10}점` : "—"}
                    </div>
                  </div>
                  <div style={{padding:"8px 10px",borderRadius:8,background:"#EFF6FF",border:"1px solid #BFDBFE",textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#1D4ED8",fontWeight:700}}>🎯 80점 이상</div>
                    <div style={{fontSize:16,fontWeight:900,color:"#2563EB",marginTop:2}}>
                      {myScores.length>0 ? `${safeCount}/${myScores.length}회` : "—"}
                    </div>
                  </div>
                  <div style={{padding:"8px 10px",borderRadius:8,background:"#FEF3C7",border:"1px solid #FDE68A",textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#92400E",fontWeight:700}}>⭐ 내 최고/최저 점수</div>
                    <div style={{fontSize:13,fontWeight:900,color:"#B45309",marginTop:2}}>
                      {myHigh!==null ? `${myHigh}/${myLow}점` : "—"}
                    </div>
                  </div>
                  <div style={{padding:"8px 10px",borderRadius:8,background:"#F8FAFC",border:`1px solid ${T.border}`,textAlign:"center"}}>
                    <div style={{fontSize:10,color:T.muted,fontWeight:700}}>👥 전체 누적 평균</div>
                    <div style={{fontSize:16,fontWeight:900,color:T.navy,marginTop:2}}>
                      {classAvgOverall!==null ? `${Math.round(classAvgOverall*10)/10}점` : "—"}
                    </div>
                  </div>
                  <div style={{padding:"8px 10px",borderRadius:8,
                    background: avgDiff===null?"#F8FAFC": avgDiff>=0?"#F0FDF4":"#FEE2E2",
                    border:`1px solid ${avgDiff===null?T.border: avgDiff>=0?"#BBF7D0":"#FECACA"}`,textAlign:"center"}}>
                    <div style={{fontSize:10,color:avgDiff===null?T.muted: avgDiff>=0?"#15803D":"#991B1B",fontWeight:700}}>📊 전체 평균 대비</div>
                    <div style={{fontSize:16,fontWeight:900,color:avgDiff===null?T.muted: avgDiff>=0?"#16A34A":"#DC2626",marginTop:2}}>
                      {avgDiff===null ? "—" : `${avgDiff>=0?"+":""}${avgDiff}점`}
                    </div>
                  </div>
                </div>

                {/* 그래프 */}
                <ResponsiveContainer width="100%" height={isMobile?240:280}>
                  <ComposedChart data={chartData} margin={{top:20,right:84,left:-8,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB"/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:T.muted}} interval={0}/>
                    <YAxis domain={[0,100]} tick={{fontSize:10,fill:T.muted}} ticks={[0,20,40,60,80,100]}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    {(()=>{
                      // 두 기준선 라벨이 겹치지 않도록 dy 자동 분리
                      // myAvg가 80 위면 myAvg 위쪽·80 아래쪽 / myAvg가 80 아래면 반대
                      const myAvgVal = myAvg;
                      const aboveOrEq = myAvgVal !== null && myAvgVal >= 80;
                      const safeDy   = aboveOrEq ? 12 : -4;   // 80 라벨
                      const myAvgDy  = aboveOrEq ? -4 : 12;   // 내 평균 라벨
                      return (
                        <>
                          <ReferenceLine y={80} stroke="#DC2626" strokeDasharray="4 4" strokeWidth={1.5}
                            label={{value:"안전선(80)", position:"right", fontSize:10, fill:"#DC2626", dy:safeDy, dx:6}}/>
                          {myAvgVal!==null && (
                            <ReferenceLine y={myAvgVal} stroke="#2563EB" strokeDasharray="6 3" strokeWidth={1.5}
                              label={{value:`내 누적 평균(${Math.round(myAvgVal*10)/10})`, position:"right", fontSize:10, fill:"#2563EB", dy:myAvgDy, dx:6}}/>
                          )}
                        </>
                      );
                    })()}
                    <Bar dataKey="myScore" name="내 점수" radius={[6,6,0,0]} barSize={isMobile?10:14}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.myScore===null ? "#E5E7EB" : entry.myScore < 80 ? "#DC2626" : "#16A34A"}/>
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="classAvg" name="전체 평균" stroke="#94A3B8" strokeWidth={2}
                      dot={{r:3,fill:"#94A3B8",strokeWidth:0}} activeDot={{r:5}} connectNulls={false}/>
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{display:"flex",justifyContent:"center",gap:14,fontSize:10,color:T.muted,marginTop:6,flexWrap:"wrap"}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                    <span style={{display:"inline-block",width:10,height:10,background:"#16A34A",borderRadius:2}}/>내 점수 (80 이상)
                  </span>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                    <span style={{display:"inline-block",width:10,height:10,background:"#DC2626",borderRadius:2}}/>내 점수 (80 미만)
                  </span>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                    <span style={{display:"inline-block",width:14,height:2,background:"#94A3B8"}}/>전체 평균 (회차별)
                  </span>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                    <span style={{display:"inline-block",width:14,borderTop:"2px dashed #2563EB"}}/>내 누적 평균
                  </span>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                    <span style={{display:"inline-block",width:14,borderTop:"2px dashed #DC2626"}}/>80점 안전선
                  </span>
                </div>
              </>);
            })()}
          </Card>

          {/* ④ 랭킹 2열 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card style={{padding:"14px 16px"}}>
              <div style={{fontSize:13,fontWeight:800,color:T.navy,marginBottom:10,display:"flex",alignItems:"center",gap:5}}>{HI.trophy(14,T.navy)} 전체 BEST 3</div>
              <div style={{display:"grid",gap:5}}>
                {ranked.slice(0,3).map((s,rank)=>(
                  <RankRow key={rank} s={s} rank={rank} isMe={s.name===profile.name} highlightFirst={meInTop3}/>
                ))}
              </div>
            </Card>
            <Card style={{padding:"14px 16px"}}>
              <div style={{fontSize:13,fontWeight:800,color:T.navy,marginBottom:10,display:"flex",alignItems:"center",gap:5}}>
                {HI.cap(14,T.navy)} {myGroup ? `${myGroup} BEST 3` : "BEST 3"}
              </div>
              {sameGroupRanked.length===0 ? (
                <div style={{fontSize:11,color:T.muted,textAlign:"center",padding:"16px 0"}}>
                  {Object.keys(peerGrades).length===0?"학년 정보 로딩 중...":"같은 그룹 데이터 없음"}
                </div>
              ) : (
                <div style={{display:"grid",gap:5}}>
                  {sameGroupRanked.map((s,rank)=>(
                    <RankRow key={rank} s={s} rank={rank} isMe={s.name===profile.name} highlightFirst={meInGroupTop3}/>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>);
      })()}

      {/* ⑤ 멘토 인사이트 + 마스터리 도전 — 2열 */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
        <div style={{borderRadius:14, background:"#1E2255", padding:"16px 18px", color:"#fff"}}>
          <div style={{fontSize:13, fontWeight:700, marginBottom:6, display:"flex", alignItems:"center", gap:5}}>
            {HI.bell(13,"rgba(255,255,255,0.9)")} 멘토 인사이트
          </div>
          <div style={{fontSize:12, opacity:0.8, lineHeight:1.8}}>{mentorMsg}</div>
        </div>
        <div style={{borderRadius:14, background:"linear-gradient(135deg,#F68B1E,#FFA94D)", padding:"16px 18px", color:"#fff"}}>
          <div style={{fontSize:13, fontWeight:700, marginBottom:6, display:"flex", alignItems:"center", gap:5}}>
            {HI.trophy(13,"rgba(255,255,255,0.9)")} 마스터리 도전!
          </div>
          <div style={{fontSize:12, opacity:0.9, lineHeight:1.8, marginBottom:6}}>{masteryMsg}</div>
          <div style={{fontSize:11, opacity:0.7}}>전체 {grandTotal}회 중 {myStat.total}회 완료</div>
        </div>
      </div>

    </div>
  );
};

// ══════════════════════════════════════════════════════
const AdminDashboard = ({allLogs, allProfiles, onRefresh, defaultTab="users", defaultRoster2Tab="overview"}) => {
  const [adminTab, setAdminTab] = useState(defaultTab);
  useEffect(() => { setAdminTab(defaultTab); }, [defaultTab]);
  const [roster2Tab, setRoster2Tab] = useState(defaultRoster2Tab); // "overview" | "scoresheet" | "grading" | "attendance"
  useEffect(() => { setRoster2Tab(defaultRoster2Tab); }, [defaultRoster2Tab]);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterSort, setRosterSort] = useState({by:"name",dir:"asc"});
  const [attendance2, setAttendance2] = useState({}); // attendance_logs에서 로드 (key: "${roster2Idx}-${type}-${YYYY-MM-DD}")
  const [sel, setSel]           = useState("전체");
  const [editStudent, setEditStudent] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [filterStatus, setFilterStatus] = useState("all"); // "all"|"pending"|"approved"|"rejected"
  const [filterRole, setFilterRole]   = useState("all"); // "all"|"student"|"parent"
  const [detailStudent, setDetailStudent] = useState(null);

  // 기수 데이터 (회원 관리·2기 명단 공용)
  const ROSTER2_NAMES = new Set(["강예나","김가흔","김은채","김태준","박재현","손연재","윤준원","최지유","배정윤","심수윤","한설아","강가인","권민유","권순혁","최유주","김도현","김시원","김시윤","김아란","김준범","김지우","김호진","나지성","문지유","박지우","서소윤","서지우","송민건","양소윤","오수연","우정훈","윤서준","이유빈","이홍윤","임다은","정유진","박선율","한채린","오수빈","남희수","김가인","양은정","테스트학생","한유찬","문성민"]);
  // 다중 기수 지원: DB 학생은 1기 기본, 2기 명단 포함 시 둘 다
  const getCohorts = (profile) => {
    if (profile.role !== "student") return [];
    const tags = ["20HA 1기"];
    if (ROSTER2_NAMES.has(profile.name)) tags.push("20HA 2기");
    return tags;
  };
  // 회원 관리 검색·페이지 state
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPageSize, setMemberPageSize] = useState(20);
  const [memberPage, setMemberPage] = useState(1);
  const [dashColFilter, setDashColFilter] = useState({});
  const [dashFilterOpen, setDashFilterOpen] = useState(null);
  const [parentLinks, setParentLinks] = useState({}); // {parent_id: [{student_id, name, grade}]}
  const [certData, setCertData] = useState([]); // get_cert_status 결과
  const [certLoading, setCertLoading] = useState(false);
  const [certWeekOffset, setCertWeekOffset] = useState(0); // 0=이번주, -1=지난주 ...
  const [certNickEdit, setCertNickEdit] = useState({}); // {profile_id: editing_value}
  const [invalidCerts, setInvalidCerts] = useState([]);
  const [sessionViewIdx, setSessionViewIdx] = useState(0); // 회차별 확인: 선택 회차 인덱스 (0-based)
  const [certSessionModal, setCertSessionModal] = useState(null); // {id, postTitle, posted_at, sessions: number[]}
  const [certScoreModal, setCertScoreModal] = useState(null); // {id, postTitle, submit, mission, fidelity}
  const [certScoreSaving, setCertScoreSaving] = useState(false);
  const [lastCrawledAt, setLastCrawledAt] = useState(null);
  const [certRecordsPage, setCertRecordsPage] = useState(1);
  const CERT_RECORDS_PAGE_SIZE = 30;
  const [certSearch, setCertSearch] = useState("");
  const [certSessionFilter, setCertSessionFilter] = useState("all"); // "all" | number
  const [certScoreFilter, setCertScoreFilter] = useState("all"); // "all" | "scored" | "unscored" | "low"
  const [certTimeFilter, setCertTimeFilter] = useState("all"); // "all" | "ontime" | "late"
  const [certRecords, setCertRecords] = useState([]);
  const [certRecordsLoading, setCertRecordsLoading] = useState(false);
  const [certStatusFilter, setCertStatusFilter] = useState("all");
  const [certEditRecord, setCertEditRecord] = useState(null); // 편집 중인 행 {id,...}
  const [crawlRunning, setCrawlRunning] = useState(false);
  const [certStudents, setCertStudents] = useState([]);
  const [attendanceCerts, setAttendanceCerts] = useState([]);
  const [attendanceFrom, setAttendanceFrom] = useState(()=>{
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  });
  const [attendanceTo, setAttendanceTo] = useState(()=>{
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  });
  const [filterName, setFilterName] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterDates, setFilterDates] = useState("all"); // all | week | hasData
  const [rosterEditRow, setRosterEditRow] = useState(null);
  const [rosterAddMode, setRosterAddMode] = useState(false);
  const [assignPopup, setAssignPopup] = useState(null); // {studentId, date, certs[]}
  const isMobile = useMobile();

  // 학부모-자녀 연결 로드
  useEffect(()=>{
    const parents = allProfiles.filter(p=>p.role==="parent");
    if(parents.length===0) return;
    supabase.from("parent_students").select("parent_id, student_id").then(({data})=>{
      if(!data) return;
      const map = {};
      data.forEach(({parent_id, student_id})=>{
        if(!map[parent_id]) map[parent_id]=[];
        const sp = allProfiles.find(p=>p.id===student_id);
        if(sp) map[parent_id].push(sp);
      });
      setParentLinks(map);
    });
  },[allProfiles]);

  // 인증 현황 로드
  const loadCertData = async (weekOffset=0) => {
    setCertLoading(true);
    // 해당 주의 월~일 범위 계산 (KST 기준)
    const now = new Date();
    const dow = now.getDay(); // 0=일, 1=월 ...
    const monOffset = dow === 0 ? -6 : 1 - dow; // 이번 주 월요일까지 offset
    const mon = new Date(now); mon.setDate(now.getDate() + monOffset + weekOffset * 7);
    mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
    const {data} = await supabase.rpc("get_cert_status", {
      p_from: mon.toISOString(), p_to: sun.toISOString()
    });
    setCertData(data || []);
    setCertLoading(false);
  };

  useEffect(()=>{
    if(adminTab!=="roster2") return;
    loadCertStudents();
    loadCertRecords("all");
    // 카페 인증 현황: ROSTER2_NAVER_DATES 전체 기간 로드
    const certFrom = new Date(ROSTER2_NAVER_DATES[0]); certFrom.setHours(0,0,0,0);
    const certTo = new Date(ROSTER2_NAVER_DATES[ROSTER2_NAVER_DATES.length-1]); certTo.setHours(23,59,59,999);
    loadAttendanceCerts(certFrom, certTo);
    // 모닝/나잇 출석 로그 로드 → 전체 활동 기간(5/17~)
    {
      const allDates = [...ROSTER2_MORNING_DATES, ...ROSTER2_NIGHT_DATES];
      const minMs = Math.min(...allDates.map(d=>d.getTime()));
      const maxMs = Math.max(...allDates.map(d=>d.getTime()));
      const f = new Date(minMs); const t = new Date(maxMs);
      const fromStr = `${f.getFullYear()}-${String(f.getMonth()+1).padStart(2,'0')}-${String(f.getDate()).padStart(2,'0')}`;
      const toStr   = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
      supabase.rpc("get_attendance_logs", {p_from: fromStr, p_to: toStr}).then(({data})=>{
        const map = {};
        (data||[]).forEach(r => {
          const idx = ROSTER2.findIndex(s => s.name === r.student_name);
          if(idx >= 0){
            // session_type: "M" 또는 "N"(나잇) → roster2 키는 "M" 또는 "나"
            const rosterType = r.session_type === "N" ? "나" : "M";
            map[`${idx}-${rosterType}-${r.session_date}`] = true;
          }
        });
        setAttendance2(map);
      });
    }
  },[adminTab]);

  const saveNickname = async (profileId, nickname) => {
    await supabase.rpc("update_naver_nickname", {p_profile_id: profileId, p_nickname: nickname.trim()||null});
    setCertNickEdit(p=>({...p,[profileId]:undefined}));
    loadCertData(certWeekOffset);
    onRefresh();
  };

  const loadCertRecords = async (status="all") => {
    setCertRecordsLoading(true);
    const {data} = await supabase.rpc("get_cert_records", {
      p_status: status==="all" ? null : status,
      p_limit: 500,
    });
    const records = data||[];
    setCertRecords(records);
    // 최근 크롤링 시간
    if(records.length > 0) {
      const maxAt = records.reduce((m,r)=> (r.crawled_at||"") > m ? (r.crawled_at||"") : m, "");
      if(maxAt) setLastCrawledAt(maxAt);
    }
    setCertRecordsLoading(false);
  };

  const updateCertSessions = async (certId, sessions) => {
    const arr = (sessions||[]).map(Number).filter(n=>n>=1 && n<=ROSTER2_NAVER_DATES.length);
    arr.sort((a,b)=>a-b);
    const dedup = [...new Set(arr)];
    await supabase.rpc("update_cert_sessions", {
      p_cert_id: certId,
      p_sessions: dedup.length ? dedup : null,
    });
    const patch = { session_override: dedup.length ? dedup : null };
    setCertRecords(prev => prev.map(r => r.id===certId ? {...r, ...patch} : r));
    setAttendanceCerts(prev => prev.map(c => c.id===certId ? {...c, ...patch} : c));
  };

  const updateCertScore = async (certId, parts) => {
    setCertScoreSaving(true);
    const toNum = v => v==="" || v==null ? null : Number(v);
    const submit   = toNum(parts.submit);
    const mission  = toNum(parts.mission);
    const fidelity = toNum(parts.fidelity);
    const total = (submit===null && mission===null && fidelity===null)
      ? null
      : (submit||0) + (mission||0) + (fidelity||0);
    await supabase.rpc("update_cert_scores", {
      p_cert_id: certId,
      p_submit: submit,
      p_mission: mission,
      p_fidelity: fidelity,
    });
    setCertScoreSaving(false);
    const patch = {
      submit_score: submit, mission_score: mission, fidelity_score: fidelity,
      completeness_score: total, compliance_score: null,
    };
    setCertRecords(prev => prev.map(r => r.id===certId ? {...r, ...patch} : r));
    setAttendanceCerts(prev => prev.map(c => c.id===certId ? {...c, ...patch} : c));
  };

  const updateCertRecord = async (id, updates) => {
    await supabase.rpc("update_cert_record", {
      p_id: id,
      p_parsed_name: updates.parsed_name||null,
      p_parsed_grade: updates.parsed_grade||null,
      p_parsed_code: updates.parsed_code||null,
      p_title_match_status: updates.title_match_status||null,
      p_is_valid_format: updates.is_valid_format??null,
    });
    if(updates.assigned_student_id) {
      await supabase.rpc("assign_cert_to_student", {p_cert_id: id, p_student_id: updates.assigned_student_id});
    }
    setCertEditRecord(null);
    loadCertRecords(certStatusFilter);
  };

  const triggerCrawl = async () => {
    const token = (process.env.REACT_APP_GITHUB_TOKEN||"").replace(/[\s\\n]+$/g,"").trim();
    if(!token){ alert("REACT_APP_GITHUB_TOKEN 환경변수가 설정되지 않았습니다."); return; }
    setCrawlRunning(true);
    try {
      const r = await fetch(
        "https://api.github.com/repos/MinDaehyeon/20ha-meta-x/actions/workflows/cafe_crawler.yml/dispatches",
        { method:"POST",
          headers:{"Authorization":`Bearer ${token}`,"Accept":"application/vnd.github+json","Content-Type":"application/json"},
          body: JSON.stringify({ref: ["meta-x.ai.kr","20ha-meta-x.vercel.app"].includes(window.location.hostname) ? "main" : "dev"}) }
      );
      if(r.status===204) alert("크롤링 시작됐습니다!\n약 1분 후 새로고침 하면 데이터가 업데이트됩니다.");
      else alert("실행 실패: " + r.status);
    } catch(e){ alert("오류: "+e.message); }
    setCrawlRunning(false);
  };

  const loadCertStudents = async () => {
    const {data} = await supabase.rpc("get_cert_students");
    setCertStudents(data||[]);
  };

  const loadAttendanceCerts = async (from, to) => {
    const {data} = await supabase.rpc("get_attendance_certs", {
      p_from: from.toISOString(), p_to: to.toISOString()
    });
    setAttendanceCerts(data||[]);
  };

  const upsertCertStudent = async (row) => {
    await supabase.rpc("upsert_cert_student", {
      p_id: row.id||null,
      p_name: row.name,
      p_phone: row.phone||null,
      p_grade: row.grade||null,
      p_naver_nicknames: row.naver_nicknames||[],
    });
    setRosterEditRow(null);
    loadCertStudents();
  };

  const deleteCertStudent = async (id) => {
    if(!window.confirm("명단에서 삭제할까요?")) return;
    await supabase.rpc("delete_cert_student", {p_id: id});
    loadCertStudents();
  };

  const assignCert = async (certId, studentId) => {
    // 배정 대상 인증글의 닉네임 파악
    const cert = attendanceCerts.find(c=>c.id===certId);
    const nick = cert?.naver_nickname;

    // 1) 직접 배정
    await supabase.rpc("assign_cert_to_student", {p_cert_id: certId, p_student_id: studentId||null});

    // 2) 같은 닉네임의 미배정(assigned_student_id=null) 인증글 자동 배정
    if(studentId && nick) {
      const sameNick = attendanceCerts.filter(c =>
        c.id !== certId && c.naver_nickname === nick && !c.assigned_student_id
      );
      await Promise.all(sameNick.map(c =>
        supabase.rpc("assign_cert_to_student", {p_cert_id: c.id, p_student_id: studentId})
      ));
      if(sameNick.length > 0) alert(`✅ "${nick}" 닉네임의 미배정 인증글 ${sameNick.length}건도 자동 배정했습니다.`);
    }

    setAssignPopup(null);
    loadAttendanceCerts(attendanceFrom, attendanceTo);
  };

  const testUids = new Set(allProfiles.filter(p=>p.is_test).map(p=>p.id));
  const normLogs = allLogs.filter(l=>!testUids.has(l.uid)).map(l=>({
    ...l, engramIndex:l.engram_index, strategyScore:l.strategy_score,
    efficiencyIndex:l.efficiency_index, metacognitionAccuracy:l.metacognition_accuracy,
    coinFilter:{cc:l.coin_cc,ci:l.coin_ci,ic:l.coin_ic,ii:l.coin_ii},
    subject:l.subject, bookLevel:l.book_level, netTime:l.net_time, questionCount:l.question_count,
    qBasic:l.q_basic||0, qMid:l.q_mid||0, qAdv:l.q_adv||0,
  }));

  const students = allProfiles.filter(p=>p.role==="student"||p.role==="parent");
  const pendingCount = students.filter(s=>s.approval_status==="pending").length;

  const setApproval = async (id, status) => {
    const {error:ae} = await supabase.rpc("admin_update_profile", {
      p_id: id, p_name: null, p_grade: null, p_target_ei: null, p_approval_status: status,
    });
    if(ae) console.error("approval error:", ae.message);
    onRefresh();
  };

  const updateStudent = async () => {
    if(!editStudent) return;
    setSaving(true);
    const {error:ue} = await supabase.rpc("admin_update_profile", {
      p_id: editStudent.id,
      p_name: editStudent.name,
      p_grade: editStudent.grade || "",
      p_target_ei: editStudent.target_ei,
      p_approval_status: editStudent.approval_status,
    });
    // birth_year는 직접 업데이트 (RPC 파라미터 외)
    if(!ue) {
      await supabase.from("profiles").update({birth_year: editStudent.birth_year||null, birth_month: editStudent.birth_month||null, birth_day: editStudent.birth_day||null}).eq("id", editStudent.id);
    }
    if(ue) console.error("update error:", ue.message);
    setSaving(false); setEditStudent(null); onRefresh();
  };

  const roleFiltered = filterRole==="all" ? students : students.filter(s=>s.role===filterRole);
  const statusFiltered = filterStatus==="all" ? roleFiltered : roleFiltered.filter(s=>s.approval_status===filterStatus);
  const searchFiltered = !memberSearch.trim() ? statusFiltered
    : statusFiltered.filter(s=>(s.name||"").includes(memberSearch)||(s.email||"").includes(memberSearch));
  const totalPages = Math.max(1, Math.ceil(searchFiltered.length / memberPageSize));
  const safePage = Math.min(memberPage, totalPages);
  const filteredStudents = searchFiltered.slice((safePage-1)*memberPageSize, safePage*memberPageSize);

  // Dashboard data
  const filtered=sel==="전체"?normLogs:normLogs.filter(l=>l.uid===sel);
  const ninetyDaysAgo=new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate()-90);
  const ninetyStr=ninetyDaysAgo.toISOString().slice(0,10);
  const sorted=[...filtered].filter(l=>l.date>=ninetyStr).sort((a,b)=>a.date.localeCompare(b.date));
  const _dateEI2={};sorted.forEach(l=>{if(!_dateEI2[l.date])_dateEI2[l.date]=[];_dateEI2[l.date].push(l.engramIndex);});
  const dailyAvg2=Object.entries(_dateEI2).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,eis])=>({date,engramIndex:+(eis.reduce((s,v)=>s+v,0)/eis.length).toFixed(1)}));
  const maData=dailyAvg2.map((d,i)=>{const w=dailyAvg2.slice(Math.max(0,i-6),i+1);return{...d,movingAvg:+(w.reduce((s,v)=>s+v.engramIndex,0)/w.length).toFixed(1)};});
  const avgEI=filtered.length>0?(filtered.reduce((s,l)=>s+l.engramIndex,0)/filtered.length).toFixed(1):0;
  const coinT=filtered.reduce((acc,l)=>{const cf=l.coinFilter||{};Object.entries(cf).forEach(([k,v])=>{acc[k]=(acc[k]||0)+v;});return acc;},{cc:0,ci:0,ic:0,ii:0});
  const coinTot=Object.values(coinT).reduce((s,v)=>s+v,0);
  const ciRate=coinTot>0?coinT.ci/coinTot:0;
  const advLogs=filtered.filter(l=>(l.qAdv||0)>0);
  const avgSec3=advLogs.length>0?advLogs.reduce((s,l)=>s+(l.qAdv>0?l.netTime*60/l.qAdv:0),0)/advLogs.length:0;
  const feedbacks=[];
  if(ciRate>0.3) feedbacks.push({type:"warn",msg:"과잉확신(C-I) 비중이 높습니다. 백지목차 테스트 강도를 높이세요.",icon:"warn"});
  if(advLogs.length>0&&avgSec3>180) feedbacks.push({type:"alert",msg:`심화 문항 풀이 평균 ${avgSec3.toFixed(0)}초/문항 — 유형별 심화 학습 세션을 추가하세요.`,icon:"warn"});
  if(feedbacks.length===0) feedbacks.push({type:"ok",msg:"현재 데이터에서 주요 위험 신호가 감지되지 않았습니다.",icon:"check"});
  const byStudent=students.filter(s=>s.approval_status==="approved"&&s.role!=="parent"&&!s.is_test).map(s=>{
    const sl=normLogs.filter(l=>l.uid===s.id);
    const now=new Date(), d7=new Date(now-7*86400000), d30=new Date(now-30*86400000);
    const sl7=sl.filter(l=>new Date(l.date)>=d7);
    const sl30=sl.filter(l=>new Date(l.date)>=d30);
    const avgAll=sl.length>0?(sl.reduce((a,l)=>a+l.engramIndex,0)/sl.length):null;
    const avg7=sl7.length>0?(sl7.reduce((a,l)=>a+l.engramIndex,0)/sl7.length):null;
    const avg30=sl30.length>0?(sl30.reduce((a,l)=>a+l.engramIndex,0)/sl30.length):null;
    const latest=sl.length>0?[...sl].sort((a,b)=>b.date.localeCompare(a.date))[0]:null;
    const ct=sl.reduce((acc,l)=>{const cf=l.coinFilter||{};Object.entries(cf).forEach(([k,v])=>{acc[k]=(acc[k]||0)+v;});return acc;},{cc:0,ci:0,ic:0,ii:0});
    const tot=Object.values(ct).reduce((s,v)=>s+v,0);
    const ciRatePct=tot>0?(ct.ci/tot*100):null;
    return{...s,avgAll,avg7,avg30,logCount:sl.length,latestEI:latest?.engramIndex,redFlag:tot>0&&ct.ci/tot>0.3,ciRatePct};
  });
  const validEIs=byStudent.filter(s=>s.avgAll!==null);
  const classAvgEI=validEIs.length>0?(validEIs.reduce((a,s)=>a+s.avgAll,0)/validEIs.length).toFixed(1):"—";
  const GRADE_C={S:"#16A34A",A:"#2563EB",B:"#111827",C:"#F97316",D:"#DC2626"};
  const ciGrp=pct=>pct<10?"S":pct<20?"A":pct<30?"B":pct<40?"C":"D";
  const filteredByDash=byStudent.filter(s=>Object.entries(dashColFilter).every(([col,grp])=>{
    if(!grp) return true;
    if(col==="week7") return s.avg7!==null&&gradeInfo(s.avg7).g===grp;
    if(col==="month30") return s.avg30!==null&&gradeInfo(s.avg30).g===grp;
    if(col==="allTime") return s.avgAll!==null&&gradeInfo(s.avgAll).g===grp;
    if(col==="ci") return s.ciRatePct!==null&&ciGrp(s.ciRatePct)===grp;
    return true;
  }));
  const bySubject=SUBJECTS.reduce((acc,s)=>{const sl=filtered.filter(l=>l.subject===s);if(sl.length>0)acc[s]=(sl.reduce((a,l)=>a+l.engramIndex,0)/sl.length).toFixed(1);return acc;},{});

  const statusBadge = (status) => {
    const map = {pending:{label:"승인 대기",color:T.warn,bg:"#FEF3C7"}, approved:{label:"승인됨",color:T.success,bg:"#F0FDF4"}, rejected:{label:"거절됨",color:T.danger,bg:"#FEE2E2"}};
    const s = map[status] || map.pending;
    return <span style={{fontSize:11,fontWeight:700,color:s.color,background:s.bg,padding:"3px 10px",borderRadius:20,border:`1px solid ${s.color}30`}}>{s.label}</span>;
  };

  return(
    <div>
      {/* ── 회원 관리 탭 ── */}
      {adminTab==="users"&&(
        <div>
          {/* 편집 모달 */}
          {editStudent&&(
            <div style={{position:"fixed",inset:0,background:"rgba(25,29,84,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
              <Card style={{width:"100%",maxWidth:420}}>
                <div style={{fontSize:18,fontWeight:800,color:T.navy,marginBottom:20}}>학생 정보 수정</div>
                <div style={{display:"grid",gap:12}}>
                  {[{label:"이름",key:"name",type:"text"},{label:"목표 EI",key:"target_ei",type:"num",min:50,max:100}].map(({label,key,type,min,max})=>(
                    <div key={key}>
                      <label style={css.label}>{label}</label>
                      <input type={type==="num"?"number":type} min={min} max={max} value={editStudent[key]||""} onChange={e=>setEditStudent(s=>({...s,[key]:type==="num"?Number(e.target.value):e.target.value}))} style={css.input}/>
                    </div>
                  ))}
                  <div>
                    <label style={css.label}>생년월일</label>
                    <BirthInput
                      year={editStudent.birth_year||""} month={editStudent.birth_month||""} day={editStudent.birth_day||""}
                      onYear={v=>setEditStudent(s=>({...s,birth_year:Number(v),grade:calcGrade(Number(v),s.birth_month||null)}))}
                      onMonth={v=>setEditStudent(s=>({...s,birth_month:Number(v),grade:calcGrade(s.birth_year||null,Number(v))}))}
                      onDay={v=>setEditStudent(s=>({...s,birth_day:Number(v)}))}
                      showGrade={editStudent.role==="student"}/>
                  </div>
                  <div>
                    <label style={css.label}>승인 상태</label>
                    <select value={editStudent.approval_status} onChange={e=>setEditStudent(s=>({...s,approval_status:e.target.value}))} style={css.select}>
                      <option value="pending">승인 대기</option>
                      <option value="approved">승인됨</option>
                      <option value="rejected">거절됨</option>
                    </select>
                  </div>

                </div>
                <div style={{display:"flex",gap:10,marginTop:20}}>
                  <button onClick={()=>setEditStudent(null)} style={{...css.btnGhost,flex:1}}>취소</button>
                  <button onClick={updateStudent} disabled={saving} style={{...css.btnPrimary,flex:2,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {saving?<><Spinner size={16} color="#fff"/>저장 중...</>:"저장"}
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* 역할 필터 */}
          <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
            {[
              {k:"all", l:`전체 (${students.length})`},
              {k:"student", l:`학생 (${students.filter(s=>s.role==="student").length})`},
              {k:"parent", l:`학부모 (${students.filter(s=>s.role==="parent").length})`},
            ].map(({k,l})=>(
              <button key={k} onClick={()=>setFilterRole(k)}
                style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${filterRole===k?T.navy:T.border}`,cursor:"pointer",fontSize:12,fontWeight:700,
                  background:filterRole===k?T.navy:T.white,color:filterRole===k?T.white:T.muted}}>{l}</button>
            ))}
          </div>
          {/* 상태 필터 */}
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {[{k:"all",l:"전체"},{k:"pending",l:`대기 (${roleFiltered.filter(s=>s.approval_status==="pending").length})`},{k:"approved",l:"승인됨"},{k:"rejected",l:"거절됨"}].map(({k,l})=>(
              <button key={k} onClick={()=>setFilterStatus(k)}
                style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${filterStatus===k?T.orange:T.border}`,cursor:"pointer",fontSize:12,fontWeight:700,
                  background:filterStatus===k?T.orange:T.white,color:filterStatus===k?T.white:T.muted}}>{l}</button>
            ))}
          </div>

          {/* 검색 + 페이지 크기 */}
          <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
            <input
              type="text" placeholder="이름·이메일 검색"
              value={memberSearch}
              onChange={e=>{setMemberSearch(e.target.value);setMemberPage(1);}}
              style={{...css.input,flex:1,minWidth:160,maxWidth:280,padding:"7px 12px",fontSize:13}}
            />
            <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:"auto"}}>
              <span style={{fontSize:12,color:T.muted,whiteSpace:"nowrap"}}>
                총 {searchFiltered.length}명
              </span>
              <select value={memberPageSize} onChange={e=>{setMemberPageSize(Number(e.target.value));setMemberPage(1);}}
                style={{...css.select,width:"auto",padding:"6px 10px",fontSize:12}}>
                {[10,20,50,100].map(n=><option key={n} value={n}>{n}명씩</option>)}
              </select>
            </div>
          </div>

          {/* 대기 중 알림 */}
          {pendingCount>0&&filterStatus!=="approved"&&filterStatus!=="rejected"&&(
            <div style={{background:T.orangePale,border:`1px solid ${T.orange}50`,borderRadius:12,padding:"12px 16px",marginBottom:14,fontSize:13,color:T.navy,display:"flex",alignItems:"center",gap:10}}>
              <span style={{display:"flex"}}>{HI.bell(20,T.orange)}</span>
              <span><strong style={{color:T.orange}}>{pendingCount}명</strong>이 승인을 기다리고 있습니다.</span>
            </div>
          )}

          <Card>
            {filteredStudents.length===0?(
              <div style={{textAlign:"center",padding:"40px 0",color:T.muted,fontSize:13}}>해당 상태의 회원이 없습니다.</div>
            ):(
              <div style={{overflowX:"auto"}}>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1.5fr 1fr 1fr 1.5fr":"2fr 0.8fr 1.2fr 0.9fr 1fr 1.5fr",minWidth:isMobile?480:640}}>
                  {(isMobile?["이름","기수","상태","관리"]:["이름 / 이메일","기수","상태","가입일","로그","관리"]).map(h=>(
                    <div key={h} style={{padding:"8px 12px",fontSize:11,color:T.muted,fontWeight:700,borderBottom:`2px solid ${T.border}`,letterSpacing:"0.04em"}}>{h}</div>
                  ))}
                  {filteredStudents.map(s=>[
                    <div key={`${s.id}-n`} style={{padding:"12px",borderBottom:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:3}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:13,color:T.navy,fontWeight:700}}>{s.name||"(이름 미설정)"}</span>
                        {s.role==="parent"&&<span style={{fontSize:10,fontWeight:700,background:"#E0F2FE",color:"#0369A1",borderRadius:4,padding:"1px 5px"}}>학부모</span>}
                      </div>
                      {!isMobile&&<span style={{fontSize:11,color:T.muted}}>{s.email||"이메일 없음"}</span>}
                      {s.role==="parent"&&(parentLinks[s.id]?.length>0
                        ? <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:2}}>
                            {parentLinks[s.id].map(c=>(
                              <span key={c.id} style={{fontSize:10,background:T.navy+"12",color:T.navy,borderRadius:4,padding:"1px 6px",fontWeight:600}}>
                                {c.name} ({c.grade})
                              </span>
                            ))}
                          </div>
                        : <span style={{fontSize:10,color:T.muted,marginTop:2}}>연결된 자녀 없음</span>
                      )}
                    </div>,
                    <div key={`${s.id}-g`} style={{padding:"8px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",flexWrap:"wrap",gap:4}}>
                      {getCohorts(s).map(cohort=>{const is2=cohort.includes("2기");return(
                        <span key={cohort} style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:is2?"#EEF2FF":"#F0FDF4",color:is2?"#4F46E5":"#16A34A",border:`1px solid ${is2?"#C7D2FE":"#BBF7D0"}`,whiteSpace:"nowrap"}}>{cohort}</span>
                      );})}
                    </div>,
                    <div key={`${s.id}-st`} style={{padding:"12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center"}}>{statusBadge(s.approval_status)}</div>,
                    ...(!isMobile?[<div key={`${s.id}-ca`} style={{padding:"12px",fontSize:12,borderBottom:`1px solid ${T.border}`,color:T.muted,display:"flex",alignItems:"center"}}>{s.created_at?.slice(0,10)||"—"}</div>]:[]),
                    ...(!isMobile?[<div key={`${s.id}-lc`} style={{padding:"12px",fontSize:13,borderBottom:`1px solid ${T.border}`,color:T.muted,display:"flex",alignItems:"center"}}>{normLogs.filter(l=>l.uid===s.id).length}건</div>]:[]),
                    <div key={`${s.id}-m`} style={{padding:"10px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                      {s.approval_status==="pending"&&<>
                        <button onClick={()=>setApproval(s.id,"approved")} style={{fontSize:11,padding:"5px 10px",borderRadius:6,border:"none",background:T.success+"18",color:T.success,cursor:"pointer",fontWeight:700}}>✓ 승인</button>
                        <button onClick={()=>setApproval(s.id,"rejected")} style={{fontSize:11,padding:"5px 10px",borderRadius:6,border:"none",background:T.danger+"18",color:T.danger,cursor:"pointer",fontWeight:700}}>✕ 거절</button>
                      </>}
                      {s.approval_status==="approved"&&<button onClick={()=>setApproval(s.id,"rejected")} style={{fontSize:11,padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.white,color:T.muted,cursor:"pointer"}}>비활성</button>}
                      {s.approval_status==="rejected"&&<button onClick={()=>setApproval(s.id,"approved")} style={{fontSize:11,padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.white,color:T.success,cursor:"pointer",fontWeight:700}}>재승인</button>}
                      <button onClick={()=>setEditStudent(s)} style={{fontSize:11,padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.white,color:T.navy,cursor:"pointer"}}>수정</button>
                    </div>,
                  ])}
                </div>
              </div>
            )}
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"12px 0",borderTop:`1px solid ${T.border}`,flexWrap:"wrap"}}>
                <button onClick={()=>setMemberPage(1)} disabled={safePage===1}
                  style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.border}`,cursor:safePage===1?"default":"pointer",fontSize:12,color:safePage===1?T.muted:T.navy,background:"transparent"}}>«</button>
                <button onClick={()=>setMemberPage(p=>Math.max(1,p-1))} disabled={safePage===1}
                  style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${T.border}`,cursor:safePage===1?"default":"pointer",fontSize:12,color:safePage===1?T.muted:T.navy,background:"transparent"}}>‹</button>
                {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>Math.abs(p-safePage)<=2||p===1||p===totalPages).reduce((acc,p,i,arr)=>{
                  if(i>0&&p-arr[i-1]>1) acc.push("...");
                  acc.push(p);
                  return acc;
                },[]).map((p,i)=>p==="..."
                  ?<span key={`e${i}`} style={{padding:"4px 6px",fontSize:12,color:T.muted}}>…</span>
                  :<button key={p} onClick={()=>setMemberPage(p)}
                    style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${p===safePage?T.navy:T.border}`,cursor:"pointer",fontSize:12,fontWeight:p===safePage?700:400,background:p===safePage?T.navy:"transparent",color:p===safePage?T.white:T.navy}}>{p}</button>
                )}
                <button onClick={()=>setMemberPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages}
                  style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${T.border}`,cursor:safePage===totalPages?"default":"pointer",fontSize:12,color:safePage===totalPages?T.muted:T.navy,background:"transparent"}}>›</button>
                <button onClick={()=>setMemberPage(totalPages)} disabled={safePage===totalPages}
                  style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.border}`,cursor:safePage===totalPages?"default":"pointer",fontSize:12,color:safePage===totalPages?T.muted:T.navy,background:"transparent"}}>»</button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── 20HA 2기 현황 하위 탭 바 (overview 외 모든 서브뷰 공통) ── */}
      {adminTab==="roster2" && (
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {[
            {k:"overview",   l:"📊 전체 현황"},
            {k:"scoresheet", l:"📋 인증글 점수표"},
            {k:"grading",    l:"📝 인증글 채점"},
            {k:"session",    l:"🔢 회차별 확인"},
            {k:"makeup",     l:"📚 Make-up"},
            {k:"attendance", l:"📋 출석체크"},
          ].map(({k,l})=>(
            <button key={k} onClick={()=>setRoster2Tab(k)}
              style={{...roster2Tab===k?css.btnOrange:css.btnOutline,padding:"7px 16px",fontSize:13,fontWeight:700}}>{l}</button>
          ))}
        </div>
      )}

      {/* ── 출석체크 (CSV 업로드) ── */}
      {adminTab==="roster2" && roster2Tab==="attendance" && (
        <AttendanceUploadView onRefresh={onRefresh}/>
      )}

      {/* ── Make-up 대상자 ── */}
      {adminTab==="roster2" && roster2Tab==="makeup" && (
        <MakeupView/>
      )}

      {/* ── 인증 현황 (점수표 / 채점) — 2기 현황의 하위 탭 ── */}
      {adminTab==="roster2" && (roster2Tab==="scoresheet" || roster2Tab==="grading") && (()=>{
        // ── 헬퍼 ──
        const kstDateStr = ts => {
          const k = new Date(new Date(ts).getTime() + 9*3600*1000);
          return `${k.getUTCFullYear()}-${String(k.getUTCMonth()+1).padStart(2,'0')}-${String(k.getUTCDate()).padStart(2,'0')}`;
        };
        const getSessionInfo = (posted_at) => {
          const postStr = kstDateStr(posted_at);
          for (let i = ROSTER2_NAVER_DATES.length - 1; i >= 0; i--) {
            const certStr = roster2FmtKey(ROSTER2_NAVER_DATES[i]);
            if (postStr >= certStr) return { sessionNum: i+1, isLate: isLateByDeadline(posted_at, ROSTER2_NAVER_DATES[i]) };
          }
          return { sessionNum: null, isLate: false };
        };
        // 회차 배열 결정: session_override가 있으면 그것, 없으면 작성일 자동 매칭
        const getCertSessions = (cert) => {
          if (cert.session_override && cert.session_override.length > 0) return cert.session_override.map(Number);
          const auto = getSessionInfo(cert.posted_at).sessionNum;
          return auto ? [auto] : [];
        };
        // 회차당 지각 여부 (회차일 다음날 12:00 KST 까지는 정시)
        const isLateForSession = (cert, sessionNum) => {
          return isLateByDeadline(cert.posted_at, ROSTER2_NAVER_DATES[sessionNum-1]);
        };
        // 회차 단위 매칭: 해당 회차의 정시·지각 글을 모두 포함, 다중 회차 글 포함
        // 같은 회차에 글이 여러 개면 가장 먼저 올린 글 1건만 채택
        const getStudentCertOnDate = (student, date) => {
          const sessionIdx = ROSTER2_NAVER_DATES.findIndex(d => roster2FmtKey(d) === roster2FmtKey(date));
          if (sessionIdx < 0) return null;
          const targetSessionNum = sessionIdx + 1;
          const candidates = attendanceCerts
            .filter(c => c.assigned_student_id === student.id)
            .filter(c => getCertSessions(c).includes(targetSessionNum))
            .sort((a,b) => new Date(a.posted_at) - new Date(b.posted_at));
          return candidates[0] || null;
        };
        const studentHasCert = (student, date) => !!getStudentCertOnDate(student, date);
        const fmtCrawledAt = ts => {
          if (!ts) return null;
          const k = new Date(new Date(ts).getTime() + 9*3600*1000);
          return `${k.getUTCMonth()+1}/${k.getUTCDate()} ${String(k.getUTCHours()).padStart(2,'0')}:${String(k.getUTCMinutes()).padStart(2,'0')}`;
        };

        const CELL_W = 70;
        const stickyBase = {position:"sticky",left:0,zIndex:2,borderRight:`1px solid ${T.border}`};
        const today = new Date();

        return (
          <div>
            {/* 헤더: 크롤링 버튼 (서브탭은 상위 SubTabBar에서 처리) */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap",justifyContent:"flex-end"}}>
              {lastCrawledAt&&(
                <span style={{fontSize:11,color:T.muted}}>최근: {fmtCrawledAt(lastCrawledAt)}</span>
              )}
              <button onClick={triggerCrawl} disabled={crawlRunning}
                style={{...css.btnOrange,padding:"7px 16px",fontSize:13,background:"#059669",opacity:crawlRunning?0.6:1}}>
                {crawlRunning?"⏳ 실행 중...":"🔄 지금 크롤링"}
              </button>
            </div>

            {/* ── 인증글 점수표 (회차×명단 그리드) ── */}
            {roster2Tab==="scoresheet"&&(
              <div>
                <div style={{fontSize:12,color:T.muted,marginBottom:10}}>
                  총 {certStudents.length}명 · 닉네임은 크롤링 시 제목 파싱으로 자동 등록됩니다
                </div>
                <Card style={{padding:0,overflow:"hidden"}}>
                  {/* 상단 스크롤바 */}
                  <div id="cert-top"
                    onScroll={e=>{const b=document.getElementById('cert-body');if(b)b.scrollLeft=e.target.scrollLeft;}}
                    style={{overflowX:"auto",overflowY:"hidden",height:14,borderBottom:`1px solid ${T.border}`,cursor:"ew-resize"}}>
                    <div style={{width:32+100+140+42+44+ROSTER2_NAVER_DATES.length*CELL_W+20,height:1}}/>
                  </div>
                  <div id="cert-body"
                    onScroll={e=>{const t=document.getElementById('cert-top');if(t)t.scrollLeft=e.target.scrollLeft;}}
                    style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                    <table style={{borderCollapse:"collapse",tableLayout:"fixed"}}>
                      <thead>
                        <tr>
                          <th rowSpan={2} style={{...stickyBase,width:32,minWidth:32,fontSize:10,color:T.muted,fontWeight:700,textAlign:"center",padding:"4px 2px",background:T.surfaceAlt,borderBottom:`2px solid ${T.borderStrong}`,verticalAlign:"middle"}}>#</th>
                          <th rowSpan={2} style={{...stickyBase,left:32,width:100,minWidth:100,fontSize:11,color:T.muted,fontWeight:700,padding:"4px 6px",background:T.surfaceAlt,borderBottom:`2px solid ${T.borderStrong}`,borderLeft:`1px solid ${T.border}`,verticalAlign:"middle"}}>이름 / 연락처</th>
                          <th rowSpan={2} style={{width:140,minWidth:140,fontSize:11,color:T.muted,fontWeight:700,padding:"4px 8px",background:T.surfaceAlt,borderBottom:`2px solid ${T.borderStrong}`,borderLeft:`1px solid ${T.border}`,verticalAlign:"middle"}}>네이버 닉네임</th>
                          <th rowSpan={2} style={{width:42,minWidth:42,fontSize:9,fontWeight:700,color:"#4F46E5",background:"#EEF2FF",textAlign:"center",padding:"2px 0",borderBottom:`2px solid ${T.borderStrong}`,borderLeft:`2px solid #4F46E5`,verticalAlign:"middle"}}>인증<br/>합계</th>
                          <th rowSpan={2} style={{width:44,minWidth:44,fontSize:9,fontWeight:700,color:"#16A34A",background:"#F0FDF4",textAlign:"center",padding:"2px 0",borderBottom:`2px solid ${T.borderStrong}`,borderLeft:`1px solid ${T.border}`,verticalAlign:"middle"}}>점수<br/>평균</th>
                          <th colSpan={ROSTER2_NAVER_DATES.length} style={{background:"#EEF2FF",color:"#4F46E5",fontSize:11,fontWeight:800,textAlign:"center",padding:"4px 0",borderBottom:`1px solid ${T.border}`,borderLeft:`2px solid #4F46E5`}}>
                            카페 인증 ({ROSTER2_NAVER_DATES.length}일) — 제출/미션/충실도 · 종합
                          </th>
                        </tr>
                        <tr>
                          {ROSTER2_NAVER_DATES.map((dt,di)=>(
                            <th key={di} style={{width:CELL_W,minWidth:CELL_W,fontSize:8,fontWeight:600,color:"#4F46E5",textAlign:"center",padding:"2px 0",verticalAlign:"middle",borderBottom:`2px solid ${T.borderStrong}`,borderLeft:di===0?`2px solid #4F46E5`:`1px solid ${T.border}`,background:"#EEF2FF",whiteSpace:"nowrap",lineHeight:"1.2"}}>
                              <div>{roster2Fmt(dt)}</div>
                              <div>{ROSTER2_DAY_KO[dt.getDay()]}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {certStudents.length===0?(
                          <tr><td colSpan={4+ROSTER2_NAVER_DATES.length} style={{textAlign:"center",padding:40,color:T.muted,fontSize:13}}>데이터 로딩 중...</td></tr>
                        ):certStudents.map((s,ri)=>{
                          const nicks = s.naver_nicknames || [];
                          const studentCerts = ROSTER2_NAVER_DATES
                            .map(dt => getStudentCertOnDate(s,dt))
                            .filter(Boolean);
                          const certCount = studentCerts.length;
                          const scoreVals = studentCerts
                            .map(c => c.completeness_score)
                            .filter(v => v !== null && v !== undefined);
                          const avgScore = scoreVals.length
                            ? Math.round(scoreVals.reduce((a,b)=>a+Number(b),0)/scoreVals.length)
                            : null;
                          const isEd = rosterEditRow?.id===s.id;
                          const rowBg = ri%2===0?T.surface:T.surfaceAlt;
                          return (
                            <tr key={s.id} style={{background:rowBg}}>
                              {/* # */}
                              <td style={{...stickyBase,width:32,minWidth:32,textAlign:"center",fontSize:10,color:T.muted,fontWeight:700,padding:0,height:36,background:rowBg,borderBottom:`1px solid ${T.border}`}}>{ri+1}</td>
                              {/* 이름+연락처 */}
                              <td style={{...stickyBase,left:32,width:100,minWidth:100,padding:"4px 6px",background:rowBg,borderBottom:`1px solid ${T.border}`,borderLeft:`1px solid ${T.border}`,verticalAlign:"middle"}}>
                                <div style={{fontSize:12,fontWeight:800,color:T.navy,textAlign:"center",lineHeight:1.3}}>{s.name}</div>
                                <div style={{fontSize:9,color:T.muted,textAlign:"center",fontFamily:"monospace",marginTop:1}}>{s.phone||"-"}</div>
                              </td>
                              {/* 닉네임 (읽기 전용 — 크롤링 시 자동 등록) */}
                              <td style={{width:140,minWidth:140,padding:"4px 8px",borderBottom:`1px solid ${T.border}`,borderLeft:`1px solid ${T.border}`,background:rowBg,verticalAlign:"middle"}}>
                                <div style={{display:"flex",alignItems:"center",gap:3,flexWrap:"wrap",minHeight:28}}>
                                  {nicks.length===0
                                    ? <span style={{fontSize:10,color:T.muted,fontStyle:"italic"}}>자동 등록 예정</span>
                                    : nicks.map((nick,ni)=>(
                                        <span key={ni} style={{fontSize:10,padding:"2px 5px",borderRadius:8,background:"#EEF2FF",color:"#4F46E5",border:"1px solid #C7D2FE"}}>{nick}</span>
                                      ))
                                  }
                                </div>
                              </td>
                              {/* 인증 합계 (한 줄) */}
                              <td style={{width:42,minWidth:42,textAlign:"center",verticalAlign:"middle",background:"#EEF2FF",borderBottom:`1px solid ${T.border}`,borderLeft:`2px solid #4F46E5`,height:38}}>
                                <span style={{fontSize:11,fontWeight:800,color:"#4F46E5"}}>{certCount}</span>
                                <span style={{fontSize:9,fontWeight:600,color:"#6D28D9"}}>/{ROSTER2_NAVER_DATES.length}</span>
                              </td>
                              {/* 점수 평균 */}
                              <td style={{width:44,minWidth:44,textAlign:"center",verticalAlign:"middle",background:avgScore!==null&&avgScore<80?"#FEE2E2":"#F0FDF4",borderBottom:`1px solid ${T.border}`,borderLeft:`1px solid ${T.border}`,height:38}}>
                                <div style={{fontSize:13,fontWeight:800,color:avgScore===null?T.muted:avgScore<80?"#DC2626":"#16A34A"}}>
                                  {avgScore!==null ? avgScore : "—"}
                                </div>
                              </td>
                              {/* 날짜별 셀 — 제출/미션/충실도/종합 */}
                              {ROSTER2_NAVER_DATES.map((dt,di)=>{
                                const cert = getStudentCertOnDate(s,dt);
                                const has = !!cert;
                                const ev = has && cert.completeness_score !== null && cert.completeness_score !== undefined ? cert.completeness_score : null;
                                const isLow = ev !== null && Number(ev) < 80;
                                const fmtPart = (v) => (v===null || v===undefined ? "—" : v);
                                return (
                                  <td key={di} style={{
                                    width:CELL_W,minWidth:CELL_W,height:60,
                                    textAlign:"center",verticalAlign:"middle",
                                    borderBottom:`1px solid ${T.border}`,
                                    borderLeft:di===0?`2px solid #4F46E5`:`1px solid ${T.border}`,
                                    background:has ? (isLow ? "#FEE2E2" : "#D1FAE5") : rowBg,
                                  }}>
                                    {has ? (
                                      ev !== null ? (
                                        <div style={{lineHeight:1.25}}>
                                          <div style={{fontSize:11,fontWeight:600,color:isLow?"#7F1D1D":"#475569"}}>
                                            {fmtPart(cert.submit_score)}/{fmtPart(cert.mission_score)}/{fmtPart(cert.fidelity_score)}
                                          </div>
                                          <div style={{fontSize:17,fontWeight:900,color:isLow?"#991B1B":"#065F46",marginTop:2}}>{ev}</div>
                                        </div>
                                      ) : <span style={{fontSize:11,color:"#94A3B8",fontStyle:"italic"}}>—</span>
                                    ) : <span style={{fontSize:11,color:"#D1D5DB"}}>·</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ── 크롤링된 인증글 탭 ── */}
            {roster2Tab==="grading"&&(()=>{
              // 필터 적용
              const q = certSearch.trim().toLowerCase();
              const filteredRecords = certRecords.filter(rec => {
                // 검색: 학생명·제목·닉네임
                if (q) {
                  const hay = `${rec.matched_student_name||""} ${rec.post_title||""} ${rec.naver_nickname||""}`.toLowerCase();
                  if (!hay.includes(q)) return false;
                }
                // 회차 필터
                if (certSessionFilter !== "all") {
                  const sessions = getCertSessions(rec);
                  if (!sessions.includes(Number(certSessionFilter))) return false;
                }
                // 점수 상태
                const hasScore = rec.completeness_score !== null && rec.completeness_score !== undefined;
                if (certScoreFilter === "scored" && !hasScore) return false;
                if (certScoreFilter === "unscored" && hasScore) return false;
                if (certScoreFilter === "low" && (!hasScore || Number(rec.completeness_score) >= 80)) return false;
                // 정시/지각 (회차 매칭된 경우에만)
                if (certTimeFilter !== "all") {
                  const sessions = getCertSessions(rec);
                  if (sessions.length === 0) return false;
                  // 회차 중 하나라도 조건 맞으면 통과
                  const anyMatch = sessions.some(sn => {
                    const late = isLateForSession(rec, sn);
                    return certTimeFilter === "late" ? late : !late;
                  });
                  if (!anyMatch) return false;
                }
                return true;
              });
              const totalPages = Math.max(1, Math.ceil(filteredRecords.length / CERT_RECORDS_PAGE_SIZE));
              const safePage = Math.min(certRecordsPage, totalPages);
              const pageStart = (safePage-1)*CERT_RECORDS_PAGE_SIZE;
              const pageRecords = filteredRecords.slice(pageStart, pageStart+CERT_RECORDS_PAGE_SIZE);
              const filterActive = q || certSessionFilter!=="all" || certScoreFilter!=="all" || certTimeFilter!=="all";
              const resetFilters = () => {
                setCertSearch(""); setCertSessionFilter("all"); setCertScoreFilter("all"); setCertTimeFilter("all"); setCertRecordsPage(1);
              };
              const onChangeFilter = (setter) => (v) => { setter(v); setCertRecordsPage(1); };

              const inputStyle = {padding:"6px 10px",borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,background:T.white,color:T.navy};

              return (
              <div>
                {/* 검색 + 필터 바 */}
                <Card style={{padding:"10px 12px",marginBottom:12}}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
                    <input type="text" placeholder="🔍 학생명 · 제목 · 닉네임 검색"
                      value={certSearch}
                      onChange={e=>{ setCertSearch(e.target.value); setCertRecordsPage(1); }}
                      style={{...inputStyle,flex:"1 1 220px",minWidth:180}}/>
                    <select value={certSessionFilter} onChange={e=>onChangeFilter(setCertSessionFilter)(e.target.value)}
                      style={{...inputStyle,cursor:"pointer"}}>
                      <option value="all">회차 전체</option>
                      {ROSTER2_NAVER_DATES.map((dt,idx)=>(
                        <option key={idx} value={idx+1}>{idx+1}회 ({dt.getMonth()+1}/{dt.getDate()})</option>
                      ))}
                    </select>
                    <select value={certScoreFilter} onChange={e=>onChangeFilter(setCertScoreFilter)(e.target.value)}
                      style={{...inputStyle,cursor:"pointer"}}>
                      <option value="all">점수 전체</option>
                      <option value="scored">채점 완료</option>
                      <option value="unscored">미채점</option>
                      <option value="low">80점 미만</option>
                    </select>
                    <select value={certTimeFilter} onChange={e=>onChangeFilter(setCertTimeFilter)(e.target.value)}
                      style={{...inputStyle,cursor:"pointer"}}>
                      <option value="all">정시·지각 전체</option>
                      <option value="ontime">정시</option>
                      <option value="late">지각</option>
                    </select>
                    {filterActive && (
                      <button onClick={resetFilters}
                        style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontWeight:700,background:T.white,color:T.navy,cursor:"pointer"}}>
                        ✕ 필터 초기화
                      </button>
                    )}
                  </div>
                </Card>
                <div style={{fontSize:12,color:T.muted,marginBottom:10}}>
                  {filterActive
                    ? <>필터 결과 <strong style={{color:T.navy}}>{filteredRecords.length}</strong>건 / 전체 {certRecords.length}건 · {safePage}/{totalPages}페이지</>
                    : <>총 {certRecords.length}건 · {safePage}/{totalPages}페이지 · 제목 클릭 → 원문 / 점수 클릭 → 입력</>
                  }
                </div>
                {certRecordsLoading?(
                  <div style={{textAlign:"center",padding:40,color:T.muted,fontSize:13}}>불러오는 중...</div>
                ):(
                  <Card style={{padding:0,overflow:"hidden"}}>
                    {/* 헤더 */}
                    <div style={{display:"grid",gridTemplateColumns:"50px 80px 80px 60px 1fr 90px 65px 50px 50px 50px 56px",
                      background:T.navy,padding:"9px 12px",gap:6,alignItems:"center"}}>
                      {["글번호","학생","회차","정시여부","제목","닉네임","작성일","제출","미션","충실도","종합"].map(h=>(
                        <div key={h} style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.85)",textAlign:h==="제목"?"left":"center"}}>{h}</div>
                      ))}
                    </div>
                    {certRecords.length===0&&(
                      <div style={{padding:24,textAlign:"center",color:T.muted,fontSize:13}}>
                        크롤링된 글이 없습니다. 우측 상단 "지금 크롤링" 버튼을 눌러주세요.
                      </div>
                    )}
                    {pageRecords.map((rec,i)=>{
                      const recSessions = getCertSessions(rec);
                      const isOverride = !!(rec.session_override && rec.session_override.length > 0);
                      const rowBg = i%2===0?T.white:"#F9FAFB";
                      const articleId = rec.post_url ? rec.post_url.split("/").pop() : rec.id;
                      const hasScore = rec.completeness_score !== null && rec.completeness_score !== undefined;
                      const hasSubmit   = rec.submit_score   !== null && rec.submit_score   !== undefined;
                      const hasMission  = rec.mission_score  !== null && rec.mission_score  !== undefined;
                      const hasFidelity = rec.fidelity_score !== null && rec.fidelity_score !== undefined;
                      const openScoreModal = () => setCertScoreModal({
                        id: rec.id, postTitle: rec.post_title,
                        submit:   hasSubmit   ? String(rec.submit_score)   : "",
                        mission:  hasMission  ? String(rec.mission_score)  : "",
                        fidelity: hasFidelity ? String(rec.fidelity_score) : "",
                      });
                      const openSessionModal = () => setCertSessionModal({
                        id: rec.id, postTitle: rec.post_title, posted_at: rec.posted_at,
                        sessions: recSessions.slice(),
                      });
                      const scoreCellStyle = (has) => ({
                        cursor:"pointer", fontSize:13, fontWeight:800, padding:"3px 4px",
                        borderRadius:4, border:"1px dashed transparent",
                        color: has ? T.navy : T.muted, textAlign:"center",
                      });
                      return (
                        <div key={rec.id} style={{display:"grid",gridTemplateColumns:"50px 80px 80px 60px 1fr 90px 65px 50px 50px 50px 56px",
                          padding:"8px 12px",gap:6,borderTop:`1px solid ${T.border}`,
                          background:rowBg,alignItems:"center"}}>
                          {/* 글번호 */}
                          <div style={{fontSize:11,color:T.muted,textAlign:"center",fontFamily:"monospace"}}>{articleId}</div>
                          {/* 학생 (가운데) */}
                          <div style={{fontSize:12,fontWeight:700,color:rec.matched_student_name?T.navy:T.muted,textAlign:"center"}}>
                            {rec.matched_student_name||"—"}
                          </div>
                          {/* 회차 (클릭 → 편집 모달, 다중 회차 칩) */}
                          <div onClick={openSessionModal}
                            style={{textAlign:"center",fontSize:11,cursor:"pointer",padding:"2px 0",
                              borderRadius:4,border:`1px dashed ${isOverride?"#4F46E5":"transparent"}`}}
                            title={isOverride?"수동 지정됨":"작성일 기반 자동"}
                            onMouseOver={e=>{if(!isOverride)e.currentTarget.style.borderColor="#D1D5DB";}}
                            onMouseOut={e=>{if(!isOverride)e.currentTarget.style.borderColor="transparent";}}>
                            {recSessions.length === 0
                              ? <span style={{color:T.muted}}>—</span>
                              : <div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>
                                  {recSessions.map(sn => (
                                    <span key={sn} style={{
                                      fontSize:10,fontWeight:700,
                                      padding:"1px 5px",borderRadius:8,
                                      background:isOverride?"#EEF2FF":"#F3F4F6",
                                      color:isOverride?"#4F46E5":T.navy,
                                      border:`1px solid ${isOverride?"#C7D2FE":T.border}`,
                                    }}>{sn}회</span>
                                  ))}
                                </div>}
                          </div>
                          {/* 정시여부 (회차별, 다중이면 모두 표기) */}
                          <div style={{textAlign:"center",fontSize:10,lineHeight:1.3}}>
                            {recSessions.length === 0
                              ? <span style={{color:T.muted}}>—</span>
                              : recSessions.map(sn => {
                                  const late = isLateForSession(rec, sn);
                                  return (
                                    <div key={sn}>
                                      {recSessions.length>1 && <span style={{color:T.muted,marginRight:2}}>{sn}회</span>}
                                      {late
                                        ? <span style={{color:"#B45309",fontWeight:700}}>⚠️ 지각</span>
                                        : <span style={{color:"#065F46",fontWeight:700}}>✅ 정시</span>}
                                    </div>
                                  );
                                })}
                          </div>
                          {/* 제목 (링크, 좌측 정렬) */}
                          <div style={{fontSize:11,overflow:"hidden"}}>
                            <a href={rec.post_url} target="_blank" rel="noreferrer"
                              style={{color:T.navy,textDecoration:"none",fontWeight:600,
                                display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}
                              title={rec.post_title}
                              onMouseOver={e=>e.currentTarget.style.color=T.orange}
                              onMouseOut={e=>e.currentTarget.style.color=T.navy}>
                              {rec.post_title}
                            </a>
                          </div>
                          {/* 닉네임 (가운데) */}
                          <div style={{fontSize:11,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"center"}}>{rec.naver_nickname}</div>
                          {/* 작성일 (가운데) */}
                          <div style={{fontSize:11,color:T.muted,textAlign:"center"}}>
                            {(()=>{const k=new Date(new Date(rec.posted_at).getTime()+9*3600*1000);return`${k.getUTCMonth()+1}/${k.getUTCDate()}`;})()}
                          </div>
                          {/* 점수 4열 (제출/미션/충실도/종합) — 어디든 클릭 → 모달 */}
                          <div onClick={openScoreModal} style={scoreCellStyle(hasSubmit)}
                            onMouseOver={e=>e.currentTarget.style.borderColor="#D1D5DB"}
                            onMouseOut={e=>e.currentTarget.style.borderColor="transparent"}>
                            {hasSubmit ? rec.submit_score : "—"}
                          </div>
                          <div onClick={openScoreModal} style={scoreCellStyle(hasMission)}
                            onMouseOver={e=>e.currentTarget.style.borderColor="#D1D5DB"}
                            onMouseOut={e=>e.currentTarget.style.borderColor="transparent"}>
                            {hasMission ? rec.mission_score : "—"}
                          </div>
                          <div onClick={openScoreModal} style={scoreCellStyle(hasFidelity)}
                            onMouseOver={e=>e.currentTarget.style.borderColor="#D1D5DB"}
                            onMouseOut={e=>e.currentTarget.style.borderColor="transparent"}>
                            {hasFidelity ? rec.fidelity_score : "—"}
                          </div>
                          <div onClick={openScoreModal} style={{...scoreCellStyle(hasScore), color: hasScore ? "#16A34A" : T.muted}}
                            onMouseOver={e=>e.currentTarget.style.borderColor="#D1D5DB"}
                            onMouseOut={e=>e.currentTarget.style.borderColor="transparent"}>
                            {hasScore ? rec.completeness_score : "—"}
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                )}
                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:6,marginTop:14,flexWrap:"wrap"}}>
                    <button onClick={()=>setCertRecordsPage(1)} disabled={safePage===1}
                      style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.border}`,cursor:safePage===1?"default":"pointer",fontSize:12,color:safePage===1?T.muted:T.navy,background:"transparent"}}>«</button>
                    <button onClick={()=>setCertRecordsPage(p=>Math.max(1,p-1))} disabled={safePage===1}
                      style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.border}`,cursor:safePage===1?"default":"pointer",fontSize:12,color:safePage===1?T.muted:T.navy,background:"transparent"}}>‹</button>
                    {Array.from({length: totalPages}, (_,i)=>i+1).reduce((acc,p)=>{
                      if(p===1||p===totalPages||(p>=safePage-2&&p<=safePage+2)){
                        if(acc.length&&acc[acc.length-1]!=="..."&&p-acc[acc.length-1]>1) acc.push("...");
                        acc.push(p);
                      }
                      return acc;
                    },[]).map((p,i)=>p==="..."
                      ? <span key={`e${i}`} style={{padding:"4px 6px",fontSize:12,color:T.muted}}>…</span>
                      : <button key={p} onClick={()=>setCertRecordsPage(p)}
                          style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${p===safePage?T.navy:T.border}`,cursor:"pointer",fontSize:12,fontWeight:p===safePage?700:400,background:p===safePage?T.navy:"transparent",color:p===safePage?T.white:T.navy}}>{p}</button>
                    )}
                    <button onClick={()=>setCertRecordsPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages}
                      style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.border}`,cursor:safePage===totalPages?"default":"pointer",fontSize:12,color:safePage===totalPages?T.muted:T.navy,background:"transparent"}}>›</button>
                    <button onClick={()=>setCertRecordsPage(totalPages)} disabled={safePage===totalPages}
                      style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.border}`,cursor:safePage===totalPages?"default":"pointer",fontSize:12,color:safePage===totalPages?T.muted:T.navy,background:"transparent"}}>»</button>
                  </div>
                )}
              </div>
              );
            })()}

            {/* ── 회차 편집 모달 (다중 선택) ── */}
            {certSessionModal && (() => {
              const cur = certSessionModal.sessions || [];
              const autoNum = getSessionInfo(certSessionModal.posted_at).sessionNum;
              const postedKstDate = (()=>{const k=new Date(new Date(certSessionModal.posted_at).getTime()+9*3600*1000);return`${k.getUTCMonth()+1}/${k.getUTCDate()}`;})();
              const toggle = (n) => {
                setCertSessionModal(p => {
                  const set = new Set(p.sessions);
                  if (set.has(n)) set.delete(n); else set.add(n);
                  return {...p, sessions: [...set].sort((a,b)=>a-b)};
                });
              };
              const save = async () => {
                await updateCertSessions(certSessionModal.id, certSessionModal.sessions);
                setCertSessionModal(null);
              };
              const resetAuto = () => {
                setCertSessionModal(p => ({...p, sessions: autoNum ? [autoNum] : []}));
              };
              return (
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}
                onClick={()=>setCertSessionModal(null)}>
                <div style={{background:T.white,borderRadius:16,padding:22,maxWidth:520,width:"92%",boxShadow:"0 8px 32px rgba(0,0,0,0.18)"}}
                  onClick={e=>e.stopPropagation()}>
                  <div style={{fontWeight:800,fontSize:15,color:T.navy,marginBottom:4}}>회차 지정</div>
                  <div style={{fontSize:12,color:T.muted,marginBottom:6,wordBreak:"break-word",lineHeight:1.4}}>
                    {certSessionModal.postTitle}
                  </div>
                  <div style={{fontSize:11,color:T.muted,marginBottom:14}}>
                    작성일 {postedKstDate} · 자동 추천: {autoNum?`${autoNum}회`:"없음"}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:6,marginBottom:14}}>
                    {ROSTER2_NAVER_DATES.map((dt,idx)=>{
                      const sn = idx+1;
                      const checked = cur.includes(sn);
                      const isAuto = sn===autoNum;
                      return (
                        <button key={sn} onClick={()=>toggle(sn)}
                          style={{
                            padding:"7px 6px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",
                            textAlign:"center",lineHeight:1.3,
                            border:`1px solid ${checked?T.navy:isAuto?"#C7D2FE":T.border}`,
                            background:checked?T.navy:isAuto?"#EEF2FF":T.white,
                            color:checked?T.white:isAuto?"#4F46E5":T.navy,
                          }}>
                          <div>{sn}회{isAuto?" ⭐":""}</div>
                          <div style={{fontSize:9,fontWeight:500,opacity:0.85}}>{dt.getMonth()+1}/{dt.getDate()}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{fontSize:10,color:T.muted,marginBottom:14}}>
                    ⭐ = 작성일 기준 자동 추천 회차 · 모두 해제 시 자동 매칭으로 복귀
                  </div>
                  <div style={{display:"flex",gap:8,justifyContent:"space-between",alignItems:"center"}}>
                    <button onClick={resetAuto}
                      style={{...css.btnOutline,padding:"6px 12px",fontSize:12}}>자동 복귀</button>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>setCertSessionModal(null)}
                        style={{...css.btnOutline,padding:"7px 18px",fontSize:13}}>취소</button>
                      <button onClick={save}
                        style={{...css.btnOrange,padding:"7px 18px",fontSize:13}}>확인</button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* ── 점수 입력 팝업 모달 (제출 50 + 필수미션 30 + 충실도 20 = 100) ── */}
            {certScoreModal && (() => {
              const clamp = (v,max) => {
                if(v==="" || v==null) return "";
                const n = Math.max(0, Math.min(max, Number(v)));
                return Number.isFinite(n) ? String(n) : "";
              };
              const toNum = v => v==="" || v==null ? 0 : Number(v);
              const total = toNum(certScoreModal.submit) + toNum(certScoreModal.mission) + toNum(certScoreModal.fidelity);
              const submit = async () => {
                await updateCertScore(certScoreModal.id, {
                  submit: certScoreModal.submit, mission: certScoreModal.mission, fidelity: certScoreModal.fidelity,
                });
                setCertScoreModal(null);
              };
              const rowStyle = {display:"grid",gridTemplateColumns:"1fr 110px",alignItems:"center",gap:10,marginBottom:10};
              const inputStyle = {...css.input,width:"100%",padding:"8px 12px",fontSize:14,boxSizing:"border-box"};
              const labelStyle = {fontSize:12,fontWeight:700,color:T.navy};
              const hintStyle  = {fontSize:10,color:T.muted,fontWeight:400,marginLeft:4};
              return (
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}
                onClick={()=>setCertScoreModal(null)}>
                <div style={{background:T.white,borderRadius:16,padding:24,maxWidth:460,width:"90%",boxShadow:"0 8px 32px rgba(0,0,0,0.18)"}}
                  onClick={e=>e.stopPropagation()}
                  onKeyDown={e=>{
                    if(e.key==="Enter"){ e.preventDefault(); submit(); }
                    if(e.key==="Escape") setCertScoreModal(null);
                  }}>
                  <div style={{fontWeight:800,fontSize:15,color:T.navy,marginBottom:6}}>점수 입력</div>
                  <div style={{fontSize:12,color:T.muted,marginBottom:18,wordBreak:"break-word",lineHeight:1.4}}>
                    {certScoreModal.postTitle}
                  </div>
                  <div style={rowStyle}>
                    <div style={labelStyle}>① 제출<span style={hintStyle}>인증 주기 내 제출 (0~50)</span></div>
                    <input type="number" min="0" max="50" autoFocus
                      value={certScoreModal.submit}
                      onChange={e=>setCertScoreModal(p=>({...p,submit:clamp(e.target.value,50)}))}
                      style={inputStyle} placeholder="0~50" />
                  </div>
                  <div style={rowStyle}>
                    <div style={labelStyle}>② 필수 미션<span style={hintStyle}>모두 30 / 일부 15 (0~30)</span></div>
                    <input type="number" min="0" max="30"
                      value={certScoreModal.mission}
                      onChange={e=>setCertScoreModal(p=>({...p,mission:clamp(e.target.value,30)}))}
                      style={inputStyle} placeholder="0~30" />
                  </div>
                  <div style={rowStyle}>
                    <div style={labelStyle}>③ 내용 충실도<span style={hintStyle}>매우우수 20 / 우수 15 / 보통 10 / 미흡 5 (0~20)</span></div>
                    <input type="number" min="0" max="20"
                      value={certScoreModal.fidelity}
                      onChange={e=>setCertScoreModal(p=>({...p,fidelity:clamp(e.target.value,20)}))}
                      style={inputStyle} placeholder="0~20" />
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,marginBottom:14,padding:"10px 14px",background:"#F0FDF4",borderRadius:8,border:"1px solid #BBF7D0"}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.navy}}>종합</div>
                    <div style={{fontSize:18,fontWeight:800,color:"#16A34A"}}>{total}<span style={{fontSize:12,fontWeight:600,marginLeft:2}}>/ 100점</span></div>
                  </div>
                  <div style={{fontSize:10,color:T.muted,marginBottom:14}}>※ 세 칸 모두 비우고 확인 시 점수 삭제</div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setCertScoreModal(null)}
                      style={{...css.btnOutline,padding:"7px 18px",fontSize:13}}>취소</button>
                    <button onClick={submit} disabled={certScoreSaving}
                      style={{...css.btnOrange,padding:"7px 18px",fontSize:13,opacity:certScoreSaving?0.6:1}}>
                      {certScoreSaving?"저장 중...":"확인"}
                    </button>
                  </div>
                </div>
              </div>
              );
            })()}
          </div>
        );
      })()}

      {/* ── 회차별 확인 ── */}
      {adminTab==="roster2" && roster2Tab==="session" && (()=>{
        const kstDateStr = ts => {
          const k = new Date(new Date(ts).getTime() + 9*3600*1000);
          return `${k.getUTCFullYear()}-${String(k.getUTCMonth()+1).padStart(2,'0')}-${String(k.getUTCDate()).padStart(2,'0')}`;
        };
        const getSessionInfo = (posted_at) => {
          const postStr = kstDateStr(posted_at);
          for (let i = ROSTER2_NAVER_DATES.length - 1; i >= 0; i--) {
            const certStr = roster2FmtKey(ROSTER2_NAVER_DATES[i]);
            if (postStr >= certStr) return { sessionNum: i+1, isLate: isLateByDeadline(posted_at, ROSTER2_NAVER_DATES[i]) };
          }
          return { sessionNum: null, isLate: false };
        };
        const getCertSessions = (cert) => {
          if (cert.session_override && cert.session_override.length > 0) return cert.session_override.map(Number);
          const auto = getSessionInfo(cert.posted_at).sessionNum;
          return auto ? [auto] : [];
        };

        // 테스트학생 제외한 실제 학생
        const realStudents = certStudents.filter(s => s.name !== "테스트학생");
        const totalStudents = realStudents.length;

        const targetSession = sessionViewIdx + 1;
        const sessionDate = ROSTER2_NAVER_DATES[sessionViewIdx];

        // 해당 회차에 글 올린 학생별 best 점수글 (가장 먼저 올린 글 1건, 다중 회차 글 포함)
        const studentCertMap = new Map();
        attendanceCerts.forEach(c => {
          if (!c.assigned_student_id) return;
          if (!getCertSessions(c).includes(targetSession)) return;
          const prev = studentCertMap.get(c.assigned_student_id);
          if (!prev || new Date(c.posted_at) < new Date(prev.posted_at)) {
            studentCertMap.set(c.assigned_student_id, c);
          }
        });

        const submitted = realStudents.filter(s => studentCertMap.has(s.id));
        const notSubmitted = realStudents.filter(s => !studentCertMap.has(s.id));
        const submitRate = totalStudents > 0 ? Math.round(submitted.length/totalStudents*100) : 0;

        const scored = submitted
          .map(s => ({ name:s.name, cert: studentCertMap.get(s.id) }))
          .filter(x => x.cert.completeness_score !== null && x.cert.completeness_score !== undefined);
        const avgScore = scored.length > 0
          ? Math.round(scored.reduce((acc,x)=>acc+Number(x.cert.completeness_score),0)/scored.length)
          : null;
        const lowScored = scored
          .filter(x => Number(x.cert.completeness_score) < 80)
          .sort((a,b) => Number(a.cert.completeness_score) - Number(b.cert.completeness_score));

        const Stat = ({label, value, color}) => (
          <Card style={{padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontSize:11,color:T.muted,fontWeight:600,marginBottom:4}}>{label}</div>
            <div style={{fontSize:22,fontWeight:900,color:color||T.navy,lineHeight:1.1}}>{value}</div>
          </Card>
        );
        const NameChip = ({label, color, bg, border}) => (
          <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:14,
            background:bg,color,border:`1px solid ${border}`,fontSize:12,fontWeight:700,margin:"3px 4px 3px 0"}}>{label}</span>
        );

        return (
          <div>
            {/* 회차 선택 버튼 */}
            <Card style={{padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:11,color:T.muted,fontWeight:700,marginBottom:8}}>회차 선택</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {ROSTER2_NAVER_DATES.map((dt,idx)=>{
                  const active = idx===sessionViewIdx;
                  return (
                    <button key={idx} onClick={()=>setSessionViewIdx(idx)}
                      style={{padding:"6px 10px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",
                        border:`1px solid ${active?T.navy:T.border}`,
                        background:active?T.navy:T.white,
                        color:active?T.white:T.navy}}>
                      {idx+1}회 <span style={{fontSize:10,fontWeight:500,opacity:0.8,marginLeft:2}}>
                        ({dt.getMonth()+1}/{dt.getDate()} {ROSTER2_DAY_KO[dt.getDay()]})
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 통계 카드 5개 */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:10,marginBottom:16}}>
              <Stat label="전체 인원" value={`${totalStudents}명`}/>
              <Stat label="인증 제출" value={`${submitted.length}명`} color="#16A34A"/>
              <Stat label="인증 미제출" value={`${notSubmitted.length}명`} color="#DC2626"/>
              <Stat label="제출률" value={`${submitRate}%`} color={submitRate>=80?"#16A34A":submitRate>=50?"#B45309":"#DC2626"}/>
              <Stat label="제출자 평균" value={avgScore!==null ? `${avgScore}점` : "—"} color="#4F46E5"/>
            </div>

            {/* 미제출자 명단 */}
            <Card style={{padding:"14px 16px",marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:800,color:T.navy,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                ⚠️ 미제출자 명단
                <span style={{fontSize:11,fontWeight:600,color:"#DC2626",background:"#FEE2E2",padding:"2px 8px",borderRadius:10}}>
                  {notSubmitted.length}명
                </span>
              </div>
              {notSubmitted.length===0 ? (
                <div style={{fontSize:12,color:T.muted,padding:"8px 4px"}}>전원 제출했습니다 🎉</div>
              ) : (
                <div>
                  {notSubmitted.map(s => (
                    <NameChip key={s.id} label={s.name} color="#991B1B" bg="#FEE2E2" border="#FECACA"/>
                  ))}
                </div>
              )}
            </Card>

            {/* 80점 이하 명단 */}
            <Card style={{padding:"14px 16px"}}>
              <div style={{fontSize:13,fontWeight:800,color:T.navy,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                📉 80점 미만 제출자
                <span style={{fontSize:11,fontWeight:600,color:"#B45309",background:"#FEF3C7",padding:"2px 8px",borderRadius:10}}>
                  {lowScored.length}명
                </span>
                <span style={{fontSize:10,fontWeight:500,color:T.muted,marginLeft:2}}>점수 낮은 순</span>
              </div>
              {lowScored.length===0 ? (
                <div style={{fontSize:12,color:T.muted,padding:"8px 4px"}}>해당 학생 없음</div>
              ) : (
                <div>
                  {lowScored.map(x => (
                    <NameChip key={x.name}
                      label={`${x.name} · ${x.cert.completeness_score}점`}
                      color="#92400E" bg="#FEF3C7" border="#FDE68A"/>
                  ))}
                </div>
              )}
            </Card>

            <div style={{fontSize:10,color:T.muted,marginTop:10,textAlign:"right"}}>
              ※ 회차 매칭: 정시·지각 글 모두 포함 (같은 회차 다중 글은 가장 먼저 올린 1건 기준) · 테스트학생 제외
              {sessionDate && ` · 기준일 ${sessionDate.getMonth()+1}/${sessionDate.getDate()}(${ROSTER2_DAY_KO[sessionDate.getDay()]})`}
            </div>
          </div>
        );
      })()}


      {adminTab==="dashboard"&&(
        <div>
          {/* ── 학생 상세 페이지 ── */}
          {detailStudent ? (
            <div>
              <button onClick={()=>setDetailStudent(null)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:8,border:`1px solid ${T.border}`,
                  background:T.white,color:T.navy,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:16}}>
                ← 전체 학생 목록으로
              </button>
              <div style={{background:T.navy,borderRadius:14,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:T.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:T.white,flexShrink:0}}>
                  {(detailStudent.name||"?")[0]}
                </div>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:T.white}}>{detailStudent.name}</div>
                  <div style={{fontSize:12,color:T.white+"99"}}>{detailStudent.grade} · 목표 EI {detailStudent.target_ei}점</div>
                </div>
              </div>
              <StudentDashboard
                logs={normLogs.filter(l=>l.uid===detailStudent.id)}
                profile={detailStudent}
                isAdminView={true}
              />
            </div>
          ) : (
            <div>
              {/* ── 전체 요약 KPI ── */}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:16}}>
                {[
                  {label:"전체 평균 EI",value:avgEI,color:EI_COLOR(avgEI)},
                  {label:"총 학습 로그",value:filtered.length,unit:"건",color:T.navyMid},
                  {label:"Red Flag 학생",value:byStudent.filter(s=>s.redFlag).length,unit:"명",color:T.danger},
                  {label:"C-I 과신 비율",value:(ciRate*100).toFixed(1),unit:"%",color:ciRate>0.3?T.danger:T.success},
                ].map(({label,value,unit="",color})=>(
                  <Card key={label} style={{padding:"16px 18px"}}>
                    <div style={{fontSize:10,color:T.muted,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:700}}>{label}</div>
                    <NavyNum value={value} unit={unit} size={isMobile?22:26} color={color}/>
                  </Card>
                ))}
              </div>

              {/* ── 학생별 주요지표 목록 ── */}
              <Card style={{marginBottom:12}} onClick={()=>setDashFilterOpen(null)}>
                <SectionTitle sub="클릭하면 상세 대시보드로 이동합니다">👥 전체 학생 현황</SectionTitle>
                {byStudent.length===0
                  ? <div style={{color:T.muted,fontSize:13,textAlign:"center",padding:"24px 0"}}>학생 데이터 없음</div>
                  : <div style={{overflowX:"auto"}}>
                      {Object.values(dashColFilter).some(v=>v)&&(
                        <div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center",flexWrap:"wrap"}}>
                          <span style={{fontSize:11,color:T.muted}}>필터:</span>
                          {Object.entries(dashColFilter).filter(([,v])=>v).map(([col,grp])=>{
                            const colLabel={week7:"7일EI",month30:"30일EI",allTime:"전체기간EI",ci:"과신비율"}[col];
                            const color=GRADE_C[grp];
                            const grpLabel={S:"녹색",A:"파랑",B:"검정",C:"주황",D:"빨강"}[grp];
                            return(
                              <span key={col} onClick={e=>{e.stopPropagation();setDashColFilter(f=>({...f,[col]:null}));}}
                                style={{fontSize:11,padding:"3px 8px",borderRadius:20,border:`1px solid ${color}40`,color,background:color+"15",cursor:"pointer",fontWeight:700}}>
                                {colLabel}: {grpLabel} ✕
                              </span>
                            );
                          })}
                          <span onClick={e=>{e.stopPropagation();setDashColFilter({});}} style={{fontSize:11,color:T.muted,cursor:"pointer",textDecoration:"underline"}}>전체 초기화</span>
                        </div>
                      )}
                      <div style={{display:"grid",gridTemplateColumns:isMobile?"2fr 0.7fr 1fr 0.9fr":"2fr 0.7fr 1fr 1fr 1fr 1fr 1fr 0.9fr",minWidth:isMobile?360:960,marginBottom:6}}>
                        {(isMobile
                          ?[{key:null,label:"이름/학년"},{key:null,label:"로그"},{key:"week7",label:"7일EI"},{key:null,label:"상태"}]
                          :[{key:null,label:"이름 / 학년"},{key:null,label:"로그(건)"},{key:null,label:"전체 학생 평균 EI"},{key:"week7",label:"최근 일주일 EI"},{key:"month30",label:"최근 한 달 EI"},{key:"allTime",label:"전체 기간 EI"},{key:"ci",label:"과신비율"},{key:null,label:"상태"}]
                        ).map(h=>(
                          <div key={h.label} onClick={e=>{if(h.key){e.stopPropagation();setDashFilterOpen(dashFilterOpen===h.key?null:h.key);}}}
                            style={{position:"relative",padding:"8px 12px",fontSize:11,color:h.key?T.navy:T.muted,fontWeight:700,
                              borderBottom:`2px solid ${T.border}`,cursor:h.key?"pointer":"default",userSelect:"none",
                              background:dashColFilter[h.key]?T.surfaceAlt:"transparent"}}>
                            <div style={{display:"flex",alignItems:"center",gap:3}}>
                              {h.key&&dashColFilter[h.key]&&<span style={{width:7,height:7,borderRadius:"50%",background:GRADE_C[dashColFilter[h.key]],display:"inline-block",flexShrink:0}}/>}
                              {h.label}
                              {h.key&&<span style={{fontSize:9,opacity:0.6,marginLeft:1}}>{dashFilterOpen===h.key?"▲":"▾"}</span>}
                            </div>
                            {h.key&&dashFilterOpen===h.key&&(
                              <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:"100%",left:0,zIndex:200,background:T.white,
                                border:`1px solid ${T.border}`,borderRadius:8,padding:6,boxShadow:"0 4px 12px rgba(0,0,0,0.12)",minWidth:90,marginTop:2}}>
                                <div onClick={()=>{setDashColFilter(f=>({...f,[h.key]:null}));setDashFilterOpen(null);}}
                                  style={{padding:"5px 8px",cursor:"pointer",fontSize:12,color:T.muted,borderRadius:4,background:!dashColFilter[h.key]?T.surfaceAlt:"transparent"}}>
                                  전체
                                </div>
                                {[{g:"S",label:"녹색",color:"#16A34A"},{g:"A",label:"파랑",color:"#2563EB"},{g:"B",label:"검정",color:"#111827"},{g:"C",label:"주황",color:"#F97316"},{g:"D",label:"빨강",color:"#DC2626"}].map(({g,label,color})=>(
                                  <div key={g} onClick={()=>{setDashColFilter(f=>({...f,[h.key]:g}));setDashFilterOpen(null);}}
                                    style={{padding:"5px 8px",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:6,borderRadius:4,background:dashColFilter[h.key]===g?T.surfaceAlt:"transparent"}}>
                                    <span style={{width:9,height:9,borderRadius:"50%",background:color,display:"inline-block",flexShrink:0}}/>{label}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {filteredByDash.map(s=>{
                        const fmtEI=v=>v!=null?v.toFixed(1):"—";
                        const ciDisp=s.ciRatePct!=null?s.ciRatePct.toFixed(0)+"%":"—";
                        const ciColor=s.ciRatePct!=null?(s.ciRatePct>=30?T.danger:s.ciRatePct>=20?T.orange:T.success):T.muted;
                        const COLS=isMobile?"2fr 0.7fr 1fr 0.9fr":"2fr 0.7fr 1fr 1fr 1fr 1fr 1fr 0.9fr";
                        return(
                          <div key={s.id} onClick={()=>setDetailStudent(allProfiles.find(p=>p.id===s.id))}
                            style={{display:"grid",gridTemplateColumns:COLS,minWidth:isMobile?360:960,cursor:"pointer",borderRadius:8,transition:"background 0.15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background=T.surfaceAlt}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <div style={{padding:"12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:30,height:30,borderRadius:"50%",background:T.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:T.white,flexShrink:0}}>
                                {(s.name||"?")[0]}
                              </div>
                              <div>
                                <div style={{fontSize:13,fontWeight:700,color:T.navy,display:"flex",alignItems:"center",gap:5}}>
                                  {s.redFlag&&<span style={{fontSize:11}}>🔴</span>}{s.name}
                                </div>
                                <div style={{fontSize:11,color:T.muted}}>{s.grade||"—"}</div>
                              </div>
                            </div>
                            <div style={{padding:"12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center"}}>
                              <span style={{fontSize:13,color:T.muted}}>{s.logCount}</span>
                            </div>
                            {!isMobile&&<div style={{padding:"12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center"}}>
                              <span style={{fontSize:13,fontWeight:700,color:EI_COLOR(classAvgEI)}}>{classAvgEI}</span>
                            </div>}
                            <div style={{padding:"12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center"}}>
                              <span style={{fontSize:13,fontWeight:700,color:s.avg7!=null?EI_COLOR(s.avg7):T.muted}}>{fmtEI(s.avg7)}</span>
                            </div>
                            {!isMobile&&<div style={{padding:"12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center"}}>
                              <span style={{fontSize:13,fontWeight:700,color:s.avg30!=null?EI_COLOR(s.avg30):T.muted}}>{fmtEI(s.avg30)}</span>
                            </div>}
                            {!isMobile&&<div style={{padding:"12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center"}}>
                              <span style={{fontSize:13,fontWeight:700,color:s.avgAll!=null?EI_COLOR(s.avgAll):T.muted}}>{fmtEI(s.avgAll)}</span>
                            </div>}
                            {!isMobile&&<div style={{padding:"12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center"}}>
                              <span style={{fontSize:13,fontWeight:700,color:ciColor}}>{ciDisp}</span>
                            </div>}
                            <div style={{padding:"12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center"}}>
                              {statusBadge(allProfiles.find(p=>p.id===s.id)?.approval_status)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                }
              </Card>

              {/* ── 자동 피드백 진단 ── */}
              <Card style={{marginBottom:12}}>
                <SectionTitle><span style={{display:"flex",alignItems:"center",gap:5}}>{HI.search(14,T.navy)} 자동 피드백 진단</span></SectionTitle>
                {feedbacks.map((f,i)=>(
                  <div key={i} style={{padding:"12px 16px",borderRadius:10,marginBottom:i<feedbacks.length-1?8:0,fontSize:13,color:T.navy,
                    background:f.type==="warn"?T.orangePale:f.type==="alert"?"#FEE2E2":"#F0FDF4",
                    border:`1px solid ${f.type==="warn"?T.orange+"50":f.type==="alert"?T.danger+"40":T.success+"40"}`}}>
                    <span style={{display:"flex",alignItems:"center",gap:7}}>
                      {HI[f.icon]?.(15, f.type==="ok"?"#16A34A":f.type==="warn"?"#EA580C":"#DC2626")}
                      {f.msg}
                    </span>
                  </div>
                ))}
              </Card>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12,marginBottom:12}}>
                <Card>
                  <SectionTitle sub="과목별 평균 EI">📚 과목별 EI</SectionTitle>
                  {Object.entries(bySubject).map(([subj,ei])=>(
                    <div key={subj} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:13,color:T.textMid,fontWeight:600}}>{subj}</span>
                        <span style={{fontSize:13,fontWeight:800,color:EI_COLOR(ei)}}>{ei}</span>
                      </div>
                      <div style={{height:6,background:T.surfaceAlt,borderRadius:3}}>
                        <div style={{height:"100%",width:`${ei}%`,background:T.grad,borderRadius:3,transition:"width 0.6s"}}/>
                      </div>
                    </div>
                  ))}
                  {Object.keys(bySubject).length===0&&<div style={{color:T.muted,fontSize:13}}>데이터 없음</div>}
                </Card>
                <Card>
                  <SectionTitle sub="자기 객관화 분포">🧩 Co-In 분포</SectionTitle>
                  <ResponsiveContainer width="100%" height={175}>
                    <BarChart data={[{name:"C-C",v:coinT.cc},{name:"C-I",v:coinT.ci},{name:"I-C",v:coinT.ic},{name:"I-I",v:coinT.ii}]} margin={{top:4,right:8,bottom:4,left:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="name" tick={{fill:T.muted,fontSize:12}}/>
                      <YAxis tick={{fill:T.muted,fontSize:10}} width={28}/>
                      <Tooltip content={<ChartTip/>}/>
                      <Bar dataKey="v" name="건수" radius={[4,4,0,0]}>{[GRAPH.ccColor,GRAPH.ciColor,GRAPH.icColor,GRAPH.iiColor].map((c,i)=><Cell key={i} fill={c}/>)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
              {maData.length>0&&(
                <Card>
                  <SectionTitle>📈 EI 추이</SectionTitle>
                  <ResponsiveContainer width="100%" height={180}>
                    <ComposedChart data={maData} margin={{top:4,right:8,bottom:4,left:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                      <XAxis dataKey="date" tick={{fill:T.muted,fontSize:10}} tickFormatter={d=>d.slice(5)}/>
                      <YAxis domain={[0,100]} tick={{fill:T.muted,fontSize:10}} width={28}/>
                      <Tooltip content={<ChartTip/>}/>
                      <Bar dataKey="engramIndex" name="일일 EI" fill={T.navy+"22"} stroke={T.navy+"50"} radius={[3,3,0,0]}/>
                      <Line type="monotone" dataKey="movingAvg" name="7일 평균" stroke={T.orange} strokeWidth={2.5} dot={false}/>
                    </ComposedChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 전체 현황 (회차×명단 종합 그리드) ── */}
      {adminTab==="roster2" && roster2Tab==="overview" && (()=>{
        // ROSTER2, 날짜 배열은 컴포넌트 외부 상수 사용 (렌더마다 재생성 방지)
        const naverDates   = ROSTER2_NAVER_DATES;
        const morningDates = ROSTER2_MORNING_DATES;
        const nightDates   = ROSTER2_NIGHT_DATES;
        const fmt    = roster2Fmt;
        const fmtKey = roster2FmtKey;
        const DAY_KO = ROSTER2_DAY_KO;

        // 카페 인증(N) → cert_students(name)→ attendanceCerts(assigned_student_id) 매칭 헬퍼
        const kstDateStr = ts => {
          const k = new Date(new Date(ts).getTime() + 9*3600*1000);
          return `${k.getUTCFullYear()}-${String(k.getUTCMonth()+1).padStart(2,'0')}-${String(k.getUTCDate()).padStart(2,'0')}`;
        };
        const certStudentByName = {};
        (certStudents||[]).forEach(cs => { certStudentByName[cs.name] = cs.id; });

        // 회차 매칭 (지각 포함). naverDates의 sessionIdx 단위로 cert를 분류.
        const getSessionForPostedAt = (posted_at) => {
          const postStr = kstDateStr(posted_at);
          for (let i = naverDates.length - 1; i >= 0; i--) {
            const certStr = fmtKey(naverDates[i]);
            if (postStr >= certStr) return { sessionIdx: i, isLate: isLateByDeadline(posted_at, naverDates[i]) };
          }
          return { sessionIdx: -1, isLate: false };
        };
        // cert의 회차 배열 (session_override 우선)
        const getCertSessionsLocal = (cert) => {
          if (cert.session_override && cert.session_override.length > 0) return cert.session_override.map(Number);
          const auto = getSessionForPostedAt(cert.posted_at).sessionIdx;
          return auto >= 0 ? [auto+1] : [];
        };
        // 학생의 sessionIdx별 cert(있으면 정시/지각 구분, 다중 회차 글 포함)
        const getNaverCertForSession = (studentName, sessionIdx) => {
          const csId = certStudentByName[studentName];
          if (csId === undefined) return null;
          const targetSession = sessionIdx + 1;
          for (const cert of attendanceCerts) {
            if (cert.assigned_student_id !== csId) continue;
            const sessions = getCertSessionsLocal(cert);
            if (sessions.includes(targetSession)) {
              const sessionDate = naverDates[sessionIdx];
              const late = isLateByDeadline(cert.posted_at, sessionDate);
              return { cert, isLate: late };
            }
          }
          return null;
        };

        // 출석 토글/조회
        const toggleAtt = (studentIdx, type, dateKey) => {
          const k = `${studentIdx}-${type}-${dateKey}`;
          setAttendance2(prev => ({...prev, [k]: !prev[k]}));
        };
        const getAtt = (studentIdx, type, dateKey) => {
          return attendance2[`${studentIdx}-${type}-${dateKey}`] || false;
        };

        // Group A ↔ Group B 매칭 (이름 또는 전화 마지막4자리)
        const phone4 = (ph) => ph.replace(/-/g,'').slice(-4);
        const matchedProfile = (s) =>
          (allProfiles||[]).find(p =>
            (p.role==="student"||p.role==="parent") &&
            (p.name===s.name || phone4(p.phone||"")===phone4(s.phone))
          );

        // 검색 필터 + 정렬
        const toggleSort = (col) => {
          setRosterSort(prev => prev.by===col ? {by:col,dir:prev.dir==="asc"?"desc":"asc"} : {by:col,dir:"asc"});
        };
        const SortBtn = ({col}) => {
          const active = rosterSort.by===col;
          const asc = rosterSort.dir==="asc";
          return (
            <span style={{display:"inline-flex",flexDirection:"column",lineHeight:1,marginLeft:3,cursor:"pointer",verticalAlign:"middle"}}
              onClick={()=>toggleSort(col)}>
              <span style={{fontSize:7,color:active&&asc?"#4F46E5":T.muted,lineHeight:1}}>▲</span>
              <span style={{fontSize:7,color:active&&!asc?"#4F46E5":T.muted,lineHeight:1}}>▼</span>
            </span>
          );
        };
        const filtered = ROSTER2
          .map((s, i) => ({...s, idx: i, profile: matchedProfile(s)}))
          .filter(s => s.name.includes(rosterSearch) || s.phone.includes(rosterSearch) || (s.profile?.email||"").includes(rosterSearch))
          .sort((a, b) => {
            const dir = rosterSort.dir==="asc" ? 1 : -1;
            if (rosterSort.by==="idx") return (a.idx - b.idx) * dir;
            return a.name.localeCompare(b.name, 'ko') * dir;
          });

        // 섹션 스타일 정의
        const SEC = {
          naver:   { bg:"#EEF2FF", color:"#4F46E5", label:"카페 인증",  dates: naverDates,   type:"N", total: naverDates.length },
          morning: { bg:"#FFF7ED", color:"#EA580C", label:"미라클모닝",   dates: morningDates, type:"M", total: morningDates.length },
          night:   { bg:"#F0FDF4", color:"#16A34A", label:"미라클나이트", dates: nightDates,   type:"나", total: nightDates.length },
        };
        const SECS = [SEC.naver, SEC.morning, SEC.night];

        // 고정 컬럼 공통 스타일
        const stickyBase = {
          position:"sticky", left:0, zIndex:2,
          background:T.surface, borderRight:`1px solid ${T.border}`,
        };
        const stickyHead = {...stickyBase, background:T.surfaceAlt};

        const CELL_W = 26;
        const CELL_H = 26;

        return (
          <div>
            {/* 상단: 제목 + 검색 */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
              <div style={{fontSize:15,fontWeight:800,color:T.navy,whiteSpace:"nowrap"}}>
                20HA 2기 학생 명단 {ROSTER2.length}명
              </div>
              <div style={{flex:1,minWidth:140,maxWidth:240,marginLeft:"auto"}}>
                <input
                  type="text"
                  placeholder="이름·전화번호 검색"
                  value={rosterSearch}
                  onChange={e=>setRosterSearch(e.target.value)}
                  style={{...css.input,padding:"7px 11px",fontSize:13}}
                />
              </div>
            </div>

            {/* 스프레드시트 테이블 */}
            <Card style={{padding:0,overflow:"hidden"}}>
              {/* 상단 스크롤바 */}
              <div id="r2-top"
                onScroll={e=>{ const b=document.getElementById('r2-body'); if(b) b.scrollLeft=e.target.scrollLeft; }}
                style={{overflowX:"auto",overflowY:"hidden",height:14,borderBottom:`1px solid ${T.border}`,cursor:"ew-resize"}}>
                <div style={{width:2820,height:1}}/>
              </div>
              <div id="r2-body"
                onScroll={e=>{ const t=document.getElementById('r2-top'); if(t) t.scrollLeft=e.target.scrollLeft; }}
                style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                <table style={{borderCollapse:"collapse",tableLayout:"fixed"}}>
                  <thead>
                    {/* 섹션 헤더 행 */}
                    <tr>
                      {/* sticky 고정 헤더 — rowSpan=2로 두 행 병합 */}
                      <th rowSpan={2} style={{...stickyHead, width:30, minWidth:30, fontSize:10, color:T.muted, fontWeight:700, textAlign:"center", padding:"4px 2px", borderBottom:`2px solid ${T.borderStrong}`, verticalAlign:"middle"}}>
                        #<SortBtn col="idx"/>
                      </th>
                      <th rowSpan={2} style={{...stickyHead, left:30, width:110, minWidth:110, fontSize:11, color:T.muted, fontWeight:700, padding:"4px 6px", borderBottom:`2px solid ${T.borderStrong}`, borderLeft:`1px solid ${T.border}`, verticalAlign:"middle"}}>
                        이름<SortBtn col="name"/>
                      </th>
                      {/* 이메일(ID연동) — rowSpan=2 */}
                      <th rowSpan={2} style={{fontSize:11, color:T.muted, fontWeight:700, padding:"4px 8px", borderBottom:`2px solid ${T.borderStrong}`, borderLeft:`1px solid ${T.border}`, minWidth:160, whiteSpace:"nowrap", verticalAlign:"middle", background:T.surfaceAlt}}>이메일 (ID연동)</th>
                      {/* 인증현황 요약 3열 헤더 */}
                      <th colSpan={3} style={{background:"#F5F3FF", color:"#6D28D9", fontSize:11, fontWeight:800, textAlign:"center", padding:"4px 0", borderBottom:`1px solid ${T.border}`, borderLeft:`2px solid #6D28D9`}}>인증 현황</th>
                      {/* 섹션 헤더 */}
                      {SECS.map((sec, si) => (
                        <th key={si} colSpan={sec.dates.length}
                          style={{
                            background: sec.bg, color: sec.color,
                            fontSize: 11, fontWeight: 800,
                            textAlign:"center", padding:"4px 0",
                            borderBottom:`1px solid ${T.border}`,
                            borderLeft:`2px solid ${sec.color}`,
                          }}>
                          {sec.label}
                        </th>
                      ))}
                    </tr>
                    {/* 날짜 헤더 행 — #/이름/이메일 칸 없음 (rowSpan으로 병합됨) */}
                    <tr>
                      {/* 요약 3열 서브헤더 */}
                      {[["네이버",SEC.naver.color,SEC.naver.bg],["모닝",SEC.morning.color,SEC.morning.bg],["나잇",SEC.night.color,SEC.night.bg]].map(([lbl,clr,bg],i)=>(
                        <th key={`sum-${i}`} style={{width:36,minWidth:36,fontSize:9,fontWeight:700,color:clr,background:bg,textAlign:"center",padding:"2px 0",borderBottom:`2px solid ${T.borderStrong}`,borderLeft:i===0?`2px solid #6D28D9`:`1px solid ${T.border}`}}>{lbl}</th>
                      ))}
                      {SECS.map((sec, si) =>
                        sec.dates.map((dt, di) => (
                          <th key={`${si}-${di}`}
                            style={{
                              width: CELL_W, minWidth: CELL_W,
                              fontSize: 8, fontWeight: 600,
                              color: sec.color, textAlign:"center",
                              padding:"2px 0", verticalAlign:"middle",
                              borderBottom:`2px solid ${T.borderStrong}`,
                              borderLeft: di===0 ? `2px solid ${sec.color}` : `1px solid ${T.border}`,
                              background: sec.bg,
                              whiteSpace:"nowrap", lineHeight:"1.2",
                            }}>
                            <div>{fmt(dt)}</div>
                            <div>{DAY_KO[dt.getDay()]}</div>
                          </th>
                        ))
                      )}
                      <th style={{background:T.surfaceAlt,borderBottom:`2px solid ${T.borderStrong}`,borderLeft:`1px solid ${T.border}`,minWidth:90}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={3 + 3 + naverDates.length + morningDates.length + nightDates.length}
                          style={{textAlign:"center",color:T.muted,padding:"40px 20px",fontSize:13}}>
                          검색 결과가 없습니다.
                        </td>
                      </tr>
                    ) : filtered.map((s, rowI) => {
                      const nCount = naverDates.filter((_, idx) => !!getNaverCertForSession(s.name, idx)).length;
                      const mCount = morningDates.filter(dt => getAtt(s.idx,"M",fmtKey(dt))).length;
                      const naCount = nightDates.filter(dt => getAtt(s.idx,"나",fmtKey(dt))).length;
                      return (
                        <tr key={s.idx} style={{background: rowI%2===0 ? T.surface : T.surfaceAlt}}>
                          {/* 고정: 번호 */}
                          <td style={{
                            ...stickyBase,
                            width:30, minWidth:30,
                            textAlign:"center", fontSize:10, color:T.muted, fontWeight:700,
                            padding:"0", height:CELL_H,
                            background: rowI%2===0 ? T.surface : T.surfaceAlt,
                            borderBottom:`1px solid ${T.border}`,
                          }}>{s.idx+1}</td>
                          {/* 고정: 이름+연락처 */}
                          <td style={{
                            ...stickyBase, left:30,
                            width:110, minWidth:110,
                            padding:"2px 6px",
                            background: rowI%2===0 ? T.surface : T.surfaceAlt,
                            borderBottom:`1px solid ${T.border}`,
                            borderLeft:`1px solid ${T.border}`,
                            verticalAlign:"middle",
                          }}>
                            <div style={{textAlign:"center",fontSize:12,fontWeight:800,color:T.navy,lineHeight:1.3}}>{s.name}</div>
                            <div style={{textAlign:"center",fontSize:9,color:T.muted,fontFamily:"'DM Mono',monospace",marginTop:1}}>{s.phone}</div>
                          </td>
                          {/* 이메일(ID연동) */}
                          <td style={{
                            minWidth:160, height:CELL_H,
                            padding:"0 8px", fontSize:11,
                            borderBottom:`1px solid ${T.border}`,
                            borderLeft:`1px solid ${T.border}`,
                            background: rowI%2===0 ? T.surface : T.surfaceAlt,
                            verticalAlign:"middle",
                          }}>
                            {s.profile
                              ? <span style={{color:T.navy, fontWeight:600}}>{s.profile.email}</span>
                              : <span style={{color:T.muted, fontSize:10}}>미가입</span>
                            }
                          </td>
                          {/* 요약 3열 */}
                          {[[nCount,SEC.naver.total,SEC.naver.color,SEC.naver.bg,true],[mCount,SEC.morning.total,SEC.morning.color,SEC.morning.bg,false],[naCount,SEC.night.total,SEC.night.color,SEC.night.bg,false]].map(([cnt,tot,clr,bg,first],i)=>(
                            <td key={`sum-${i}`} style={{
                              width:36,minWidth:36,height:CELL_H,
                              textAlign:"center",verticalAlign:"middle",
                              fontSize:10,fontWeight:700,
                              color:cnt>0?clr:T.muted,
                              background:cnt===tot&&tot>0?bg:"transparent",
                              borderBottom:`1px solid ${T.border}`,
                              borderLeft:first?`2px solid #6D28D9`:`1px solid ${T.border}`,
                              padding:0,whiteSpace:"nowrap",
                            }}>{cnt}/{tot}</td>
                          ))}
                          {/* 출석 셀들 */}
                          {SECS.map((sec, si) =>
                            sec.dates.map((dt, di) => {
                              const key = fmtKey(dt);
                              // 카페 인증(N): O(정시) / △(지각), 회차 단위로 매칭
                              const naverMatch = sec.type === "N" ? getNaverCertForSession(s.name, di) : null;
                              const hasNaverCert = !!naverMatch;
                              const isLate = hasNaverCert && naverMatch.isLate;
                              const checked = sec.type === "N" ? hasNaverCert : getAtt(s.idx, sec.type, key);
                              return (
                                <td key={`${si}-${di}`}
                                  style={{
                                    width: CELL_W, minWidth: CELL_W,
                                    height: CELL_H,
                                    textAlign:"center", verticalAlign:"middle",
                                    cursor:"default",
                                    fontSize: 12,
                                    fontWeight: checked ? 800 : 400,
                                    color: checked ? (sec.type==="N" && isLate ? "#B45309" : sec.color) : "transparent",
                                    background: checked ? (sec.type==="N" && isLate ? "#FEF3C7" : sec.bg) : "transparent",
                                    borderBottom:`1px solid ${T.border}`,
                                    borderLeft: di===0 ? `2px solid ${sec.color}` : `1px solid ${T.border}`,
                                    userSelect:"none",
                                    padding:0,
                                  }}>
                                  {sec.type === "N"
                                    ? (hasNaverCert ? (isLate ? "△" : "O") : "")
                                    : (checked ? "✓" : "")}
                                </td>
                              );
                            })
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
      })()}
    </div>
  );
};

// ══════════════════════════════════════════════════════
// ADMIN: Make-up — 경고 2회 이상 누적자
// 경고 = 미제출(어제 이전 회차 한정) OR 80점 미만
// ══════════════════════════════════════════════════════
const MakeupView = () => {
  const [students, setStudents] = useState([]);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const [{data:s}, {data:c}] = await Promise.all([
        supabase.rpc("get_cert_students"),
        supabase.rpc("get_attendance_certs", {
          p_from: new Date(ROSTER2_NAVER_DATES[0]).toISOString(),
          p_to:   new Date(ROSTER2_NAVER_DATES[ROSTER2_NAVER_DATES.length-1].getTime()+86400000).toISOString(),
        }),
      ]);
      setStudents(s||[]);
      setCerts(c||[]);
      setLoading(false);
    })();
  },[]);

  const kstDateStr = ts => {
    const k = new Date(new Date(ts).getTime() + 9*3600*1000);
    return `${k.getUTCFullYear()}-${String(k.getUTCMonth()+1).padStart(2,'0')}-${String(k.getUTCDate()).padStart(2,'0')}`;
  };
  const getSessionAuto = (posted_at) => {
    const postStr = kstDateStr(posted_at);
    for (let i = ROSTER2_NAVER_DATES.length - 1; i >= 0; i--) {
      if (postStr >= roster2FmtKey(ROSTER2_NAVER_DATES[i])) return i+1;
    }
    return null;
  };
  const getCertSessions = (cert) => {
    if (cert.session_override && cert.session_override.length > 0) return cert.session_override.map(Number);
    const auto = getSessionAuto(cert.posted_at);
    return auto ? [auto] : [];
  };

  // 어제 KST 일자
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate()-1);
  const yesterdayKey = roster2FmtKey(yesterday);

  // 회차 중 어제까지 끝난 회차만 검사 (회차 일자 <= 어제)
  const elapsedSessions = ROSTER2_NAVER_DATES
    .map((d,i)=>({idx:i, sn:i+1, date:d, key:roster2FmtKey(d)}))
    .filter(s => s.key <= yesterdayKey);

  // 학생별 분석 — 회차 순서대로 경고 검사 후 '연속 2회 이상' 발생한 학생만 대상자
  const realStudents = students.filter(s => s.name !== "테스트학생");
  const studentReports = realStudents.map(stu => {
    const warnings = [];
    // 회차 순서 보장 (sn 오름차순)
    const ordered = [...elapsedSessions].sort((a,b)=>a.sn-b.sn);
    let currentStreak = 0;
    let maxStreak = 0;
    let currentChain = [];
    let bestChain = [];
    ordered.forEach(sess => {
      const candidate = certs
        .filter(c => c.assigned_student_id === stu.id)
        .filter(c => getCertSessions(c).includes(sess.sn))
        .sort((a,b) => new Date(a.posted_at) - new Date(b.posted_at))[0];
      let warn = null;
      if (!candidate) {
        warn = {sn: sess.sn, date: sess.date, reason: "미제출"};
      } else if (candidate.completeness_score !== null && candidate.completeness_score !== undefined && Number(candidate.completeness_score) < 80) {
        warn = {sn: sess.sn, date: sess.date, reason: `80점 미만 (${candidate.completeness_score}점)`, score: Number(candidate.completeness_score)};
      }
      if (warn) {
        warnings.push(warn);
        currentStreak++;
        currentChain.push(warn);
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          bestChain = [...currentChain];
        }
      } else {
        currentStreak = 0;
        currentChain = [];
      }
    });
    return {student: stu, warnings, maxStreak, bestChain};
  }).filter(r => r.maxStreak >= 2)
    .sort((a,b) => b.maxStreak - a.maxStreak || b.warnings.length - a.warnings.length || a.student.name.localeCompare(b.student.name));

  if (loading) {
    return <Card style={{padding:40, textAlign:"center", color:T.muted}}>불러오는 중...</Card>;
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontSize:18,fontWeight:800,color:T.navy}}>📚 Make-up 대상자</div>
        <div style={{fontSize:12,color:T.muted}}>
          ※ 미제출은 어제({yesterday.getMonth()+1}/{yesterday.getDate()})까지의 회차만 검사 · <strong>2회 연속 경고</strong> 시 대상자
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy}}>
          현재 검사 회차: <span style={{color:"#4F46E5"}}>{elapsedSessions.length}개</span>
          {elapsedSessions.length>0 && <span style={{fontSize:11,color:T.muted,marginLeft:6}}>
            (1회 ~ {elapsedSessions[elapsedSessions.length-1].sn}회)
          </span>}
        </div>
        <div style={{marginLeft:"auto",fontSize:13,fontWeight:700,color:T.navy}}>
          대상자 <span style={{color:"#DC2626"}}>{studentReports.length}명</span>
        </div>
      </div>

      {studentReports.length === 0 ? (
        <Card style={{padding:40, textAlign:"center", color:T.muted, fontSize:13}}>
          현재 Make-up 대상자가 없습니다 🎉
        </Card>
      ) : (
        <div style={{display:"grid",gap:10}}>
          {studentReports.map(({student, warnings, maxStreak}) => {
            return (
            <Card key={student.id} style={{padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:10,borderBottom:`1px solid ${T.border}`,paddingBottom:8,flexWrap:"wrap"}}>
                <div style={{fontSize:15,fontWeight:800,color:T.navy}}>{student.name}</div>
                <div style={{fontSize:11,color:T.muted}}>{student.phone||""}</div>
                <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:700,
                    color:maxStreak>=4?"#DC2626":maxStreak>=3?"#B45309":"#92400E",
                    background:maxStreak>=4?"#FEE2E2":"#FEF3C7",
                    padding:"3px 10px",borderRadius:10,border:`1px solid ${maxStreak>=4?"#FECACA":"#FDE68A"}`}}>
                    연속 {maxStreak}회 경고
                  </span>
                  <span style={{fontSize:11,color:T.muted}}>(총 {warnings.length}회)</span>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(180px,1fr))",gap:6}}>
                {warnings.map(w => {
                  const isLow = w.reason.startsWith("80점");
                  return (
                    <div key={w.sn} style={{
                      padding:"6px 10px",borderRadius:8,fontSize:12,
                      background:isLow?"#FEF3C7":"#FEE2E2",
                      border:`1px solid ${isLow?"#FDE68A":"#FECACA"}`,
                      color:isLow?"#92400E":"#991B1B",
                    }}>
                      <span style={{fontWeight:800}}>{w.sn}회</span>
                      <span style={{fontSize:10,marginLeft:3,opacity:0.8}}>({w.date.getMonth()+1}/{w.date.getDate()})</span>
                      <span style={{marginLeft:6,fontWeight:600}}>· {w.reason}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════
// ADMIN: 20HA 2기 출석체크 (CSV 업로드)
// ══════════════════════════════════════════════════════
const AttendanceUploadView = ({onRefresh}) => {
  const [parsed, setParsed] = useState(null);   // {sessionDate, sessionType, sessionIdx, sessionLabel, matched: [{name,csvName,id}], errors: [{csvName,reason}], errorActions: {csvName: 'ignore'|'name'|...}}
  const [students, setStudents] = useState([]); // cert_students
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const fileRef = useRef(null);

  useEffect(()=>{
    supabase.rpc("get_cert_students").then(({data})=>setStudents(data||[]));
  },[]);

  // 헬퍼: 폰 뒷4 / 중간4 인덱스
  const studentIndex = useMemo(()=>{
    const byLast4 = {}, byMid4 = {}, byName = {};
    students.forEach(s=>{
      const ph = (s.phone||"").replace(/-/g,"");
      if(ph.length>=4) byLast4[ph.slice(-4)] = s;
      if(ph.length>=7) byMid4[ph.slice(3,7)] = s;
      byName[s.name] = s;
    });
    return {byLast4, byMid4, byName};
  },[students]);

  // CSV 한 줄 파싱 (큰따옴표 처리 포함)
  const parseCSVLine = (line) => {
    const out = [];
    let cur = "", inQ = false;
    for(let i=0;i<line.length;i++){
      const c = line[i];
      if(c === '"'){ inQ = !inQ; continue; }
      if(c === ',' && !inQ){ out.push(cur); cur = ""; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  };

  // 이름 파싱 ("강예나/초5/7565", "초6/김가인/0142", "심수윤", "한설아/초5/1931 (한설아)" 등)
  const parseParticipantName = (raw) => {
    if(!raw) return {name:null, code:null};
    // 괄호 안 내용 제거
    let s = raw.replace(/\([^)]*\)/g, "").trim();
    // 슬래시/공백/언더스코어 → 공백
    s = s.replace(/[\/_]/g, " ").replace(/\s+/g," ").trim();
    // 4자리 숫자 (전화 뒷4 또는 중간4)
    const codeM = s.match(/\d{4}/);
    const code = codeM ? codeM[0] : null;
    // 한글 이름 (2~4자, "주차" 등 제외)
    const names = (s.match(/[가-힣]{2,4}/g) || []).filter(n => !["주차","초등","중등","고등"].includes(n) && !/^[초중고]\d?$/.test(n));
    const name = names[0] || null;
    return {name, code};
  };

  // CSV 처리
  const handleFile = async (file) => {
    setSaveMsg(null);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l=>l.trim());
    if(lines.length < 2){ alert("CSV가 비어있어요"); return; }
    const header = parseCSVLine(lines[0]);
    const nameIdx = header.findIndex(h => h.includes("이름") || h.includes("원래"));
    const joinIdx = header.findIndex(h => h.includes("참가"));
    if(nameIdx < 0 || joinIdx < 0){ alert("CSV 헤더 형식이 다릅니다 (이름/참가 시간 필요)"); return; }

    // 첫 데이터 행에서 날짜/시간 파악 → 모닝/나잇 구분
    let sessionDate = null, sessionType = null;
    for(let i=1;i<lines.length;i++){
      const cols = parseCSVLine(lines[i]);
      const t = cols[joinIdx];
      // "2026/05/22 06:57:23 AM" 형태
      const m = t && t.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})\s+\d{1,2}:\d{2}(?::\d{2})?\s*(AM|PM)/i);
      if(m){
        sessionDate = `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
        sessionType = m[4].toUpperCase()==="AM" ? "M" : "N"; // M=모닝, N=나잇
        break;
      }
    }
    if(!sessionDate){ alert("CSV에서 날짜를 인식하지 못했어요"); return; }

    // 회차 매칭 (모닝/나잇)
    const dates = sessionType==="M" ? ROSTER2_MORNING_DATES : ROSTER2_NIGHT_DATES;
    const sessionIdx = dates.findIndex(d => roster2FmtKey(d) === sessionDate);
    const typeLabel = sessionType==="M" ? "미라클모닝" : "미라클나이트";
    const sessionLabel = sessionIdx >= 0
      ? `${sessionDate.slice(5)} ${sessionIdx+1}회 ${typeLabel}`
      : `${sessionDate.slice(5)} ${typeLabel} (일정 외)`;

    // 모든 참가자 → 이름 매칭
    const matchedMap = {}; // student_id → {id,name,csvNames:[]}
    const errors = []; // {csvName,reason}
    const seenCsvNames = new Set();
    for(let i=1;i<lines.length;i++){
      const cols = parseCSVLine(lines[i]);
      const rawName = cols[nameIdx];
      if(!rawName || seenCsvNames.has(rawName)) continue;
      seenCsvNames.add(rawName);
      // 외부인 ("아이작", "Kevin" 등 알려진 외부인은 제외)
      if(/iforyou76@/i.test(cols[1]||"")) continue;
      const {name, code} = parseParticipantName(rawName);
      if(!name && !code){
        if(rawName !== "아이작" && rawName !== "Kevin") errors.push({csvName: rawName, reason: "이름/코드 파싱 실패"});
        continue;
      }
      // 매칭 시도: 이름+뒷4 → 이름+중간4 → 이름만 → 코드만
      let stu = null;
      if(name && code){
        if(studentIndex.byLast4[code] && studentIndex.byLast4[code].name===name) stu = studentIndex.byLast4[code];
        else if(studentIndex.byMid4[code] && studentIndex.byMid4[code].name===name) stu = studentIndex.byMid4[code];
      }
      if(!stu && name && studentIndex.byName[name]) stu = studentIndex.byName[name];
      if(!stu && code){
        if(studentIndex.byLast4[code]) stu = studentIndex.byLast4[code];
        else if(studentIndex.byMid4[code]) stu = studentIndex.byMid4[code];
      }
      if(stu){
        if(!matchedMap[stu.id]) matchedMap[stu.id] = {id: stu.id, name: stu.name, csvNames: []};
        matchedMap[stu.id].csvNames.push(rawName);
      } else {
        errors.push({csvName: rawName, reason: name?`'${name}' 명단에 없음`:`코드 ${code||'?'} 매칭 실패`});
      }
    }
    const matched = Object.values(matchedMap).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
    const errorActions = {};
    errors.forEach(e => { errorActions[e.csvName] = "ignore"; });

    setParsed({
      sessionDate, sessionType, sessionIdx,
      sessionLabel, typeLabel,
      matched, errors, errorActions,
      fileName: file.name,
    });
  };

  const handleSave = async () => {
    if(!parsed) return;
    setSaving(true);
    setSaveMsg(null);
    // 에러 학생 중 수동 할당된 것 추가
    const extraIds = [];
    Object.entries(parsed.errorActions).forEach(([csvName, action])=>{
      if(action && action !== "ignore"){
        const sid = parseInt(action);
        if(!isNaN(sid)) extraIds.push(sid);
      }
    });
    const allStudentIds = [...parsed.matched.map(m=>m.id), ...extraIds];
    const {error} = await supabase.rpc("save_attendance_batch", {
      p_session_date: parsed.sessionDate,
      p_session_type: parsed.sessionType,
      p_student_ids: allStudentIds,
    });
    setSaving(false);
    if(error){
      setSaveMsg({type:"error", text:`저장 실패: ${error.message}`});
    } else {
      setSaveMsg({type:"success", text:`✅ ${parsed.sessionLabel} 출석 ${allStudentIds.length}명 저장 완료!`});
      setTimeout(()=>{ setParsed(null); setSaveMsg(null); if(fileRef.current) fileRef.current.value=""; },2500);
      onRefresh && onRefresh();
    }
  };

  return (
    <div style={{display:"grid",gap:14}}>
      <div style={{fontSize:18,fontWeight:800,color:T.navy}}>📋 20HA 2기 출석체크</div>
      <Card style={{padding:"18px 20px"}}>
        <div style={{fontSize:13,color:T.muted,marginBottom:12}}>
          Zoom 참가자 CSV를 업로드하면 자동으로 날짜/회차/세션을 판별해 출석을 정리합니다.
          미리보기 후 <b>저장</b>을 눌러야 DB에 반영됩니다.
        </div>
        {/* 드래그 드롭 + 클릭 영역 — 직접 클릭으로 input.click() 호출 */}
        <div
          onClick={()=>fileRef.current?.click()}
          onDragOver={e=>{e.preventDefault();e.currentTarget.style.background="#EEF2FF";e.currentTarget.style.borderColor="#4F46E5";}}
          onDragLeave={e=>{e.currentTarget.style.background="#F8FAFC";e.currentTarget.style.borderColor="#CBD5E1";}}
          onDrop={e=>{
            e.preventDefault();
            e.currentTarget.style.background="#F8FAFC";
            e.currentTarget.style.borderColor="#CBD5E1";
            const f = e.dataTransfer.files?.[0];
            if(f) handleFile(f);
          }}
          style={{
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            gap:10,padding:"32px 20px",borderRadius:12,
            border:"2px dashed #CBD5E1",background:"#F8FAFC",
            cursor:"pointer",transition:"all .15s",userSelect:"none",
          }}>
          <div style={{fontSize:36,opacity:0.6}}>📄</div>
          <div style={{fontSize:14,fontWeight:700,color:T.navy}}>CSV 파일을 여기로 드래그하거나 클릭해서 선택</div>
          <div style={{fontSize:11,color:T.muted}}>참가자 명단 CSV (Zoom 내보내기)</div>
          {/* hidden input — 화면에서만 보이지 않게, 접근성 유지 */}
          <input ref={fileRef} type="file" accept=".csv,text/csv"
            onChange={e=>{const f=e.target.files?.[0]; if(f) handleFile(f);}}
            style={{position:"absolute",left:-9999,width:1,height:1,opacity:0}}/>
        </div>
      </Card>

      {parsed && (
        <>
          {/* 세션 정보 */}
          <Card style={{padding:"18px 20px",background:parsed.sessionIdx>=0?"#F0FDF4":"#FEF3C7",border:`2px solid ${parsed.sessionIdx>=0?"#86EFAC":"#FCD34D"}`}}>
            <div style={{fontSize:12,color:T.muted,marginBottom:6}}>파일: {parsed.fileName}</div>
            <div style={{fontSize:20,fontWeight:900,color:T.navy}}>{parsed.sessionLabel}</div>
            {parsed.sessionIdx < 0 && (
              <div style={{fontSize:11,color:"#B45309",marginTop:6}}>⚠️ ROSTER2 회차 일정에 없는 날짜입니다. 저장은 가능하지만 회차 표시는 안 됩니다.</div>
            )}
          </Card>

          {/* 인정 명단 */}
          <Card style={{padding:"16px 20px"}}>
            <div style={{fontSize:14,fontWeight:800,color:T.navy,marginBottom:10}}>
              ✅ 출석 인정 ({parsed.matched.length}명)
            </div>
            {parsed.matched.length === 0 ? (
              <div style={{fontSize:12,color:T.muted,textAlign:"center",padding:"16px 0"}}>매칭된 학생 없음</div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:6}}>
                {parsed.matched.map(m => (
                  <div key={m.id} style={{padding:"6px 10px",borderRadius:8,background:"#F0FDF4",border:"1px solid #86EFAC",fontSize:12,color:T.navy}}>
                    <span style={{fontWeight:700}}>{m.name}</span>
                    {m.csvNames[0] !== m.name && (
                      <div style={{fontSize:9,color:T.muted,marginTop:2}}>CSV: {m.csvNames[0]}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 에러 처리 */}
          {parsed.errors.length > 0 && (
            <Card style={{padding:"16px 20px",background:"#FFFBEB",border:"1px solid #FCD34D"}}>
              <div style={{fontSize:14,fontWeight:800,color:"#B45309",marginBottom:10}}>
                ⚠️ 매칭 실패 ({parsed.errors.length}명) — 어떻게 처리할지 선택
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {parsed.errors.map((e,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:T.white,borderRadius:8,border:`1px solid ${T.border}`}}>
                    <span style={{flex:1,fontSize:12,color:T.navy}}>
                      <b>{e.csvName}</b>
                      <span style={{fontSize:10,color:T.muted,marginLeft:6}}>({e.reason})</span>
                    </span>
                    <select value={parsed.errorActions[e.csvName] || "ignore"}
                      onChange={ev=>setParsed(p=>({...p,errorActions:{...p.errorActions,[e.csvName]:ev.target.value}}))}
                      style={{...css.input,fontSize:11,padding:"4px 8px",width:160}}>
                      <option value="ignore">무시</option>
                      <optgroup label="학생 수동 할당">
                        {students.filter(s=>s.sort_order<43).map(s=>(
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 저장 영역 */}
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,alignItems:"center"}}>
            {saveMsg && (
              <span style={{fontSize:13,fontWeight:700,color:saveMsg.type==="success"?"#065F46":T.danger}}>
                {saveMsg.text}
              </span>
            )}
            <button onClick={()=>{setParsed(null); if(fileRef.current) fileRef.current.value="";}}
              style={{...css.btnOutline,padding:"10px 20px",fontSize:14}}>취소</button>
            <button onClick={handleSave} disabled={saving}
              style={{...css.btnOrange,padding:"10px 24px",fontSize:14,opacity:saving?0.6:1}}>
              {saving?"저장 중...":"💾 저장"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════
// ADMIN: 만점 테스트
// ══════════════════════════════════════════════════════

// ── 문항 관리 (Question Bank) ─────────────────────────
const ManjeomQuestionsTab = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // 선택된 문항 또는 새 문항 객체
  const [filter, setFilter] = useState({type:"", kw:""});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    const {data, error} = await supabase.from("manjeom_questions")
      .select("*").order("created_at",{ascending:false});
    if(error){ alert("문항 조회 실패: "+error.message); }
    else setList(data||[]);
    setLoading(false);
  };
  useEffect(()=>{ load(); }, []);

  const filtered = list.filter(q=>{
    if(filter.type && q.q_type!==filter.type) return false;
    const kw = (filter.kw||"").trim();
    if(kw){
      const kwLower = kw.toLowerCase();
      const inPrompt = (q.prompt||"").toLowerCase().includes(kwLower);
      const inTags   = (q.tags||[]).some(t => String(t||"").toLowerCase().includes(kwLower));
      const inSeq    = String(q.seq||"").includes(kw) || `q-${q.seq||""}`.toLowerCase().includes(kwLower);
      if(!inPrompt && !inTags && !inSeq) return false;
    }
    return true;
  });

  const MCQ_DEFAULT_CHOICES = ["①","②","③","④","⑤"];
  const MCQ_LABELS = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"];
  const blank = () => ({
    id:null, q_type:"short", prompt:"", image_url:"",
    choices:["",""], answers:[""], tags:[],
    _correctIdx: [], // mcq 정답 보기 인덱스 (편집 UX용)
    _tagsRaw: "",     // 태그 원본 입력 문자열 (쉼표 입력 시 사라지지 않도록)
  });

  const startNew = () => setEditing(blank());
  const startEdit = (q) => {
    // mcq 정답은 정렬된 콤마 결합 문자열 1개로 저장됨 (예: "①,③")
    let correctIdx = [];
    if(q.q_type === "mcq" && Array.isArray(q.answers) && q.answers.length > 0){
      const canonical = String(q.answers[0] || "");
      const tokens = canonical.split(",").map(s=>s.trim()).filter(Boolean);
      correctIdx = tokens.map(t => (q.choices||[]).indexOf(t)).filter(i => i >= 0);
    }
    setEditing({
      ...q,
      choices: q.choices || ["",""],
      answers: q.answers || [""],
      tags: q.tags || [],
      _correctIdx: correctIdx,
      _tagsRaw: (q.tags || []).join(", "),
    });
  };

  const upload = async (file) => {
    if(!file) return;
    if(file.size > 2*1024*1024){ alert("파일 크기는 2MB 이하만 가능합니다."); return; }
    if(!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)){ alert("PNG/JPG/WebP만 가능합니다."); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `q_${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
    const {error} = await supabase.storage.from("manjeom-images").upload(path, file, {contentType:file.type});
    if(error){ alert("업로드 실패: "+error.message); setUploading(false); return; }
    const {data:{publicUrl}} = supabase.storage.from("manjeom-images").getPublicUrl(path);
    setEditing(e => ({...e, image_url: publicUrl}));
    setUploading(false);
  };

  const save = async () => {
    if(!editing.prompt.trim()){ alert("문제 본문을 입력해주세요."); return; }

    let answers;
    if(editing.q_type === "short"){
      answers = (editing.answers||[]).map(a=>String(a||"").trim()).filter(Boolean);
      if(answers.length === 0){ alert("정답을 한 개 이상 입력해주세요."); return; }
    } else {
      const cleanChoices = (editing.choices||[]).map(c=>String(c||"").trim()).filter(Boolean);
      if(cleanChoices.length < 2){ alert("보기를 2개 이상 입력해주세요."); return; }
      const corr = (editing._correctIdx||[]).filter(i => i < cleanChoices.length);
      if(corr.length === 0){ alert("정답 보기를 1개 이상 선택해주세요."); return; }
      // 다중 정답 가능 — 정렬된 콤마 결합 한 문자열로 저장 (예: "①,③")
      const canonical = [...corr].sort((a,b)=>a-b).map(i => cleanChoices[i]).join(",");
      answers = [canonical];
      editing.choices = cleanChoices;
    }

    const parsedTags = String(editing._tagsRaw || "")
      .split(",").map(s=>s.trim()).filter(Boolean);
    const payload = {
      q_type: editing.q_type,
      prompt: editing.prompt.trim(),
      image_url: editing.image_url || null,
      choices: editing.q_type==="mcq" ? editing.choices : null,
      answers,
      tags: parsedTags.length>0 ? parsedTags : null,
    };

    let res;
    if(editing.id){
      res = await supabase.from("manjeom_questions").update({...payload, updated_at:new Date().toISOString()}).eq("id", editing.id);
    } else {
      res = await supabase.from("manjeom_questions").insert(payload);
    }
    if(res.error){ alert("저장 실패: "+res.error.message); return; }
    setEditing(null);
    await load();
  };

  const remove = async (q) => {
    if(!window.confirm(`"${q.prompt.slice(0,30)}..." 문항을 삭제할까요?\n(시험지에 사용 중이면 삭제 불가)`)) return;
    const {error} = await supabase.from("manjeom_questions").delete().eq("id", q.id);
    if(error){
      if(error.code === "23503") alert("이 문항은 시험지에 포함되어 있어 삭제할 수 없습니다. 먼저 시험지에서 제거하세요.");
      else alert("삭제 실패: "+error.message);
      return;
    }
    setEditing(null);
    await load();
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:14,alignItems:"start"}}>
      {/* 좌측 목록 */}
      <Card style={{padding:"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:800,color:T.navy}}>문항 ({list.length})</div>
          <button style={{...css.btnOrange,padding:"6px 12px",fontSize:11}} onClick={startNew}>+ 새 문항</button>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          <select value={filter.type} onChange={e=>setFilter(f=>({...f,type:e.target.value}))}
            style={{...css.select,padding:"6px 8px",fontSize:11,flex:"0 0 100px"}}>
            <option value="">전체</option>
            <option value="short">단답형</option>
            <option value="mcq">객관식</option>
          </select>
          <input value={filter.kw} onChange={e=>setFilter(f=>({...f,kw:e.target.value}))}
            placeholder="검색 (본문·태그·번호)" style={{...css.input,padding:"6px 10px",fontSize:11}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:520,overflowY:"auto"}}>
          {loading ? <Spinner/> :
            filtered.length===0 ? <div style={{fontSize:11,color:T.muted,textAlign:"center",padding:"20px 0"}}>문항이 없습니다.</div> :
            filtered.map(q=>(
              <div key={q.id} onClick={()=>startEdit(q)}
                style={{padding:"8px 10px",borderRadius:8,border:`1px solid ${editing?.id===q.id?T.navy:T.border}`,
                  background:editing?.id===q.id?"#EEF2FF":T.surfaceAlt,cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:10,fontWeight:800,color:T.muted,letterSpacing:"0.04em"}}>Q-{q.seq||"?"}</span>
                  <Pill color={q.q_type==="short"?"#0EA5E9":"#A855F7"}>{q.q_type==="short"?"단답":"객관식"}</Pill>
                  {q.image_url && <span style={{fontSize:10}}>🖼️</span>}
                </div>
                <div style={{fontSize:12,color:T.navy,lineHeight:1.4,marginBottom:4,
                  display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{q.prompt}</div>
                {(q.tags||[]).length > 0 && (
                  <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                    {q.tags.map((t,i)=>(
                      <span key={i} onClick={(e)=>{e.stopPropagation(); setFilter(f=>({...f,kw:t}));}}
                        style={{fontSize:10,color:T.navy,background:"#E0E7FF",
                          padding:"1px 7px",borderRadius:10,fontWeight:600,cursor:"pointer"}}
                        title={`태그 "${t}"로 검색`}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </Card>

      {/* 우측 편집 */}
      <Card style={{padding:"18px 20px"}}>
        {!editing ? (
          <div style={{textAlign:"center",padding:"60px 0",color:T.muted}}>
            <div style={{fontSize:36,opacity:0.4,marginBottom:10}}>📝</div>
            <div style={{fontSize:13}}>좌측에서 문항을 선택하거나 "+ 새 문항"을 눌러주세요.</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:14,fontWeight:800,color:T.navy}}>{editing.id ? "문항 편집":"새 문항"}</div>
                {editing.id && editing.seq && (
                  <span style={{fontSize:11,fontWeight:700,color:T.muted,
                    padding:"2px 8px",background:T.surfaceAlt,borderRadius:6,letterSpacing:"0.04em"}}>
                    Q-{editing.seq}
                  </span>
                )}
              </div>
              <div style={{display:"flex",gap:6}}>
                {editing.id && <button style={{...css.btnGhost,padding:"7px 14px",fontSize:11,color:"#DC2626"}} onClick={()=>remove(editing)}>삭제</button>}
                <button style={{...css.btnGhost,padding:"7px 14px",fontSize:11}} onClick={()=>setEditing(null)}>취소</button>
                <button style={{...css.btnOrange,padding:"7px 14px",fontSize:11}} onClick={save}>저장</button>
              </div>
            </div>

            <div style={{display:"flex",gap:14,alignItems:"center"}}>
              <label style={{...css.label,marginBottom:0}}>유형</label>
              {[{v:"short",l:"단답형"},{v:"mcq",l:"객관식"}].map(({v,l})=>(
                <label key={v} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,cursor:"pointer"}}>
                  <input type="radio" name="qtype" checked={editing.q_type===v}
                    onChange={()=>setEditing(e=>{
                      // 객관식 전환 시 보기를 ①~⑤ 5개로 기본 채움 (보기 내용은 이미지에 포함)
                      if(v==="mcq" && (e.choices.length<2 || e.choices.every(c=>!c?.trim()))){
                        return {...e,q_type:v,choices:[...MCQ_DEFAULT_CHOICES],_correctIdx:[]};
                      }
                      return {...e,q_type:v};
                    })}/>{l}
                </label>
              ))}
            </div>

            <div>
              <label style={css.label}>문제 본문</label>
              <textarea value={editing.prompt} onChange={e=>setEditing({...editing,prompt:e.target.value})}
                rows={3} style={{...css.input,fontFamily:"inherit",resize:"vertical"}}/>
            </div>

            <div>
              <label style={css.label}>문제 이미지 (선택, 권장 가로 800~1200px, 2MB 이하)</label>
              {editing.image_url ? (
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <img src={editing.image_url} alt="문제" style={{maxWidth:300,borderRadius:8,border:`1px solid ${T.border}`}}/>
                  <button style={{...css.btnGhost,padding:"6px 12px",fontSize:11}}
                    onClick={()=>setEditing(e=>({...e,image_url:""}))}>이미지 제거</button>
                </div>
              ) : (
                <>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp"
                    style={{display:"none"}}
                    onChange={e=>{const f=e.target.files?.[0]; if(f) upload(f); e.target.value="";}}/>
                  <button style={{...css.btnGhost,padding:"8px 16px",fontSize:12}} onClick={()=>fileRef.current?.click()}>
                    {uploading ? <Spinner size={14}/> : "📁 이미지 업로드"}
                  </button>
                </>
              )}
            </div>

            {editing.q_type === "short" ? (
              <div>
                <label style={css.label}>정답 후보 (여러 개 등록 가능 — 학생이 어느 것 하나만 맞으면 정답. 공백/대소문자 무시)</label>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {editing.answers.map((a,i)=>(
                    <div key={i} style={{display:"flex",gap:6}}>
                      <input value={a} onChange={e=>{
                        const next=[...editing.answers]; next[i]=e.target.value;
                        setEditing({...editing,answers:next});
                      }} placeholder={`정답 ${i+1}`}
                      style={{...css.input,padding:"8px 12px",fontSize:13}}/>
                      <button style={{...css.btnGhost,padding:"6px 12px",fontSize:11}}
                        onClick={()=>setEditing(e=>({...e,answers:e.answers.filter((_,idx)=>idx!==i)}))}>✕</button>
                    </div>
                  ))}
                  <button style={{...css.btnOutline,alignSelf:"flex-start",padding:"6px 14px",fontSize:11}}
                    onClick={()=>setEditing(e=>({...e,answers:[...e.answers,""]}))}>+ 정답 추가</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <label style={{...css.label,marginBottom:0}}>
                    객관식 정답 ({editing.choices.length}개 보기 · 정답 번호만 체크 — 복수 가능)
                  </label>
                  <div style={{display:"flex",gap:6}}>
                    <button style={{...css.btnOutline,padding:"4px 10px",fontSize:11}}
                      disabled={editing.choices.length<=2}
                      onClick={()=>setEditing(ed=>{
                        const last = ed.choices.length - 1;
                        return {
                          ...ed,
                          choices: ed.choices.slice(0,last),
                          _correctIdx: (ed._correctIdx||[]).filter(i => i !== last),
                        };
                      })}>− 보기 줄이기</button>
                    <button style={{...css.btnOutline,padding:"4px 10px",fontSize:11}}
                      disabled={editing.choices.length>=10}
                      onClick={()=>setEditing(ed=>{
                        const i = ed.choices.length;
                        const lbl = MCQ_LABELS[i] || String(i+1);
                        return {...ed, choices:[...ed.choices, lbl]};
                      })}>+ 보기 늘리기</button>
                  </div>
                </div>
                <div style={{fontSize:11,color:T.muted,marginBottom:8}}>
                  보기 내용은 보통 문제 이미지에 포함됩니다. 텍스트도 넣고 싶다면 아래 "보기 텍스트 입력" 펼치세요.
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {editing.choices.map((c,i)=>(
                    <label key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",
                      border:`2px solid ${(editing._correctIdx||[]).includes(i)?"#16A34A":T.border}`,
                      borderRadius:10,
                      background:(editing._correctIdx||[]).includes(i)?"#F0FDF4":T.surfaceAlt,
                      cursor:"pointer",minWidth:64,justifyContent:"center"}}>
                      <input type="checkbox" checked={(editing._correctIdx||[]).includes(i)}
                        onChange={e=>setEditing(ed=>{
                          const set = new Set(ed._correctIdx||[]);
                          if(e.target.checked) set.add(i); else set.delete(i);
                          return {...ed,_correctIdx:[...set]};
                        })}/>
                      <span style={{fontSize:16,fontWeight:800,color:T.navy}}>{c || (MCQ_LABELS[i]||(i+1))}</span>
                    </label>
                  ))}
                </div>
                <details style={{marginTop:10}}>
                  <summary style={{fontSize:11,color:T.muted,cursor:"pointer"}}>보기 텍스트 입력 (선택)</summary>
                  <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
                    {editing.choices.map((c,i)=>(
                      <div key={i} style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{fontSize:12,color:T.muted,width:20}}>{MCQ_LABELS[i]||(i+1)}</span>
                        <input value={c} onChange={e=>{
                          const next=[...editing.choices]; next[i]=e.target.value;
                          setEditing({...editing,choices:next});
                        }} placeholder={`보기 ${i+1} (선택)`}
                        style={{...css.input,padding:"6px 10px",fontSize:12}}/>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            <div>
              <label style={css.label}>태그 (선택, 쉼표 구분 — 예: "수학, 중1, 비례식")</label>
              <input value={editing._tagsRaw ?? (editing.tags||[]).join(", ")}
                onChange={e=>setEditing({...editing,_tagsRaw:e.target.value})}
                placeholder='예: 수학, 중1, 비례식'
                style={{...css.input,padding:"8px 12px",fontSize:13}}/>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// ── 시험지 관리 (Test Composer) ────────────────────────
const ManjeomTestsTab = () => {
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]); // 문항 은행 전체
  const [editing, setEditing] = useState(null);   // 시험지 편집 객체
  const [editingQids, setEditingQids] = useState([]); // 시험지에 포함된 question id 배열 (순서)
  const [showPicker, setShowPicker] = useState(false);
  const [pickerKw, setPickerKw] = useState("");

  const load = async () => {
    const {data:t} = await supabase.from("manjeom_tests").select("*").order("created_at",{ascending:false});
    const {data:q} = await supabase.from("manjeom_questions").select("id,seq,q_type,prompt,image_url,tags").order("seq",{ascending:true});
    setTests(t||[]);
    setQuestions(q||[]);
  };
  useEffect(()=>{ load(); }, []);

  const startNew = () => { setEditing({id:null,title:"",description:"",is_published:false}); setEditingQids([]); };
  const startEdit = async (t) => {
    setEditing({...t});
    const {data} = await supabase.from("manjeom_test_questions")
      .select("question_id,q_order").eq("test_id",t.id).order("q_order");
    setEditingQids((data||[]).map(r=>r.question_id));
  };

  const save = async () => {
    if(!editing.title.trim()){ alert("제목을 입력해주세요."); return; }
    let testId = editing.id;
    if(testId){
      const {error} = await supabase.from("manjeom_tests")
        .update({title:editing.title,description:editing.description,is_published:editing.is_published,updated_at:new Date().toISOString()})
        .eq("id",testId);
      if(error){ alert("저장 실패: "+error.message); return; }
    } else {
      const {data,error} = await supabase.from("manjeom_tests")
        .insert({title:editing.title,description:editing.description,is_published:editing.is_published})
        .select().single();
      if(error){ alert("저장 실패: "+error.message); return; }
      testId = data.id;
    }
    // 문항 매핑 일괄 교체
    const {error:e2} = await supabase.rpc("set_manjeom_test_questions",{p_test_id:testId,p_question_ids:editingQids});
    if(e2){ alert("문항 매핑 저장 실패: "+e2.message); return; }
    setEditing(null);
    await load();
  };

  const remove = async (t) => {
    if(!window.confirm(`"${t.title}" 시험지를 삭제할까요?\n(배정 및 시도 기록도 함께 삭제됩니다)`)) return;
    const {error} = await supabase.from("manjeom_tests").delete().eq("id",t.id);
    if(error){ alert("삭제 실패: "+error.message); return; }
    setEditing(null);
    await load();
  };

  const move = (idx, dir) => {
    const next=[...editingQids]; const j=idx+dir;
    if(j<0||j>=next.length) return;
    [next[idx],next[j]]=[next[j],next[idx]];
    setEditingQids(next);
  };

  const addQuestions = (ids) => {
    setEditingQids(prev => [...prev, ...ids.filter(id=>!prev.includes(id))]);
    setShowPicker(false);
  };

  const qMap = Object.fromEntries(questions.map(q=>[q.id,q]));
  const pickerList = questions.filter(q =>
    !editingQids.includes(q.id) &&
    (!pickerKw || (q.prompt||"").includes(pickerKw))
  );

  return (
    <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:14,alignItems:"start"}}>
      <Card style={{padding:"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:800,color:T.navy}}>시험지 ({tests.length})</div>
          <button style={{...css.btnOrange,padding:"6px 12px",fontSize:11}} onClick={startNew}>+ 새 시험지</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:520,overflowY:"auto"}}>
          {tests.length===0 ? <div style={{fontSize:11,color:T.muted,textAlign:"center",padding:"20px 0"}}>시험지가 없습니다.</div> :
            tests.map(t=>(
              <div key={t.id} onClick={()=>startEdit(t)}
                style={{padding:"10px 12px",borderRadius:8,border:`1px solid ${editing?.id===t.id?T.navy:T.border}`,
                  background:editing?.id===t.id?"#EEF2FF":T.surfaceAlt,cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <Pill color={t.is_published?"#16A34A":"#94A3B8"}>{t.is_published?"🟢 공개":"📝 초안"}</Pill>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{t.title}</div>
                {t.description && <div style={{fontSize:11,color:T.muted,marginTop:2}}>{t.description}</div>}
              </div>
            ))
          }
        </div>
      </Card>

      <Card style={{padding:"18px 20px"}}>
        {!editing ? (
          <div style={{textAlign:"center",padding:"60px 0",color:T.muted}}>
            <div style={{fontSize:36,opacity:0.4,marginBottom:10}}>🗂️</div>
            <div style={{fontSize:13}}>좌측에서 시험지를 선택하거나 "+ 새 시험지"를 눌러주세요.</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:14,fontWeight:800,color:T.navy}}>{editing.id?"시험지 편집":"새 시험지"}</div>
              <div style={{display:"flex",gap:6}}>
                {editing.id && <button style={{...css.btnGhost,padding:"7px 14px",fontSize:11,color:"#DC2626"}} onClick={()=>remove(editing)}>삭제</button>}
                <button style={{...css.btnGhost,padding:"7px 14px",fontSize:11}} onClick={()=>setEditing(null)}>취소</button>
                <button style={{...css.btnOrange,padding:"7px 14px",fontSize:11}} onClick={save}>저장</button>
              </div>
            </div>

            <div>
              <label style={css.label}>제목</label>
              <input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}
                style={{...css.input,padding:"8px 12px",fontSize:13}}/>
            </div>
            <div>
              <label style={css.label}>설명 (선택)</label>
              <input value={editing.description||""} onChange={e=>setEditing({...editing,description:e.target.value})}
                style={{...css.input,padding:"8px 12px",fontSize:13}}/>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
              <input type="checkbox" checked={editing.is_published}
                onChange={e=>setEditing({...editing,is_published:e.target.checked})}/>
              <span style={{fontSize:13,fontWeight:700,color:T.navy}}>공개 — 학생 목록에 노출</span>
            </label>

            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <label style={{...css.label,marginBottom:0}}>포함된 문항 ({editingQids.length})</label>
                <button style={{...css.btnOutline,padding:"6px 12px",fontSize:11}} onClick={()=>setShowPicker(true)}>+ 문항 추가</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {editingQids.length===0 ? <div style={{fontSize:11,color:T.muted,textAlign:"center",padding:"14px 0"}}>문항을 추가해주세요.</div> :
                  editingQids.map((qid,i)=>{
                    const q=qMap[qid];
                    return (
                      <div key={qid} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",border:`1px solid ${T.border}`,borderRadius:8,background:T.surfaceAlt}}>
                        <div style={{fontSize:11,fontWeight:700,color:T.muted,width:24}}>{i+1}.</div>
                        <Pill color={q?.q_type==="short"?"#0EA5E9":"#A855F7"}>{q?.q_type==="short"?"단답":"객관식"}</Pill>
                        <div style={{flex:1,fontSize:12,color:T.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {q?.prompt || "(삭제된 문항)"}
                        </div>
                        <button style={{...css.btnGhost,padding:"4px 8px",fontSize:11}} onClick={()=>move(i,-1)}>↑</button>
                        <button style={{...css.btnGhost,padding:"4px 8px",fontSize:11}} onClick={()=>move(i,1)}>↓</button>
                        <button style={{...css.btnGhost,padding:"4px 8px",fontSize:11,color:"#DC2626"}}
                          onClick={()=>setEditingQids(prev=>prev.filter(x=>x!==qid))}>✕</button>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
        )}

        {/* 문항 선택 모달 */}
        {showPicker && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
            onClick={()=>setShowPicker(false)}>
            <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:14,padding:20,maxWidth:600,width:"100%",maxHeight:"80vh",display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:14,fontWeight:800,color:T.navy}}>문항 추가</div>
              <input value={pickerKw} onChange={e=>setPickerKw(e.target.value)}
                placeholder="본문 검색" style={{...css.input,padding:"8px 12px",fontSize:13}}/>
              <PickerList list={pickerList} onAdd={addQuestions}/>
              <button style={{...css.btnGhost,padding:"7px 14px",fontSize:12,alignSelf:"flex-end"}} onClick={()=>setShowPicker(false)}>닫기</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const PickerList = ({list, onAdd}) => {
  const [sel, setSel] = useState(new Set());
  const toggle = (id) => setSel(prev=>{ const n=new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:6,minHeight:200}}>
        {list.length===0 ? <div style={{fontSize:12,color:T.muted,textAlign:"center",padding:20}}>일치하는 문항이 없습니다.</div> :
          list.map(q=>(
            <label key={q.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",border:`1px solid ${sel.has(q.id)?T.navy:T.border}`,borderRadius:8,background:sel.has(q.id)?"#EEF2FF":T.surfaceAlt,cursor:"pointer"}}>
              <input type="checkbox" checked={sel.has(q.id)} onChange={()=>toggle(q.id)}/>
              <Pill color={q.q_type==="short"?"#0EA5E9":"#A855F7"}>{q.q_type==="short"?"단답":"객관식"}</Pill>
              <div style={{flex:1,fontSize:12,color:T.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.prompt}</div>
            </label>
          ))
        }
      </div>
      <button style={{...css.btnOrange,padding:"8px 16px",fontSize:12,alignSelf:"flex-end"}}
        disabled={sel.size===0} onClick={()=>onAdd([...sel])}>선택한 {sel.size}개 추가</button>
    </>
  );
};

// ── 배정 관리 ────────────────────────────────────────
const ManjeomAssignTab = ({allProfiles}) => {
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [assignedIds, setAssignedIds] = useState(new Set());
  const [originalIds, setOriginalIds] = useState(new Set());
  const [kw, setKw] = useState("");
  const [saving, setSaving] = useState(false);

  const students = (allProfiles||[]).filter(p=>p.role==="student" && p.approval_status==="approved");

  const loadTests = async () => {
    const {data} = await supabase.from("manjeom_tests").select("id,title,is_published").order("created_at",{ascending:false});
    setTests(data||[]);
  };
  useEffect(()=>{ loadTests(); }, []);

  const loadAssignments = async (testId) => {
    const {data} = await supabase.from("manjeom_assignments").select("student_id").eq("test_id",testId);
    const ids = new Set((data||[]).map(r=>r.student_id));
    setAssignedIds(ids); setOriginalIds(new Set(ids));
  };
  useEffect(()=>{ if(selectedTestId) loadAssignments(selectedTestId); }, [selectedTestId]);

  const toggle = (id) => setAssignedIds(prev=>{ const n=new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n; });

  const save = async () => {
    if(!selectedTestId) return;
    setSaving(true);
    const {error} = await supabase.rpc("set_manjeom_assignments",{
      p_test_id: selectedTestId,
      p_student_ids: [...assignedIds],
    });
    if(error){ alert("저장 실패: "+error.message); setSaving(false); return; }
    setOriginalIds(new Set(assignedIds));
    setSaving(false);
    alert("배정이 저장되었습니다.");
  };

  const filtered = students.filter(s=>!kw || (s.name||"").includes(kw) || (s.email||"").includes(kw));
  const dirty = assignedIds.size !== originalIds.size ||
    [...assignedIds].some(id=>!originalIds.has(id));

  return (
    <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:14,alignItems:"start"}}>
      <Card style={{padding:"14px 16px"}}>
        <div style={{fontSize:13,fontWeight:800,color:T.navy,marginBottom:10}}>시험지 선택</div>
        <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:520,overflowY:"auto"}}>
          {tests.length===0 ? <div style={{fontSize:11,color:T.muted,textAlign:"center",padding:"20px 0"}}>시험지가 없습니다.</div> :
            tests.map(t=>(
              <div key={t.id} onClick={()=>setSelectedTestId(t.id)}
                style={{padding:"10px 12px",borderRadius:8,border:`1px solid ${selectedTestId===t.id?T.navy:T.border}`,
                  background:selectedTestId===t.id?"#EEF2FF":T.surfaceAlt,cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <Pill color={t.is_published?"#16A34A":"#94A3B8"}>{t.is_published?"🟢 공개":"📝 초안"}</Pill>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{t.title}</div>
              </div>
            ))
          }
        </div>
      </Card>

      <Card style={{padding:"18px 20px"}}>
        {!selectedTestId ? (
          <div style={{textAlign:"center",padding:"60px 0",color:T.muted}}>
            <div style={{fontSize:36,opacity:0.4,marginBottom:10}}>👥</div>
            <div style={{fontSize:13}}>좌측에서 시험지를 선택해주세요.</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:14,fontWeight:800,color:T.navy}}>
                배정 학생 ({assignedIds.size}/{students.length})
              </div>
              <button style={{...css.btnOrange,padding:"7px 14px",fontSize:12}}
                disabled={!dirty||saving} onClick={save}>
                {saving ? <Spinner size={12}/> : (dirty ? "저장" : "변경 없음")}
              </button>
            </div>
            <input value={kw} onChange={e=>setKw(e.target.value)} placeholder="학생 이름·이메일 검색"
              style={{...css.input,padding:"8px 12px",fontSize:13}}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:6,maxHeight:480,overflowY:"auto"}}>
              {filtered.map(s=>(
                <label key={s.id} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",
                  border:`1px solid ${assignedIds.has(s.id)?"#16A34A":T.border}`,borderRadius:8,
                  background:assignedIds.has(s.id)?"#F0FDF4":T.surfaceAlt,cursor:"pointer"}}>
                  <input type="checkbox" checked={assignedIds.has(s.id)} onChange={()=>toggle(s.id)}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.navy}}>{s.name||"(이름 없음)"}</div>
                    <div style={{fontSize:9,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.email}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// ── 결과 (시험지별 / 학생별) ──────────────────────────
const ManjeomResultsTab = ({allProfiles}) => {
  const [mode, setMode] = useState("by_test"); // by_test | by_student
  const [tests, setTests] = useState([]);
  const [selTestId, setSelTestId] = useState(null);
  const [selStudentId, setSelStudentId] = useState(null);
  const [byTestRows, setByTestRows] = useState([]);
  const [byStudentRows, setByStudentRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [expanded, setExpanded] = useState(null); // {testId, studentId}
  const [details, setDetails] = useState([]);
  const [questionsMap, setQuestionsMap] = useState({});

  useEffect(()=>{ (async()=>{
    const {data} = await supabase.from("manjeom_tests").select("id,title,is_published").order("created_at",{ascending:false});
    setTests(data||[]);
  })(); }, []);

  useEffect(()=>{ if(mode==="by_test" && selTestId){
    (async()=>{
      const [{data:rows},{data:stat}] = await Promise.all([
        supabase.rpc("get_manjeom_results_by_test",{p_test_id:selTestId}),
        supabase.rpc("get_manjeom_test_stats",{p_test_id:selTestId}),
      ]);
      setByTestRows(rows||[]); setStats((stat&&stat[0])||null);
      // 문항 prompt 미리 캐싱
      const {data:qs} = await supabase.from("manjeom_test_questions").select("question_id,q_order,manjeom_questions(id,prompt,q_type)").eq("test_id",selTestId).order("q_order");
      const map={}; (qs||[]).forEach(r=>{
        const q=r.manjeom_questions; if(q) map[q.id]={...q,q_order:r.q_order};
      });
      setQuestionsMap(map);
      setExpanded(null);
    })();
  } }, [mode, selTestId]);

  useEffect(()=>{ if(mode==="by_student" && selStudentId){
    (async()=>{
      const {data} = await supabase.rpc("get_manjeom_results_by_student",{p_student_id:selStudentId});
      setByStudentRows(data||[]);
      setExpanded(null);
    })();
  } }, [mode, selStudentId]);

  const loadDetails = async (testId, studentId) => {
    const {data} = await supabase.rpc("get_manjeom_attempts_detail",{p_test_id:testId,p_student_id:studentId});
    setDetails(data||[]);
  };

  const students = (allProfiles||[]).filter(p=>p.role==="student"&&p.approval_status==="approved");

  return (
    <div style={{display:"grid",gap:14}}>
      <div style={{display:"flex",gap:8}}>
        {[{k:"by_test",l:"📋 시험지별 보기"},{k:"by_student",l:"👤 학생별 보기"}].map(({k,l})=>(
          <button key={k} onClick={()=>setMode(k)}
            style={{...mode===k?css.btnOrange:css.btnOutline,padding:"7px 14px",fontSize:12,fontWeight:700}}>{l}</button>
        ))}
      </div>

      {mode==="by_test" && (
        <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:14,alignItems:"start"}}>
          <Card style={{padding:"14px 16px"}}>
            <div style={{fontSize:13,fontWeight:800,color:T.navy,marginBottom:10}}>시험지</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:520,overflowY:"auto"}}>
              {tests.map(t=>(
                <div key={t.id} onClick={()=>setSelTestId(t.id)}
                  style={{padding:"10px 12px",borderRadius:8,border:`1px solid ${selTestId===t.id?T.navy:T.border}`,
                    background:selTestId===t.id?"#EEF2FF":T.surfaceAlt,cursor:"pointer",fontSize:12,fontWeight:700,color:T.navy}}>
                  {t.title}
                </div>
              ))}
            </div>
          </Card>
          <div style={{display:"grid",gap:10}}>
            {!selTestId ? <Card style={{padding:30,textAlign:"center",color:T.muted}}>좌측에서 시험지를 선택해주세요.</Card> : (
              <>
                {stats && (
                  <Card style={{padding:"14px 18px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                    {[
                      {l:"배정 학생",v:stats.assigned_count},
                      {l:"통과",v:stats.pass_count},
                      {l:"진행 중",v:stats.in_progress_count},
                      {l:"평균 시도(통과자)",v:stats.avg_pass_attempts??"-"},
                    ].map(({l,v})=>(
                      <div key={l}>
                        <div style={{fontSize:10,color:T.muted,marginBottom:2}}>{l}</div>
                        <div style={{fontSize:18,fontWeight:800,color:T.navy}}>{v}</div>
                      </div>
                    ))}
                  </Card>
                )}
                <Card style={{padding:"14px 18px"}}>
                  <div style={{fontSize:13,fontWeight:800,color:T.navy,marginBottom:10}}>학생별 결과</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {byTestRows.length===0 ? <div style={{fontSize:11,color:T.muted,textAlign:"center",padding:20}}>배정된 학생이 없습니다.</div> :
                      byTestRows.map(r=>{
                        const expandKey = `${selTestId}-${r.student_id}`;
                        const isExp = expanded===expandKey;
                        return (
                          <div key={r.student_id}>
                            <div onClick={()=>{ if(isExp){setExpanded(null);} else {setExpanded(expandKey); loadDetails(selTestId,r.student_id);} }}
                              style={{display:"grid",gridTemplateColumns:"1fr 80px 90px 140px 80px",gap:8,alignItems:"center",
                                padding:"8px 10px",borderRadius:8,background:isExp?"#EEF2FF":"transparent",cursor:"pointer",
                                borderBottom:`1px solid ${T.border}`}}>
                              <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{r.student_name}</div>
                              <div style={{fontSize:12,color:T.muted}}>{r.attempt_count}회</div>
                              <Pill color={r.is_passed?"#16A34A":"#94A3B8"}>{r.is_passed?`✅ ${r.pass_attempt_no}회`:"🔄 진행"}</Pill>
                              <div style={{fontSize:11,color:T.muted}}>{r.last_attempt_at?new Date(r.last_attempt_at).toLocaleString("ko-KR"):"-"}</div>
                              <div style={{fontSize:11,color:T.navy,textAlign:"right"}}>{isExp?"▲ 접기":"▼ 상세"}</div>
                            </div>
                            {isExp && (
                              <div style={{padding:"10px 14px",background:T.surfaceAlt,borderRadius:8,marginTop:4,marginBottom:8}}>
                                {details.length===0 ? <div style={{fontSize:11,color:T.muted}}>시도 기록이 없습니다.</div> :
                                  details.map(d=>(
                                    <div key={d.attempt_no} style={{fontSize:11,marginBottom:6,padding:"6px 8px",background:T.surface,borderRadius:6}}>
                                      <div style={{fontWeight:700,color:T.navy,marginBottom:3}}>
                                        시도 {d.attempt_no} · {new Date(d.submitted_at).toLocaleString("ko-KR")} ·
                                        <span style={{color:d.is_pass?"#16A34A":"#DC2626",marginLeft:6}}>{d.is_pass?"통과":"미통과"}</span>
                                      </div>
                                      <div style={{color:T.muted}}>
                                        틀린 문항: {(d.wrong_q_ids||[]).length===0 ? "없음" :
                                          (d.wrong_q_ids||[]).map(qid=>{
                                            const q=questionsMap[qid]; return q?`Q${q.q_order}`:"?";
                                          }).join(", ")}
                                      </div>
                                    </div>
                                  ))
                                }
                              </div>
                            )}
                          </div>
                        );
                      })
                    }
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {mode==="by_student" && (
        <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:14,alignItems:"start"}}>
          <Card style={{padding:"14px 16px"}}>
            <div style={{fontSize:13,fontWeight:800,color:T.navy,marginBottom:10}}>학생</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:520,overflowY:"auto"}}>
              {students.map(s=>(
                <div key={s.id} onClick={()=>setSelStudentId(s.id)}
                  style={{padding:"8px 12px",borderRadius:8,border:`1px solid ${selStudentId===s.id?T.navy:T.border}`,
                    background:selStudentId===s.id?"#EEF2FF":T.surfaceAlt,cursor:"pointer",fontSize:12,fontWeight:700,color:T.navy}}>
                  {s.name}
                </div>
              ))}
            </div>
          </Card>
          <Card style={{padding:"14px 18px"}}>
            {!selStudentId ? <div style={{padding:30,textAlign:"center",color:T.muted}}>좌측에서 학생을 선택해주세요.</div> : (
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <div style={{fontSize:13,fontWeight:800,color:T.navy,marginBottom:10}}>배정된 시험지</div>
                {byStudentRows.length===0 ? <div style={{fontSize:11,color:T.muted,textAlign:"center",padding:20}}>배정된 시험지가 없습니다.</div> :
                  byStudentRows.map(r=>(
                    <div key={r.test_id} style={{display:"grid",gridTemplateColumns:"1fr 80px 100px 140px",gap:8,alignItems:"center",
                      padding:"8px 10px",borderBottom:`1px solid ${T.border}`}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{r.title}</div>
                      <div style={{fontSize:12,color:T.muted}}>{r.attempt_count}회</div>
                      <Pill color={r.is_passed?"#16A34A":"#94A3B8"}>{r.is_passed?`✅ ${r.pass_attempt_no}회`:"🔄 진행"}</Pill>
                      <div style={{fontSize:11,color:T.muted}}>{r.last_attempt_at?new Date(r.last_attempt_at).toLocaleString("ko-KR"):"-"}</div>
                    </div>
                  ))
                }
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

// ── 메인 ────────────────────────────────────────────
const ManjeomView = ({onRefresh, allProfiles}) => {
  const [tab, setTab] = useState("manage"); // manage | results
  const [subTab, setSubTab] = useState("questions"); // questions | tests | assign

  return (
    <div style={{display:"grid",gap:14}}>
      <div style={{fontSize:18,fontWeight:800,color:T.navy}}>💯 만점 테스트</div>

      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        {[
          {k:"manage", l:"📝 만점 테스트 관리"},
          {k:"results", l:"📊 만점 테스트 결과"},
        ].map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{...tab===k?css.btnOrange:css.btnOutline,padding:"7px 16px",fontSize:13,fontWeight:700}}>{l}</button>
        ))}
      </div>

      {tab==="manage" && (
        <>
          <div style={{display:"flex",gap:6,borderBottom:`1px solid ${T.border}`,paddingBottom:0}}>
            {[
              {k:"questions",l:"📚 문항 관리"},
              {k:"tests",l:"🗂️ 시험지 관리"},
              {k:"assign",l:"👥 배정 관리"},
            ].map(({k,l})=>(
              <button key={k} onClick={()=>setSubTab(k)}
                style={{background:"transparent",border:"none",borderBottom:`3px solid ${subTab===k?T.orange:"transparent"}`,
                  padding:"8px 14px",fontSize:13,fontWeight:700,color:subTab===k?T.navy:T.muted,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
          {subTab==="questions" && <ManjeomQuestionsTab/>}
          {subTab==="tests"     && <ManjeomTestsTab/>}
          {subTab==="assign"    && <ManjeomAssignTab allProfiles={allProfiles}/>}
        </>
      )}

      {tab==="results" && <ManjeomResultsTab allProfiles={allProfiles}/>}
    </div>
  );
};

// ══════════════════════════════════════════════════════
// STUDENT/PARENT: 만점 테스트 (시험지 풀이)
// ══════════════════════════════════════════════════════
const ManjeomStudentView = ({profile}) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // { test, questions, last_answers, is_passed }
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // {type:"ok"|"err", text}

  const isParentView = profile.id !== undefined; // dummy — profile prop always present
  const studentId = profile.id;

  const loadList = async () => {
    setLoading(true);
    // 본인이면 get_my_manjeom_tests, 학부모/관리자가 자녀 보는 경우 get_child_manjeom_tests
    const {data, error} = await supabase.rpc("get_child_manjeom_tests",{p_child_id:studentId});
    if(error){ console.error(error); setTests([]); }
    else setTests(data||[]);
    setLoading(false);
  };
  useEffect(()=>{ loadList(); }, [studentId]);

  const open = async (testId) => {
    const {data, error} = await supabase.rpc("get_my_manjeom_test_detail",{p_test_id:testId,p_student_id:studentId});
    if(error || !data){ alert("시험지를 불러오지 못했습니다."); return; }
    setActive(data);
    setAnswers(data.last_answers || {});
    setFeedback(null);
  };

  const encourageByAttempt = (n) => {
    if(n <= 1) return { title:"아직 만점이 아니에요", body:"의심되는 답부터 차분히 다시 살펴봐 주세요." };
    if(n === 2) return { title:"한 번 더 도전!", body:"이번엔 잠깐 호흡 고르고 한 문제씩 천천히 다시 봐 볼까요?" };
    if(n === 3) return { title:"좋아요, 잘하고 있어요", body:"답을 너무 빨리 바꾸지 말고, 왜 그 답인지 한 번 더 생각해 봐요." };
    if(n <= 5) return { title:"거의 다 왔어요", body:"틀린 문제는 적어도 한 문제 이상이에요. 처음부터 다시 한 번 천천히 짚어보면 보일 거예요." };
    if(n <= 8) return { title:"잠깐 쉬어가도 돼요", body:"눈을 잠깐 쉬게 한 다음, 새 마음으로 한 번 더 봐 볼까요? 만점은 가까이 있어요." };
    return { title:"포기하지 말아요", body:"여기까지 풀어낸 것만으로도 충분히 멋져요. 천천히, 한 문제씩, 한 번만 더 함께 봐 봐요." };
  };

  const submit = async () => {
    setSubmitting(true);
    const {data, error} = await supabase.rpc("submit_manjeom_attempt",{p_test_id:active.test.id,p_answers:answers});
    setSubmitting(false);
    if(error){ alert("제출 실패: "+error.message); return; }
    if(data.is_pass){
      setFeedback({
        type:"ok",
        attempt_no: data.attempt_no,
        title: data.attempt_no === 1 ? "한 번에 통과!" : `${data.attempt_no}번 만에 통과!`,
        body: data.attempt_no === 1
          ? "완벽해요. 한 번에 만점, 정말 잘했어요!"
          : "포기하지 않고 끝까지 풀어낸 게 진짜 멋져요. 만점 축하해요!",
      });
      await loadList();
    } else {
      const m = encourageByAttempt(data.attempt_no);
      setFeedback({type:"err", attempt_no:data.attempt_no, title:m.title, body:m.body});
    }
  };

  if(active){
    const isPassed = active.is_passed;
    return (
      <div style={{display:"grid",gap:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button style={{...css.btnGhost,padding:"7px 14px",fontSize:12}} onClick={()=>{setActive(null); setFeedback(null);}}>← 목록</button>
          <div style={{fontSize:18,fontWeight:800,color:T.navy}}>{active.test.title}</div>
          {isPassed && <Pill color="#16A34A">✅ 통과</Pill>}
        </div>
        {active.test.description && <div style={{fontSize:13,color:T.muted}}>{active.test.description}</div>}

        {feedback && (
          <div onClick={()=>setFeedback(null)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,
              display:"flex",alignItems:"center",justifyContent:"center",padding:20,
              animation:"fadeIn 0.2s ease"}}>
            <div onClick={e=>e.stopPropagation()}
              style={{background:T.surface,borderRadius:16,padding:"32px 32px 28px",maxWidth:440,width:"100%",
                textAlign:"center",boxShadow:"0 12px 40px rgba(0,0,0,0.3)",
                border:`2px solid ${feedback.type==="ok"?"#86EFAC":"#FCA5A5"}`}}>
              <div style={{fontSize:54,marginBottom:8}}>{feedback.type==="ok"?"🎉":"💭"}</div>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:6,letterSpacing:"0.04em"}}>
                시도 {feedback.attempt_no}회
              </div>
              <div style={{fontSize:18,fontWeight:800,color:feedback.type==="ok"?"#16A34A":T.navy,marginBottom:10}}>
                {feedback.title}
              </div>
              <div style={{fontSize:13,color:T.muted,lineHeight:1.6,marginBottom:22,whiteSpace:"pre-wrap"}}>
                {feedback.body}
              </div>
              {feedback.type==="err" ? (
                <button style={{...css.btnOrange,padding:"11px 30px",fontSize:13}} onClick={()=>setFeedback(null)}>
                  다시 풀기
                </button>
              ) : (
                <button style={{...css.btnOrange,padding:"11px 30px",fontSize:13}}
                  onClick={()=>{ setFeedback(null); setActive(null); }}>
                  목록으로
                </button>
              )}
            </div>
          </div>
        )}

        <Card style={{padding:"18px 20px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:18}}>
            {(active.questions||[]).map((q,i)=>(
              <div key={q.id}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <div style={{fontSize:13,fontWeight:800,color:T.navy}}>Q{i+1}.</div>
                  <Pill color={q.q_type==="short"?"#0EA5E9":"#A855F7"}>{q.q_type==="short"?"단답":"객관식"}</Pill>
                </div>
                <div style={{fontSize:14,color:T.navy,whiteSpace:"pre-wrap",marginBottom:10}}>{q.prompt}</div>
                {q.image_url && (
                  <div style={{marginBottom:10}}>
                    <img src={q.image_url} alt={`Q${i+1}`} style={{maxWidth:"100%",height:"auto",borderRadius:8,border:`1px solid ${T.border}`}}/>
                  </div>
                )}
                {q.q_type==="short" ? (
                  <input value={answers[q.id]||""} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}
                    disabled={isPassed}
                    placeholder="정답 입력"
                    style={{...css.input,padding:"10px 14px",maxWidth:400}}/>
                ) : (() => {
                  const choices = q.choices || [];
                  const labelOnly = choices.every((c,ci)=> !c || c === ("①②③④⑤"[ci]||String(ci+1)));
                  // 학생 답은 "①,③" 형식 정렬된 콤마 결합 문자열. 다중 선택 가능 (체크박스).
                  const selectedSet = new Set(
                    String(answers[q.id]||"").split(",").map(s=>s.trim()).filter(Boolean)
                  );
                  const toggle = (val) => {
                    if(isPassed) return;
                    const next = new Set(selectedSet);
                    if(next.has(val)) next.delete(val); else next.add(val);
                    // 보기 순서 기준으로 정렬해 콤마 결합
                    const sortedVal = choices.filter(c => next.has(c)).join(",");
                    setAnswers(a => ({...a, [q.id]: sortedVal}));
                  };
                  return labelOnly ? (
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {choices.map((c,ci)=>{
                        const display = c || ("①②③④⑤"[ci]||String(ci+1));
                        const checked = selectedSet.has(display);
                        return (
                          <label key={ci} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                            padding:"10px 18px",minWidth:64,
                            border:`2px solid ${checked?T.navy:T.border}`,borderRadius:10,
                            background:checked?"#EEF2FF":T.surfaceAlt,cursor:isPassed?"default":"pointer"}}>
                            <input type="checkbox" checked={checked}
                              disabled={isPassed}
                              onChange={()=>toggle(display)}/>
                            <span style={{fontSize:16,fontWeight:800,color:T.navy}}>{display}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {choices.map((c,ci)=>{
                        const checked = selectedSet.has(c);
                        return (
                          <label key={ci} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",
                            border:`1px solid ${checked?T.navy:T.border}`,borderRadius:8,
                            background:checked?"#EEF2FF":T.surfaceAlt,cursor:isPassed?"default":"pointer"}}>
                            <input type="checkbox" checked={checked}
                              disabled={isPassed}
                              onChange={()=>toggle(c)}/>
                            <span style={{fontSize:11,color:T.muted,width:18}}>{"①②③④⑤"[ci]||(ci+1)}</span>
                            <span style={{fontSize:13,color:T.navy}}>{c}</span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          {!isPassed && (
            <div style={{marginTop:24,display:"flex",justifyContent:"flex-end"}}>
              <button style={{...css.btnOrange,padding:"12px 32px",fontSize:14,fontWeight:800}}
                disabled={submitting} onClick={submit}>
                {submitting ? <Spinner size={14} color="#fff"/> : "제출"}
              </button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div style={{display:"grid",gap:14}}>
      <div style={{fontSize:18,fontWeight:800,color:T.navy}}>💯 만점 테스트</div>
      <div style={{fontSize:13,color:T.muted}}>
        시험지의 <b style={{color:T.navy}}>모든 문항을 정답</b>으로 맞춰야 통과합니다. 한 개라도 틀리면 다시 풀어주세요 (어느 문제가 틀렸는지는 알려주지 않습니다).
      </div>

      {loading ? <Card style={{padding:30,textAlign:"center"}}><Spinner/></Card> :
        tests.length===0 ? (
          <Card style={{padding:30,textAlign:"center",color:T.muted}}>
            <div style={{fontSize:36,opacity:0.4,marginBottom:10}}>💯</div>
            <div style={{fontSize:13}}>배정된 시험지가 없습니다.</div>
          </Card>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
            {tests.map(t=>(
              <div key={t.test_id} onClick={()=>open(t.test_id)}
                style={{padding:"16px 18px",borderRadius:12,border:`1px solid ${T.border}`,background:T.surface,
                  cursor:"pointer",boxShadow:"0 1px 6px rgba(25,29,84,0.06)",transition:"transform .15s"}}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  {t.is_passed ? <Pill color="#16A34A">✅ 통과</Pill> :
                    t.attempt_count>0 ? <Pill color="#F59E0B">🔄 {t.attempt_count}회 시도</Pill> :
                    <Pill color="#94A3B8">시작 전</Pill>}
                </div>
                <div style={{fontSize:14,fontWeight:800,color:T.navy,marginBottom:4}}>{t.title}</div>
                {t.description && <div style={{fontSize:11,color:T.muted,marginBottom:6}}>{t.description}</div>}
                <div style={{fontSize:11,color:T.muted}}>문항 {t.question_count}개{t.last_attempt_at?` · 최근 ${new Date(t.last_attempt_at).toLocaleDateString("ko-KR")}`:""}</div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
};

// ══════════════════════════════════════════════════════
// LOG HISTORY
// ══════════════════════════════════════════════════════
const LogHistory = ({logs, onDelete, isAdmin, allProfiles}) => {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const sorted=[...logs].sort((a,b)=>b.date.localeCompare(a.date));
  const nameMap=Object.fromEntries((allProfiles||[]).map(p=>[p.id,p.name]));
  if(sorted.length===0) return <div style={{textAlign:"center",padding:"80px 20px",color:T.muted,fontSize:14}}>학습 기록이 없습니다.</div>;
  const grouped={};sorted.forEach(log=>{if(!grouped[log.date])grouped[log.date]=[];grouped[log.date].push(log);});
  const dates=Object.keys(grouped).sort((a,b)=>b.localeCompare(a));
  const totalPages=Math.ceil(dates.length/PAGE_SIZE);
  const pagedDates=dates.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const LogCard=({log})=>{
    const ei=log.engram_index||0;
    const{g,c}=gradeInfo(ei);
    return(
      <Card style={{marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
        <div style={{minWidth:44,textAlign:"center"}}>
          <Pill color={c}>{g}</Pill>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",gap:6,marginBottom:5,alignItems:"center",flexWrap:"wrap"}}>
            {isAdmin&&<span style={{fontSize:12,color:T.orange,fontWeight:700}}>{nameMap[log.uid]||"—"}</span>}
            <span style={{fontSize:14,fontWeight:700,color:T.navy}}>{log.subject}</span>
            {log.subject==="수학"?(
  <>{log.q_basic>0&&<Pill color={T.navy}>기본 {log.q_basic}</Pill>}{log.q_mid>0&&<Pill color={T.orange}>응용 {log.q_mid}</Pill>}{log.q_adv>0&&<Pill color="#7C3AED">심화 {log.q_adv}</Pill>}</>
):(
  (log.q_basic||log.question_count)>0&&<Pill color={T.navy}>{log.q_basic||log.question_count}문항</Pill>
)}
          </div>
          <div style={{display:"flex",gap:10,fontSize:11,color:T.muted,flexWrap:"wrap"}}>
            <span>전략 {log.strategy_score}</span>
            <span>효율 {log.efficiency_index}</span>
            <span>메타인지 {(log.metacognition_accuracy||0).toFixed(1)}%</span>
            <span>{log.question_count}문항 · {log.net_time}분</span>
          </div>
        </div>
        <NavyNum value={ei.toFixed(1)} unit="EI" size={20} color={EI_COLOR(ei)}/>
        {isAdmin&&<button onClick={()=>{if(window.confirm(`${log.date} · ${log.subject} 기록을 삭제하시겠습니까?\n삭제 후 복구가 불가능합니다.`)) onDelete(log.id);}} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18,padding:4,flexShrink:0}}>✕</button>}
      </Card>
    );
  };
  return(
    <div>
      {/* 상단 요약 + 페이지 정보 */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,padding:"10px 14px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:12}}>
        <span style={{fontSize:13,color:T.muted}}>총 <strong style={{color:T.navy}}>{sorted.length}건</strong> · <strong style={{color:T.navy}}>{dates.length}일</strong></span>
        {totalPages>1&&<span style={{fontSize:12,color:T.muted}}>{page} / {totalPages} 페이지</span>}
      </div>

      {pagedDates.map(date=>(
        <div key={date} style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:T.muted,marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:6}}>
            {HI.calendar(12,T.muted)} {date}
            <span style={{fontSize:11,color:T.border,fontWeight:400}}>({grouped[date].length}건)</span>
          </div>
          {grouped[date].map(log=><LogCard key={log.id} log={log}/>)}
        </div>
      ))}

      {/* 페이지네이션 */}
      {totalPages>1&&(
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:6,marginTop:8,paddingTop:16,borderTop:`1px solid ${T.border}`}}>
          <button onClick={()=>{setPage(p=>Math.max(1,p-1));window.scrollTo(0,0);}}
            disabled={page===1}
            style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,color:page===1?T.border:T.navy,cursor:page===1?"default":"pointer",fontSize:13,fontWeight:700}}>◀</button>
          {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
            <button key={p} onClick={()=>{setPage(p);window.scrollTo(0,0);}}
              style={{width:34,height:34,borderRadius:8,border:`1px solid ${page===p?T.navy:T.border}`,
                background:page===p?T.navy:T.surface,color:page===p?"#fff":T.muted,
                cursor:"pointer",fontSize:13,fontWeight:page===p?800:400}}>{p}</button>
          ))}
          <button onClick={()=>{setPage(p=>Math.min(totalPages,p+1));window.scrollTo(0,0);}}
            disabled={page===totalPages}
            style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,color:page===totalPages?T.border:T.navy,cursor:page===totalPages?"default":"pointer",fontSize:13,fontWeight:700}}>▶</button>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════
// EI SETUP MODAL — 첫 로그인 목표 EI 설정
// ══════════════════════════════════════════════════════
const GRADE_MIN = {S:93,A:81,B:66,C:51,D:50};
const GRADE_NEXT = {D:"C",C:"B",B:"A",A:"S",S:null};
const EI_GRADES_DEF = [
  {grade:"S",min:93,max:100,color:"#16A34A",desc:"매 회차 집중이 흐트러지지 않고, 내가 아는 것과 모르는 것을 정확히 구분하는 상태.",sub:"현실적으로 달성하기 매우 어렵지만, 이 수준을 목표로 삼는 것 자체가 성장의 출발점입니다."},
  {grade:"A",min:81,max:92,color:"#2563EB",desc:"배운 내용을 정해진 방식대로 꾸준히 실천하고, 자기 실력을 객관적으로 파악하는 단계.",sub:"상위 10% 수준의 학습 밀도. 하루하루 루틴을 성실히 이어가는 학생이 도달하는 목표입니다."},
  {grade:"B",min:66,max:80,color:"#111827",desc:"학습 루틴이 잡혀가고 있지만, 가끔 집중이 흔들리거나 자신의 실력을 과대·과소평가하는 경향이 있는 상태.",sub:"성실하게 공부하는 대부분의 학생이 처음 도달하는 구간입니다. 여기서 A로 올리는 것이 핵심 과제입니다."},
  {grade:"C",min:51,max:65,color:"#F97316",desc:"공부 시간은 채우고 있지만, 방법이 습관화되지 않았거나 틀린 문제를 반복하는 패턴이 있는 상태.",sub:"지금 당장 높은 목표보다 루틴을 먼저 잡는 것이 중요한 시점입니다."},
  {grade:"D",min:0,max:50,color:"#DC2626",desc:"공부 방법·집중도·자기 파악 모두 아직 자리를 잡지 못한 상태.",sub:"지금 수준을 솔직하게 인정하고 시작하는 것이 가장 빠른 방법입니다."},
];

const GradeCards = ({selected, onSelect}) => (
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    {EI_GRADES_DEF.map(g=>(
      <div key={g.grade} onClick={()=>onSelect(g.grade)}
        style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px",borderRadius:10,cursor:"pointer",
          border:`2px solid ${selected===g.grade?g.color:"transparent"}`,
          background:selected===g.grade?g.color+"12":T.surfaceAlt,transition:"all 0.15s"}}>
        <div style={{minWidth:28,height:28,borderRadius:8,background:g.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",flexShrink:0}}>{g.grade}</div>
        <div>
          <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:3}}>
            <span style={{fontSize:12,fontWeight:800,color:g.color,whiteSpace:"nowrap"}}>{g.min}~{g.max}점</span>
            <span style={{fontSize:11,color:T.muted}}>|</span>
            <span style={{fontSize:11,fontWeight:700,color:T.textMid}}>{g.desc}</span>
          </div>
          <div style={{fontSize:11,color:T.muted,lineHeight:1.6}}>{g.sub}</div>
        </div>
      </div>
    ))}
  </div>
);

const EISetupModal = ({profile, logs=[], onSave}) => {
  const [selected, setSelected] = useState(gradeInfo(profile?.target_ei||85).g);
  const [saving, setSaving] = useState(false);

  // 자동 추천
  const recent7 = logs.filter(l=>new Date(l.date)>=new Date(Date.now()-7*86400000));
  const avg7 = recent7.length>0?(recent7.reduce((s,l)=>s+l.engramIndex,0)/recent7.length):null;
  const curGrade = avg7?gradeInfo(avg7).g:null;
  const sugGrade = curGrade?GRADE_NEXT[curGrade]:null;
  const showRec = logs.length>=3 && sugGrade;
  const sugColor = sugGrade?EI_GRADES_DEF.find(g=>g.grade===sugGrade)?.color:null;

  const save = async()=>{
    setSaving(true);
    const targetEI = GRADE_MIN[selected];
    await supabase.from("profiles").update({target_ei:targetEI,updated_at:new Date().toISOString()}).eq("id",profile.id);
    setSaving(false);
    onSave(targetEI);
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(25,29,84,0.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
      <Card style={{width:"100%",maxWidth:480}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:22,fontWeight:900,color:T.navy,marginBottom:4}}>목표 등급을 선택해주세요</div>
          <div style={{fontSize:13,color:T.muted}}>목표 등급을 선택하면 EI 기준점이 자동으로 설정됩니다.</div>
        </div>

        {/* 자동 추천 배너 */}
        {showRec&&(
          <div style={{background:sugColor+"12",border:`1px solid ${sugColor}40`,borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
            <div>
              <div style={{fontSize:12,fontWeight:800,color:sugColor,marginBottom:2}}>✨ 추천 목표</div>
              <div style={{fontSize:12,color:T.textMid}}>
                최근 7일 평균 <strong>{avg7.toFixed(1)}점</strong> ({curGrade}등급) → <strong style={{color:sugColor}}>{sugGrade}등급</strong> ({GRADE_MIN[sugGrade]}점) 추천
              </div>
            </div>
            <button onClick={()=>setSelected(sugGrade)}
              style={{padding:"6px 12px",borderRadius:8,border:"none",background:sugColor,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
              적용
            </button>
          </div>
        )}

        <div style={{marginBottom:16}}>
          <GradeCards selected={selected} onSelect={setSelected}/>
        </div>

        {/* 선택된 등급 요약 */}
        {selected&&(()=>{
          return(
            <div style={{background:T.grad,borderRadius:10,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>선택한 목표 등급</span>
              <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                <span style={{fontSize:28,fontWeight:900,color:"#fff"}}>{selected}</span>
                <span style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>({GRADE_MIN[selected]}점 이상)</span>
              </div>
            </div>
          );
        })()}

        <div style={{background:T.orangePale,border:`1px solid ${T.orange}30`,borderRadius:10,padding:"10px 14px",fontSize:12,color:T.textMid,marginBottom:16}}>
          💡 목표는 나중에 프로필에서 언제든지 변경할 수 있습니다.
        </div>

        <button onClick={save} disabled={saving||!selected}
          style={{...css.btnPrimary,width:"100%",padding:"13px 0",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {saving?<><Spinner size={18} color="#fff"/>저장 중...</>:"목표 설정 완료 →"}
        </button>
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// PROFILE MODAL
// ══════════════════════════════════════════════════════
const ProfileModal = ({profile, onClose, onSave, onDelete}) => {
  const [name, setName]             = useState(profile.name||"");
  const [birthYear, setBirthYear]   = useState(profile.birth_year ? String(profile.birth_year) : "");
  const [birthMonth, setBirthMonth] = useState(profile.birth_month ? String(profile.birth_month) : "");
  const [birthDay, setBirthDay]     = useState(profile.birth_day ? String(profile.birth_day) : "");
  const [target, setTarget]       = useState(gradeInfo(profile.target_ei||85).g);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url||"");
  const [uploading, setUploading] = useState(false);
  const [newPw, setNewPw]         = useState("");
  const [newPwC, setNewPwC]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [done, setDone]           = useState(false);
  const [err, setErr]             = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [cropSrc, setCropSrc]     = useState(null);
  const [crop, setCrop]           = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if(!file) return;
    setErr("");
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e) => {
    const {width,height} = e.currentTarget;
    const c = centerCrop(makeAspectCrop({unit:"%",width:80},1,width,height),width,height);
    setCrop(c); setCompletedCrop(c);
  };

  const compressAndUpload = async () => {
    if(!completedCrop || !imgRef.current) return;
    setUploading(true); setErr("");
    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    const canvas = document.createElement("canvas");
    const size = Math.min(800, completedCrop.width * scaleX);
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img,
      completedCrop.x*scaleX, completedCrop.y*scaleY,
      completedCrop.width*scaleX, completedCrop.height*scaleY,
      0, 0, size, size
    );
    const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.82));
    const path = `${profile.id}.jpg`;
    const {error:upErr} = await supabase.storage.from("avatars").upload(path, blob, {upsert:true, contentType:"image/jpeg"});
    if(upErr){ setErr("업로드 실패: "+upErr.message); setUploading(false); return; }
    const {data:{publicUrl}} = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl+"?t="+Date.now());
    setCropSrc(null); setUploading(false);
  };

  const save = async () => {
    setErr("");
    if(newPw){
      const pwRegex=/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
      if(newPw!==newPwC){ setErr("비밀번호가 일치하지 않습니다."); return; }
      if(!pwRegex.test(newPw)){ setErr("대소문자+특수문자 포함 8자 이상이어야 합니다."); return; }
    }
    setSaving(true);
    const targetEI = GRADE_MIN[target]||85;
    const by = birthYear?Number(birthYear):null, bm = birthMonth?Number(birthMonth):null, bd = birthDay?Number(birthDay):null;
    const newGrade = calcGrade(by, bm) || profile.grade;
    await supabase.from("profiles").update({name, grade: newGrade, birth_year:by, birth_month:bm, birth_day:bd, target_ei:targetEI, avatar_url:avatarUrl, updated_at:new Date().toISOString()}).eq("id", profile.id);
    if(newPw){
      const {error:pwErr} = await supabase.auth.updateUser({password:newPw});
      if(pwErr){
        setSaving(false);
        const m = pwErr.message?.toLowerCase()||"";
        if(m.includes("same password")||m.includes("different from")) setErr("현재 비밀번호와 동일합니다. 다른 비밀번호를 입력해주세요.");
        else setErr("비밀번호 변경 실패: "+pwErr.message);
        return;
      }
    }
    setSaving(false);
    setDone(true);
    setTimeout(()=>onSave({...profile,name,grade:newGrade,birth_year:by,birth_month:bm,birth_day:bd,target_ei:GRADE_MIN[target]||85,avatar_url:avatarUrl}), 800);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(25,29,84,0.45)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <Card style={{width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{fontSize:17,fontWeight:800,color:T.navy}}>프로필 수정</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:T.muted,cursor:"pointer",lineHeight:1}}>×</button>
        </div>

        {/* 크롭 모달 */}
        {cropSrc&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:10000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{background:T.surface,borderRadius:16,padding:20,maxWidth:480,width:"100%"}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>사진 영역 선택</div>
              <div style={{maxHeight:"60vh",overflowY:"auto",marginBottom:14}}>
                <ReactCrop crop={crop} onChange={c=>setCrop(c)} onComplete={c=>setCompletedCrop(c)} aspect={1} circularCrop={false}>
                  <img ref={imgRef} src={cropSrc} onLoad={onImageLoad} style={{maxWidth:"100%"}} alt="crop"/>
                </ReactCrop>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setCropSrc(null)} style={{...css.btnGhost,flex:1}}>취소</button>
                <button onClick={compressAndUpload} disabled={uploading} style={{...css.btnPrimary,flex:2,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {uploading?<><Spinner size={16} color="#fff"/>업로드 중...</>:"적용"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 프로필 사진 */}
        <div style={{textAlign:"center",marginBottom:20}}>
          <label style={{cursor:"pointer",display:"inline-block",position:"relative"}}>
            <input type="file" accept="image/*" onChange={onFileSelect} style={{display:"none"}}/>
            <div style={{width:80,height:80,borderRadius:24,background:avatarUrl?"transparent":T.grad,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:32,boxShadow:"0 4px 12px rgba(25,29,84,0.2)",overflow:"hidden",border:`2px solid ${T.border}`}}>
              {uploading
                ? <Spinner size={28} color={T.white}/>
                : avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : (profile.role==="admin" ? HI.user(28,"#fff") : HI.cap(28,"#fff"))
              }
            </div>
            <div style={{position:"absolute",bottom:0,right:0,width:24,height:24,background:T.orange,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>
              {HI.camera(13,"#fff")}
            </div>
          </label>
          <div style={{fontSize:11,color:T.muted,marginTop:8}}>사진 클릭하여 변경</div>
          <div style={{fontSize:12,color:T.muted,marginTop:2}}>
            {profile.role==="admin"?"관리자 계정":profile.role==="parent"?"학부모 계정":"학생 계정"} · 가입 {profile.created_at?.slice(0,10)||""}
          </div>
        </div>

        <div style={{display:"grid",gap:14,marginBottom:16}}>
          <div>
            <label style={css.label}>이름</label>
            <input value={name} onChange={e=>setName(e.target.value)} style={css.input}/>
          </div>
          {profile.role==="student"&&<>
            <div>
              <label style={css.label}>생년월일</label>
              <BirthInput year={birthYear} month={birthMonth} day={birthDay}
                onYear={setBirthYear} onMonth={setBirthMonth} onDay={setBirthDay}
                showGrade={true}/>
            </div>
            <div>
              <label style={css.label}>목표 등급</label>
              <GradeCards selected={target} onSelect={setTarget}/>
            </div>
          </>}

          {/* 비밀번호 변경 */}
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:14}}>
            <label style={{...css.label,marginBottom:10}}>비밀번호 변경 <span style={{fontWeight:400,color:T.muted}}>(변경 시에만 입력)</span></label>
            <div style={{display:"grid",gap:10}}>
              <input name="new-password" type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="새 비밀번호 (대소문자+특수문자 8자↑)" autoComplete="new-password" style={css.input}/>
              <input name="new-password-confirm" type="password" value={newPwC} onChange={e=>setNewPwC(e.target.value)} placeholder="새 비밀번호 확인" autoComplete="new-password" style={css.input}/>
            </div>
          </div>
        </div>

        {err&&<div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:T.danger,marginBottom:12}}>{err}</div>}
        {done
          ? <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,padding:"12px 16px",textAlign:"center",color:T.success,fontWeight:700,fontSize:14}}>✅ 저장 완료!</div>
          : <div style={{display:"flex",gap:10}}>
              <button onClick={onClose} style={{...css.btnGhost,flex:1}}>취소</button>
              <button onClick={save} disabled={saving||uploading} style={{...css.btnPrimary,flex:2,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {saving?<><Spinner size={16} color="#fff"/>저장 중...</>:"저장"}
              </button>
            </div>}

        {/* 계정 탈퇴 */}
        {profile.role !== "admin" && (
          <div style={{marginTop:24,paddingTop:16,borderTop:`1px solid ${T.border}`}}>
            {!deleteConfirm ? (
              <button onClick={()=>setDeleteConfirm(true)}
                style={{background:"none",border:"none",color:T.muted,fontSize:12,cursor:"pointer",textDecoration:"underline",padding:0}}>
                계정 탈퇴 신청
              </button>
            ) : (
              <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"14px"}}>
                <div style={{fontSize:13,fontWeight:700,color:T.danger,marginBottom:6}}>정말 탈퇴하시겠어요?</div>
                <div style={{fontSize:12,color:"#666",lineHeight:1.6,marginBottom:12}}>
                  탈퇴 신청 후 관리자가 7일 이내 처리합니다.<br/>
                  탈퇴 시 모든 학습 데이터가 삭제되며 복구할 수 없습니다.
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setDeleteConfirm(false)} style={{...css.btnGhost,flex:1,fontSize:12,padding:"8px 0"}}>취소</button>
                  <button onClick={async()=>{
                    setDeleting(true);
                    await supabase.from("profiles").update({approval_status:"deletion_requested"}).eq("id",profile.id);
                    setDeleting(false);
                    if(onDelete) onDelete();
                  }} disabled={deleting}
                    style={{flex:2,background:T.danger,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",padding:"8px 0",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    {deleting?<><Spinner size={14} color="#fff"/>처리 중...</>:"탈퇴 신청"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// MOBILE BOTTOM NAV
// ══════════════════════════════════════════════════════
const BottomNav = ({nav,view,showInput,onNavigate,isAdmin}) => (
  <div style={{position:"fixed",bottom:0,left:0,right:0,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:50,paddingBottom:"env(safe-area-inset-bottom)"}}>
    {nav.filter(n=>!n.header).map(n=>(
      <button key={n.key} onClick={()=>onNavigate(n.key,false)}
        style={{flex:1,padding:"12px 0 10px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:view===n.key&&!showInput?T.navy:T.muted}}>
        <span style={{fontSize:20}}>{n.icon}</span>
        <span style={{fontSize:10,fontWeight:700}}>{n.label}</span>
        {view===n.key&&!showInput&&<div style={{width:20,height:2,background:T.orange,borderRadius:2}}/>}
      </button>
    ))}
    {!isAdmin&&(
      <button onClick={()=>onNavigate(view,true)}
        style={{flex:1,padding:"10px 0",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
        <div style={{width:44,height:44,borderRadius:14,background:showInput?T.orange:T.navy,display:"flex",alignItems:"center",justifyContent:"center",marginTop:-20,boxShadow:"0 4px 16px rgba(25,29,84,0.3)"}}>
          <span style={{fontSize:24,color:T.white,lineHeight:1,fontWeight:300}}>+</span>
        </div>
        <span style={{fontSize:10,fontWeight:700,marginTop:2,color:showInput?T.orange:T.navy}}>입력</span>
      </button>
    )}
  </div>
);

// ══════════════════════════════════════════════════════
// SIDE NAVIGATION
// ══════════════════════════════════════════════════════
const SideNav = ({nav, view, showInput, onNavigate, profile, isAdmin, isParent, onShowInput, onLogout, onShowProfile, pendingCount, isOpen}) => {
  const w = isOpen ? 240 : 56;
  return (
    <div style={{
      width:w, background:"#F2F3F7", position:"fixed", top:0, left:0, bottom:0,
      display:"flex", flexDirection:"column", zIndex:200, overflowY:"auto", overflowX:"hidden",
      borderRight:"1px solid #E2E6F3", transition:"width 0.22s ease"
    }}>
      {/* 프로필 아바타 */}
      <div style={{padding: isOpen ? "20px 16px 16px" : "16px 0", borderBottom:"1px solid #E2E6F3",
          display:"flex", alignItems:"center", gap:10, justifyContent: isOpen ? "flex-start" : "center",
          cursor:"pointer", transition:"padding 0.22s"}}
        onClick={onShowProfile}>
        {isOpen && <Logo size="md" headerMode onClick={e=>{e.stopPropagation(); onNavigate(nav[0]?.key||"cert", false);}}/>}
        {!isOpen && (
          <div style={{width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#191D54,#3D4499)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:"#fff", overflow:"hidden", flexShrink:0}}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              : isAdmin ? HI.user(16,"#fff") : profile.name?.charAt(0)||HI.cap(16,"#fff")}
          </div>
        )}
        {isOpen && (
          <>
            <div style={{width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#191D54,#3D4499)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:"#fff", flexShrink:0, overflow:"hidden"}}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : isAdmin ? HI.user(16,"#fff") : profile.name?.charAt(0)||HI.cap(16,"#fff")}
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:13, fontWeight:700, color:"#191D54", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{profile.name}</div>
              <div style={{fontSize:11, color:"#8B91C0", marginTop:1}}>
                {isAdmin ? "관리자" : calcGrade(profile.birth_year, profile.birth_month) || profile.grade || "학생"}
              </div>
            </div>
            <span style={{fontSize:10, color:"#C8CEED", marginLeft:"auto"}}>✎</span>
          </>
        )}
      </div>

      {/* 네비게이션 */}
      <div style={{flex:1, padding: isOpen ? "12px 8px" : "12px 4px"}}>
        {isAdmin && pendingCount > 0 && (
          <div style={{
              background:"#FEE2E2", border:"1px solid #FECACA", borderRadius:8,
              padding: isOpen ? "8px 12px" : "8px 4px", marginBottom:8,
              fontSize: isOpen ? 12 : 16, color:"#E8394A", fontWeight:700, cursor:"pointer",
              textAlign: isOpen ? "left" : "center", overflow:"hidden", whiteSpace:"nowrap"}}
            onClick={()=>onNavigate("dashboard",false)}>
            {isOpen
              ? <span style={{display:"flex",alignItems:"center",gap:5}}>{HI.bell(13,"#E8394A")}{pendingCount}명 승인 대기</span>
              : <span style={{display:"flex",justifyContent:"center"}}>{HI.bell(16,"#E8394A")}</span>}
          </div>
        )}
        {nav.map((n, i) => {
          // 헤더 항목 (자녀 이름 등) — 클릭 불가, 구분 라벨
          if(n.header){
            if(!isOpen) return null;
            return (
              <div key={`hdr-${i}`} style={{
                padding:"14px 14px 4px 14px", fontSize:11, fontWeight:800,
                color:"#9CA3AF", letterSpacing:"0.02em", marginTop:4,
                borderTop: i>0 ? "1px solid rgba(25,29,84,0.08)" : "none",
              }}>
                {n.label}
              </div>
            );
          }
          const isActive = view===n.key && !showInput;
          return (
            <div key={n.key} onClick={()=>onNavigate(n.key, false)}
              style={{
                display:"flex", alignItems:"center", gap:10,
                padding: isOpen ? "11px 14px" : "11px 0",
                justifyContent: isOpen ? "flex-start" : "center",
                cursor:"pointer", borderRadius:10, marginBottom:2,
                background: isActive ? "#fff" : "transparent",
                borderLeft: isActive && isOpen ? "3px solid #F68B1E" : "3px solid transparent",
                boxShadow: isActive ? "0 1px 4px rgba(25,29,84,0.08)" : "none",
                transition:"all 0.15s", overflow:"hidden"
              }}
              onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="rgba(25,29,84,0.05)"; }}
              onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="transparent"; }}>
              <span style={{display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {navIcon(n.icon, 19, isActive?"#191D54":"#6B7299")}
              </span>
              {isOpen && <span style={{fontSize:13, fontWeight:isActive?700:500, color:isActive?"#191D54":"#4A5080", whiteSpace:"nowrap"}}>{n.label}</span>}
            </div>
          );
        })}
      </div>

      {/* 하단 버튼들 */}
      <div style={{padding: isOpen ? "0 12px 16px" : "0 6px 16px", display:"flex", flexDirection:"column", gap:6}}>
        {!isAdmin && !isParent && (
          <button onClick={onShowInput}
            style={{width:"100%", background:"#F68B1E", border:"none", borderRadius:10,
              padding:"12px", color:"#fff", fontSize: isOpen ? 13 : 18, fontWeight:800,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6}}>
            {isOpen ? <><span style={{fontSize:16, fontWeight:300}}>+</span> 학습 입력</> : "+"}
          </button>
        )}
        {isOpen && <>
          {/* 도움말 버튼 — 비활성화
          <button onClick={()=>window.open("/manual.html","_blank")}
            style={{width:"100%", background:"transparent", border:"1px solid #E2E6F3", borderRadius:8, padding:"9px", color:"#8B91C0", fontSize:12, cursor:"pointer"}}>
            ❓ 도움말
          </button>
          */}
          <button onClick={onLogout}
            style={{width:"100%", background:"transparent", border:"1px solid #E2E6F3", borderRadius:8, padding:"9px", color:"#C8CEED", fontSize:12, cursor:"pointer"}}>
            로그아웃
          </button>
        </>}
        {!isOpen && <>
          {/* 도움말 아이콘 — 비활성화 */}
          <button onClick={onLogout} title="로그아웃"
            style={{width:"100%", background:"transparent", border:"1px solid #E2E6F3", borderRadius:8, padding:"8px 0", color:"#C8CEED", fontSize:14, cursor:"pointer"}}>↩</button>
        </>}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════
export default function App() {
  const [authState, setAuthState] = useState("loading");
  const [showEISetup, setShowEISetup] = useState(false);
  // "loading" | "unauthenticated" | "needsProfile" | "pending" | "ready" | "passwordRecovery"
  const [session, setSession]     = useState(null);
  const [profile, setProfile]     = useState(null);
  const [logs, setLogs]           = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [children, setChildren]   = useState([]); // [{profile, logs}]
  const [selChildId, setSelChildId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const getInitialView = () => {
    const path = window.location.pathname;
    if(path === "/history") return "history";
    if(path === "/cert")    return "cert";
    if(path === "/input")   return "input";
    if(path === "/users")   return "users";
    if(path === "/roster2") return "roster2";
    if(path === "/attendance") return "attendance";
    if(path === "/manjeom")    return "manjeom";
    if(path === "/makeup")     return "roster2"; // backward-compat → roster2 makeup sub-tab
    return "dashboard";
  };
  const [view, setView]           = useState(getInitialView);
  const [showInput, setShowInput] = useState(window.location.pathname === "/input");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const isMobile = useMobile();

  // URL ↔ 상태 동기화
  const navigate = (v, input=false) => {
    // 학부모 자녀별 view (child-*)는 URL을 / 로 두고 view 상태만 변경
    const path = input ? "/input"
      : v === "history" ? "/history"
      : v === "cert" ? "/cert"
      : v === "users" ? "/users"
      : v === "roster2" ? "/roster2"
      : v === "attendance" ? "/attendance"
      : v === "manjeom" ? "/manjeom"
      : "/";
    window.history.pushState({ view:v, input }, "", path);
    setView(v);
    setShowInput(input);
  };

  useEffect(() => {
    const onPop = (e) => {
      const s = e.state;
      const path = window.location.pathname;
      if(s) { setView(s.view||"dashboard"); setShowInput(s.input||false); }
      else if(path==="/cert")       { setView("cert");       setShowInput(false); }
      else if(path==="/users")      { setView("users");      setShowInput(false); }
      else if(path==="/roster2")    { setView("roster2");    setShowInput(false); }
      else if(path==="/attendance") { setView("attendance"); setShowInput(false); }
      else if(path==="/manjeom")    { setView("manjeom");    setShowInput(false); }
      else if(path==="/makeup")     { setView("roster2");    setShowInput(false); }
      else if(path==="/history")    { setView("history");    setShowInput(false); }
      else                          { setView("dashboard");  setShowInput(false); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const loadUserData = async (sess) => {
    if(!sess?.user) { setAuthState("unauthenticated"); return; }
    const uid = sess.user.id;
    const { data: prof, error } = await supabase
      .from("profiles").select("*").eq("id", uid).single();

    // 프로필 없음 or 미완성 프로필 → 로그아웃 후 처음부터 재가입
    // cleanup_incomplete_signup이 같은 이메일 재시도 시 자동 처리
    if(!prof || error || !prof.name || prof.name === "미입력") {
      await supabase.auth.signOut();
      setSession(null);
      setAuthState("unauthenticated");
      return;
    }

    // 관리자 approval 자동 보정
    if(prof.role === "admin" && prof.approval_status !== "approved") {
      await supabase.from("profiles").update({ approval_status: "approved" }).eq("id", uid);
      prof.approval_status = "approved";
    }

    setProfile(prof);
    setSession(sess);

    // 미승인 학생
    if(prof.role !== "admin" && prof.approval_status !== "approved") {
      setAuthState("pending");
      return;
    }

    // 데이터 로드
    if(prof.role === "admin") {
      const [{ data: allLogs }, { data: allProfs }] = await Promise.all([
        supabase.rpc("get_all_logs"),
        supabase.rpc("get_all_profiles"),
      ]);
      setLogs(allLogs || []);
      setAllProfiles(allProfs || []);
    } else if(prof.role === "parent") {
      const { data: childProfiles } = await supabase.rpc("get_child_profiles");
      if(childProfiles && childProfiles.length > 0) {
        const childData = await Promise.all(childProfiles.map(async (cp) => {
          const { data: cl } = await supabase.rpc("get_child_logs", { child_id: cp.id });
          return { profile: cp, logs: cl || [] };
        }));
        setChildren(childData);
        setSelChildId(childData[0].profile.id);
      }
    } else {
      const { data: myLogs } = await supabase
        .from("learning_logs").select("*").eq("uid", uid).order("date", { ascending: false });
      setLogs(myLogs || []);
      // 목표 EI 미설정이면 팝업
      const isFirstLogin = (prof.target_ei===85||!prof.target_ei) && !(myLogs?.length>0);
      if(isFirstLogin) setShowEISetup(true);
    }
    setAuthState("ready");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sess }, error }) => {
      if(error) { supabase.auth.signOut(); setAuthState("unauthenticated"); return; }
      if(sess) loadUserData(sess);
      else setAuthState("unauthenticated");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      if(event === "PASSWORD_RECOVERY") {
        setAuthState("passwordRecovery");
        setSession(sess);
        return;
      }
      if(event === "SIGNED_OUT" || !sess) {
        setAuthState("unauthenticated");
        setSession(null); setProfile(null);
        setLogs([]); setAllProfiles([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const refreshData = () => { if(session) loadUserData(session); };

  // 역할별 초기 화면 보정
  useEffect(() => {
    if(authState !== "ready" || !profile) return;
    const in2ki = ROSTER2.some(s => s.name === profile.name);
    // 관리자: 항상 users(회원 관리) 시작
    if(profile.role === "admin" && (view === "cert" || view === "dashboard")) {
      navigate("users", false); return;
    }
    // 2기 학생: cert 시작
    if(profile.role === "student" && in2ki && view === "dashboard") {
      navigate("cert", false); return;
    }
    // 2기 아닌 학생이 cert 접근 시 dashboard로
    if(profile.role === "student" && !in2ki && view === "cert") {
      navigate("dashboard", false);
    }
  }, [authState, profile?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthState("unauthenticated");
    setSession(null); setProfile(null);
    setLogs([]); setAllProfiles([]);
  };

  // ── 로딩
  if(authState === "loading") return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center",
      justifyContent:"center", flexDirection:"column", gap:20, fontFamily:"'Noto Sans KR',sans-serif" }}>
      <Logo size="md"/>
      <Spinner size={36}/>
      <div style={{ fontSize:13, color:T.muted }}>로딩 중...</div>
    </div>
  );

  // ── 비밀번호 재설정
  if(authState === "passwordRecovery") return (
    <PasswordResetScreen onDone={()=>{ supabase.auth.signOut(); setAuthState("unauthenticated"); }}/>
  );

  // ── 비로그인
  if(authState === "unauthenticated") return (
    <AuthScreen onLogin={(sess) => { setAuthState("loading"); loadUserData(sess); }}/>
  );

  // ── 가입 미완료 (이름 미입력) → 이름/역할/비밀번호 입력 완료 화면
  if(authState === "needsProfile") return <CompleteProfileScreen session={session} onDone={async()=>{ await supabase.auth.signOut(); setSession(null); setAuthState("unauthenticated"); }}/>;

  // ── 승인 대기
  if(authState === "pending") return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Noto Sans KR',sans-serif",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <Card style={{ maxWidth:400, width:"100%", textAlign:"center", padding:"40px 32px" }}>
        <div style={{ fontSize:60, marginBottom:20 }}>⏳</div>
        <Logo size="md"/>
        <div style={{ height:1, background:T.border, margin:"20px 0" }}/>
        <div style={{ fontSize:20, fontWeight:800, color:T.navy, marginBottom:10 }}>승인 대기 중</div>
        <div style={{ fontSize:14, color:T.textMid, lineHeight:1.8, marginBottom:24 }}>
          안녕하세요, <strong style={{ color:T.navy }}>{profile?.name}</strong>님!<br/>
          관리자 승인 후 이용하실 수 있습니다.
        </div>
        <div style={{ background:T.orangePale, border:`1px solid ${T.orange}30`, borderRadius:12,
          padding:"14px 18px", fontSize:13, color:T.textMid, marginBottom:24 }}>
          📞 승인 관련 문의는 담당 선생님께 연락해 주세요.
        </div>
        <button onClick={handleLogout} style={{ ...css.btnGhost, padding:"10px 28px" }}>로그아웃</button>
      </Card>
    </div>
  );

  // ── 소셜 최초 프로필 설정 (authState === "needsProfile" 은 현재 미사용, signOut 처리)

  if(authState !== "ready" || !profile) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center",
      justifyContent:"center", fontFamily:"'Noto Sans KR',sans-serif" }}>
      <Spinner size={36}/>
    </div>
  );

  const isAdmin  = profile.role === "admin";
  const isParent = profile.role === "parent";
  // 20HA 2기 소속 여부 (학생 전용)
  const isIn2ki  = !isAdmin && !isParent && ROSTER2.some(s => s.name === profile.name);
  const NAV = isAdmin
    ? [
        { key:"users",       label:"회원 관리",          icon:"users"     },
        { key:"roster2",     label:"20HA 2기 현황",      icon:"trophy"    },
        { key:"manjeom",     label:"만점 테스트",         icon:"cap"       },
        { key:"history",     label:"전체 기록",           icon:"calendar"  },
      ]
    : isParent
      ? [
          { key:"dashboard", label:"자녀 아이디 관리", icon:"users" },
          // 등록된 자녀별로 그룹 메뉴 동적 추가
          ...children.flatMap(c => {
            const cid = c.profile.id;
            const cname = c.profile.name;
            const childIs2ki = ROSTER2.some(s => s.name === cname);
            return [
              { header: true, label: `👤 ${cname}` },
              ...(childIs2ki ? [{ key:`child-cert-${cid}`,      label:"20HA 2기 인증현황", icon:"trophy"   }] : []),
              // 만점 테스트는 관리자 검토 중 — 학부모 메뉴에서도 임시 숨김 (admin 전용)
              { key:`child-dashboard-${cid}`, label:"메타인지 분석", icon:"cap"      },
              { key:`child-history-${cid}`,   label:"학습 기록",     icon:"calendar" },
            ];
          }),
        ]
      : [
          ...(isIn2ki ? [{ key:"cert", label:"20HA 2기 인증현황", icon:"trophy" }] : []),
          // 만점 테스트는 관리자 검토 중 — 학생 메뉴에서 임시 숨김 (admin 전용)
          { key:"dashboard", label:"메타인지 분석", icon:"cap" },
          { key:"history",   label:"학습 기록",     icon:"calendar" },
        ];
  const pendingCount = allProfiles.filter(p => (p.role==="student"||p.role==="parent") && p.approval_status==="pending").length;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg, fontFamily:"'Noto Sans KR',sans-serif", color:T.text }}>
      {/* 좌측 사이드바 — 데스크톱 전용 */}
      {!isMobile && (
        <SideNav
          nav={NAV}
          view={view}
          showInput={showInput}
          onNavigate={(v, input=false) => navigate(v, input)}
          profile={profile}
          isAdmin={isAdmin}
          isParent={isParent}
          onShowInput={() => navigate(view, true)}
          onLogout={handleLogout}
          onShowProfile={() => setShowProfileModal(true)}
          pendingCount={pendingCount}
          isOpen={sidebarOpen}
        />
      )}

      {/* 메인 영역 */}
      <div style={{ flex:1, minWidth:0, marginLeft: isMobile ? 0 : (sidebarOpen ? 240 : 56), minHeight:"100vh", display:"flex", flexDirection:"column", transition:"margin-left 0.22s ease", overflow:"hidden" }}>
        {/* 상단바 */}
        <div style={{ position:"sticky", top:0, zIndex:100, borderBottom:`1px solid ${T.border}`, background:T.surface, boxShadow:"0 1px 4px rgba(25,29,84,0.05)" }}>
          <div style={{ display:"flex", alignItems:"center", height:isMobile?56:58, gap:12, padding:`0 ${isMobile?16:24}px` }}>
            {/* 햄버거 버튼 — 데스크톱 */}
            {!isMobile && (
              <button onClick={() => setSidebarOpen(o => !o)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:"6px 8px",
                  borderRadius:8, display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}
                title={sidebarOpen ? "메뉴 닫기" : "메뉴 열기"}>
                <span style={{display:"block", width:18, height:2, background:T.navy, borderRadius:1}}/>
                <span style={{display:"block", width:18, height:2, background:T.navy, borderRadius:1}}/>
                <span style={{display:"block", width:18, height:2, background:T.navy, borderRadius:1}}/>
              </button>
            )}
            {isMobile && <Logo size="sm" headerMode={true} onClick={()=>navigate(NAV[0]?.key||"cert",false)}/>}
            {!isMobile && (
              <div style={{ fontSize:16, fontWeight:800, color:T.navy }}>
                {showInput ? "학습 입력" : NAV.find(n=>n.key===view)?.label || ""}
              </div>
            )}
            <div style={{ flex:1 }}/>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {isMobile && !isAdmin && !isParent && (
                <button onClick={() => navigate(view, true)} style={{ padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, background:T.orange, color:T.white, display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{fontSize:15, fontWeight:300}}>+</span> 입력
                </button>
              )}
              {isMobile && (
                <div onClick={()=>setShowProfileModal(true)}
                  style={{ width:32, height:32, borderRadius:10, background:T.grad, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:T.white, cursor:"pointer", overflow:"hidden", flexShrink:0 }}>
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : isAdmin ? HI.user(16,"#fff") : profile.name?.charAt(0)||HI.cap(16,"#fff")}
                </div>
              )}
              {isMobile && (
                <button onClick={handleLogout} style={{ padding:"5px 10px", borderRadius:8, border:`1px solid ${T.border}`, background:T.white, color:T.muted, cursor:"pointer", fontSize:11, whiteSpace:"nowrap" }}>로그아웃</button>
              )}
            </div>
          </div>
        </div>

        {/* 페이지 콘텐츠 */}
        <div style={{ padding: isMobile ? "16px 12px 100px" : "28px 32px 60px", overflowX:"auto", flex:1 }}>
          {showInput ? (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <button onClick={() => navigate(view, false)}
                  style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:22 }}>←</button>
                <div>
                  <div style={{ fontSize:isMobile?16:18, fontWeight:800, color:T.navy }}>학습 데이터 입력</div>
                  <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>정직하게 입력할수록 EI의 정확도가 높아집니다.</div>
                </div>
              </div>
              <DataInputForm uid={session.user.id}
                onSave={() => { navigate(view, false); refreshData(); }}
                onCancel={() => navigate(view, false)}/>
            </div>
          ) : view === "cert" && !isAdmin && !isParent && isIn2ki ? (
            <StudentCertView profile={profile}/>
          ) : view === "manjeom" && isAdmin ? (
            <ManjeomView onRefresh={refreshData} allProfiles={allProfiles}/>
          ) : (view === "users" || view === "cert" || view === "roster2" || view === "attendance") && isAdmin ? (
            <AdminDashboard
              allLogs={logs} allProfiles={allProfiles} onRefresh={refreshData}
              defaultTab={view === "users" ? "users" : "roster2"}
              defaultRoster2Tab={
                view === "cert" ? "grading" :
                view === "attendance" ? "attendance" :
                (window.location.pathname === "/makeup") ? "makeup" : "overview"
              }/>
          ) : isParent && view.startsWith("child-") ? (
            (() => {
              // 만점 테스트는 관리자 검토 중 — child-manjeom-* 라우트는 admin 전환 전까지 비활성
              const m = view.match(/^child-(cert|dashboard|history)-(.+)$/);
              if(!m) return null;
              const [, sub, cid] = m;
              const child = children.find(c => c.profile.id === cid);
              if(!child) return <Card style={{padding:24,textAlign:"center",color:T.muted}}>자녀 정보를 찾을 수 없어요.</Card>;
              if(sub === "cert")      return <StudentCertView profile={child.profile} viewerMode="parent"/>;
              if(sub === "history")   return <LogHistory logs={child.logs} onDelete={null} isAdmin={false} allProfiles={[child.profile]}/>;
              return <StudentDashboard logs={child.logs} profile={child.profile} isAdminView={true}/>;
            })()
          ) : view === "dashboard" ? (
            isAdmin
              ? <AdminDashboard allLogs={logs} allProfiles={allProfiles} onRefresh={refreshData} defaultTab="users"/>
              : isParent
                ? <ParentHomeView
                    children={children}
                    parentId={session.user.id}
                    onChildrenUpdate={(newChildren, newSelId) => { setChildren(newChildren); if(newSelId) setSelChildId(newSelId); }}
                  />
                : <StudentDashboard logs={logs} profile={profile}/>
          ) : (
            <LogHistory
              logs={logs}
              onDelete={async (id) => {
                await supabase.from("learning_logs").delete().eq("id", id);
                setLogs(l => l.filter(x => x.id !== id));
              }}
              isAdmin={isAdmin}
              allProfiles={allProfiles}/>
          )}
        </div>
      </div>

      {isMobile && <BottomNav nav={NAV} view={view} showInput={showInput} onNavigate={navigate} isAdmin={isAdmin||isParent}/>}
      {showEISetup && <EISetupModal profile={profile} logs={logs} onSave={(t)=>{setProfile(p=>({...p,target_ei:t}));setShowEISetup(false);}}/> }
      {showProfileModal && <ProfileModal profile={profile} onClose={()=>setShowProfileModal(false)} onSave={(updated)=>{setProfile(updated);setShowProfileModal(false);}} onDelete={()=>{setShowProfileModal(false);handleLogout();}}/>}
    </div>
  );
}
