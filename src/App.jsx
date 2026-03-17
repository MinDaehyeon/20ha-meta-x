import { useState, useEffect, useCallback, useRef } from "react";
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
  btnPrimary: {background:T.grad,border:"none",borderRadius:10,padding:"12px 28px",color:T.white,fontSize:14,fontWeight:800,cursor:"pointer"},
  btnOrange:  {background:T.gradOrange,border:"none",borderRadius:10,padding:"12px 28px",color:T.white,fontSize:14,fontWeight:800,cursor:"pointer"},
  btnGhost:   {background:"transparent",border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 20px",color:T.textMid,fontSize:13,cursor:"pointer"},
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
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
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
  const [suGrade, setSuGrade] = useState("고1");
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
    setLoad("fp", true); setError("");
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
    const tempPw = `Tmp${Date.now()}@x`;
    const {error:err} = await supabase.auth.signUp({ email:suEmail, password:tempPw });
    setLoad("sendOtp",false);
    if(err){ setError(translateSupabaseError(err.message)); return; }
    setOtpSent(true); setOtpVerified(false); setOtpCode("");
  };

  const handleVerifyOtp = async () => {
    if(otpCode.length !== 6){ setError("6자리 코드를 입력해주세요."); return; }
    setLoad("otp",true); setError("");
    const {error:err} = await supabase.auth.verifyOtp({ email:suEmail, token:otpCode, type:"signup" });
    setLoad("otp",false);
    if(err){ setError("인증 코드가 올바르지 않습니다. 다시 확인해주세요."); return; }
    setOtpSent(false); setOtpVerified(true);
  };

  const handleSignup = async () => {
    setError("");
    if(!suName||!suPw){ setError("모든 항목을 입력해 주세요."); return; }
    if(!otpVerified){ setError("이메일 인증을 먼저 완료해주세요."); return; }
    if(suName.trim()!==suName||suName.includes(" ")){ setError("이름에 공백을 포함할 수 없습니다."); return; }
    if(suName.trim().length<2){ setError("이름은 2자 이상 입력해주세요."); return; }
    const pwRegex=/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if(suPw!==suPwC){ setError("비밀번호가 일치하지 않습니다."); return; }
    if(!pwRegex.test(suPw)){ setError("비밀번호는 영문 대소문자, 특수문자를 포함한 8자 이상이어야 합니다."); return; }
    setLoad("signup",true);
    const {data,error:err} = await supabase.auth.updateUser({
      password:suPw, data:{name:suName, grade:suRole==="student"?suGrade:"", target_ei:85, role:suRole}
    });
    if(!err && data?.user){
      await supabase.from("profiles").upsert({
        id:data.user.id, name:suName, grade:suRole==="student"?suGrade:"",
        target_ei:85, role:suRole, approval_status:"pending"
      });
    }
    await supabase.auth.signOut();
    setLoad("signup",false);
    if(err){ setError(translateSupabaseError(err.message)); return; }
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
  if(m.includes("expired")) return "세션이 만료되었습니다. 다시 로그인해주세요.";
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

  const fillDemo = async (type) => {
    if(type==="student") await handleLogin("test@20ha.kr","test1234!");
    else                  await handleLogin("mdhyun1324@gmail.com","alseo1324!");
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
          {icon:"📋",text:"학습데이터 기록 — 공부 시간, 수행 여부, 이해도 등 학습 과정을 데이터로 기록합니다."},
          {icon:"📊",text:"학습 상태 시각화 — 아이의 학습 흐름과 현재 상태를 한눈에 확인할 수 있습니다."},
          {icon:"🔍",text:"학습 패턴 분석 — 반복적으로 막히는 지점과 공부 습관을 데이터로 분석합니다."},
          {icon:"✅",text:"자기점검 시스템 — 학생이 자신의 학습을 스스로 점검하고 조정하도록 돕습니다."},
        ].map(f=>(
          <div key={f.text} style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            <div style={{width:34,height:34,background:"rgba(255,255,255,0.1)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{f.icon}</div>
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
          <div style={{fontSize:48,marginBottom:16}}>✅</div>
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
          {[{v:"student",label:"🎓 학생"},{v:"parent",label:"👨‍👩‍👧 학부모"}].map(({v,label})=>(
            <button key={v} onClick={()=>setSuRole(v)}
              style={{flex:1,padding:"9px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,
                background:suRole===v?T.navy:"transparent",color:suRole===v?T.white:T.muted,transition:"all 0.15s"}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{display:"grid",gap:12,marginBottom:12}}>
          <div><label style={css.label}>이름</label><input value={suName} onChange={e=>setSuName(e.target.value)} placeholder="홍길동" style={css.input}/></div>
          {suRole==="student" && (
            <div><label style={css.label}>학년</label>
              <select value={suGrade} onChange={e=>setSuGrade(e.target.value)} style={css.select}>
                {GRADES.map(g=><option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          )}

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
        <button onClick={handleSignup} disabled={loading.signup||!otpVerified||!privacyAgreed||!termsAgreed||!ageAgreed} style={{...css.btnOrange,width:"100%",padding:"13px 0",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:(!otpVerified||!privacyAgreed||!termsAgreed||!ageAgreed)?0.4:1}}>
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
  const [name, setName]     = useState(user.user_metadata?.full_name||user.user_metadata?.name||"");
  const [grade, setGrade]   = useState("고1");
  const [target, setTarget] = useState(85);
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState("");

  const save = async () => {
    if(!name){ setError("이름을 입력해 주세요."); return; }
    setSaving(true);
    await supabase.from("profiles").upsert({
      id:user.id, name, grade, target_ei:85,
      role:"student", approval_status:"pending"
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
          <div><label style={css.label}>학년</label>
            <select value={grade} onChange={e=>setGrade(e.target.value)} style={css.select}>
              {GRADES.map(g=><option key={g} value={g}>{g}</option>)}
            </select>
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
// DATA INPUT FORM
// ══════════════════════════════════════════════════════
const DataInputForm = ({uid, onSave, onCancel}) => {
  const [step, setStep]   = useState(0);
  const [err, setErr]     = useState("");
  const [saving, setSaving] = useState(false);
  const isMobile = useMobile();
  const [form, setForm]   = useState({
    date:new Date().toISOString().slice(0,10), subject:"수학", bookLevel:1,
    startTime:"", endTime:"", breakTime:10, questionCount:20,
    qBasic:0, qMid:0, qAdv:0,
    timeRatio1:50, timeRatio2:80,
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
  const metrics = (()=>{
    const aqKeys=subjectCfg.quant.filter(k=>form.quantEnabled[k]);
    const alKeys=subjectCfg.qual.filter(k=>form.qualEnabled[k]);
    const qT=aqKeys.reduce((s,k)=>s+Number(form.quant[k]||0),0);
    const qlT=alKeys.reduce((s,k)=>s+((form.qual[k]||0)/5*100),0);
    const denom=(aqKeys.length*100*1.0+alKeys.length*100*0.5)/100;
    const strategyScore=denom>0?(qT*1.0+qlT*0.5)/denom:0;
    const qB=form.qBasic||0, qM=form.qMid||0, qA=form.qAdv||0;
    // 단계별 시간 - 활성 구간 기준으로 rawB/rawM/rawA 계산 (띠그래프와 동일 로직)
    const h1m=form.timeRatio1||50, h2m=form.timeRatio2||80;
    const acM=[qB>0,qM>0,qA>0].filter(Boolean).length;
    let rawBm=0,rawMm=0,rawAm=0;
    if(acM===1){rawBm=qB>0?100:0;rawMm=qM>0?100:0;rawAm=qA>0?100:0;}
    else if(acM===2){
      if(qB>0&&qM>0){rawBm=h1m;rawMm=100-h1m;}
      else if(qB>0&&qA>0){rawBm=h1m;rawAm=100-h1m;}
      else{rawMm=h1m;rawAm=100-h1m;}
    } else {rawBm=h1m;rawMm=h2m-h1m;rawAm=100-h2m;}
    const bTime=netTime*rawBm/100, mTime=netTime*rawMm/100, aTime=netTime*rawAm/100;
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

  const save = async()=>{
    if(!form.date){setErr("⚠️ 날짜를 입력해주세요.");return;}
    if(!form.subject){setErr("⚠️ 과목을 선택해주세요.");return;}
    const totalQCheck=subjectCfg.qLevels?(form.qBasic||0)+(form.qMid||0)+(form.qAdv||0):(form.qBasic||0);
    if(totalQCheck===0){setErr("⚠️ 문항 수를 하나 이상 입력해주세요.");return;}
    if(!form.startTime||!form.endTime){setErr("⚠️ 시작 시간과 종료 시간을 입력해주세요.");return;}
    if(toMin(form.endTime)<=toMin(form.startTime)){setErr("⚠️ 종료 시간이 시작 시간보다 빠릅니다.");return;}
    if(breakRatio>50){setErr("⚠️ 쉬는 시간이 전체 학습 시간의 50%를 초과했습니다.");return;}
    const coinSum=Object.values(form.coinFilter).reduce((s,v)=>s+v,0);
    if(coinSum===0){setErr("⚠️ CO-IN Filter를 입력해주세요.");return;}
    setSaving(true); setErr("");
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

  const STEPS=["① 기본 정보","② 전략 수행","③ 메타인지"];
  return(
    <div style={{maxWidth:640,margin:"0 auto"}}>
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {STEPS.map((s,i)=>(
          <div key={i} onClick={()=>setStep(i)} style={{flex:1,textAlign:"center",padding:"9px 4px",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:700,
            background:i===step?T.navy:T.surfaceAlt,color:i===step?T.white:T.muted,border:`1px solid ${i===step?T.navy:T.border}`}}>{s}</div>
        ))}
      </div>

      {err&&<div style={{background:"#FEE2E2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 16px",color:T.danger,fontSize:13,marginBottom:12}}>{err}</div>}

      {step===0&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* 카드1: 날짜 · 과목 */}
          <Card>
            <div style={{fontSize:12,fontWeight:700,color:T.muted,marginBottom:12,letterSpacing:"0.06em"}}>📅 날짜 · 과목</div>
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

            {/* 단계별 시간 분배 - 수학만 표시 */}
            {netTime>0&&subjectCfg.qLevels&&(()=>{
              const hasB=form.qBasic>0, hasM=form.qMid>0, hasA=form.qAdv>0;
              const activeCount=[hasB,hasM,hasA].filter(Boolean).length;
              // 활성 구간별 비율 계산
              // handle1: 첫번째 경계(%), handle2: 두번째 경계(%) - 항상 handle1<handle2
              const h1=form.timeRatio1, h2=form.timeRatio2;
              // 구간 배분
              let rawB=0,rawM=0,rawA=0;
              if(activeCount===1){rawB=hasB?100:0;rawM=hasM?100:0;rawA=hasA?100:0;}
              else if(activeCount===2){
                if(hasB&&hasM){rawB=h1;rawM=100-h1;}
                else if(hasB&&hasA){rawB=h1;rawA=100-h1;}
                else{rawM=h1;rawA=100-h1;}
              } else {
                rawB=h1; rawM=h2-h1; rawA=100-h2;
              }
              const bMin=Math.round(netTime*rawB/100);
              const mMin=Math.round(netTime*rawM/100);
              const aMin=netTime-bMin-mMin;
              // 드래그 핸들러
              const onBarDrag=(e,barRef)=>{
                if(!barRef.current)return;
                const rect=barRef.current.getBoundingClientRect();
                const getP=(clientX)=>Math.round(Math.min(95,Math.max(5,(clientX-rect.left)/rect.width*100))/5)*5;
                const move=(ev)=>{
                  const clientX=ev.touches?ev.touches[0].clientX:ev.clientX;
                  const p=getP(clientX);
                  if(activeCount===2){
                    setForm(f=>({...f,timeRatio1:p}));
                  } else {
                    // 3개: 어느 핸들 드래그인지 판단
                    setForm(f=>{
                      const distH1=Math.abs(p-f.timeRatio1), distH2=Math.abs(p-f.timeRatio2);
                      if(distH1<=distH2) return{...f,timeRatio1:Math.min(p,f.timeRatio2-5)};
                      else return{...f,timeRatio2:Math.max(p,f.timeRatio1+5)};
                    });
                  }
                };
                const up=()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);window.removeEventListener("touchmove",move);window.removeEventListener("touchend",up);};
                window.addEventListener("mousemove",move);
                window.addEventListener("mouseup",up);
                window.addEventListener("touchmove",move,{passive:false});
                window.addEventListener("touchend",up);
                e.preventDefault();
              };
              const barRef={current:null};
              return(
                <div style={{marginTop:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.muted,marginBottom:8}}>단계별 풀이 시간 분배
                    <span style={{fontWeight:400,marginLeft:6,fontSize:11,color:T.muted}}>경계선을 드래그하여 조절</span>
                  </div>
                  {/* 드래그 가능한 띠 그래프 */}
                  <div ref={el=>barRef.current=el}
                    style={{position:"relative",height:36,borderRadius:8,overflow:"hidden",display:"flex",cursor:"ew-resize",userSelect:"none"}}
                    onMouseDown={e=>onBarDrag(e,barRef)}
                    onTouchStart={e=>onBarDrag(e,barRef)}
                  >
                    {hasB&&rawB>0&&<div style={{width:`${rawB}%`,background:T.navy,display:"flex",alignItems:"center",justifyContent:"center",transition:"width 0.05s",overflow:"hidden"}}>
                      {rawB>=14&&<span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.9)",whiteSpace:"nowrap"}}>기본 {bMin}분</span>}
                    </div>}
                    {hasM&&rawM>0&&<div style={{width:`${rawM}%`,background:T.orange,display:"flex",alignItems:"center",justifyContent:"center",transition:"width 0.05s",overflow:"hidden"}}>
                      {rawM>=14&&<span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.9)",whiteSpace:"nowrap"}}>응용 {mMin}분</span>}
                    </div>}
                    {hasA&&rawA>0&&<div style={{flex:1,background:"#7C3AED",display:"flex",alignItems:"center",justifyContent:"center",transition:"width 0.05s",overflow:"hidden"}}>
                      {rawA>=14&&<span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.9)",whiteSpace:"nowrap"}}>심화 {aMin}분</span>}
                    </div>}
                    {/* 경계 핸들 */}
                    {activeCount>=2&&(()=>{
                      const handles=activeCount===2?[h1]:[h1,h2];
                      return handles.map((p,i)=>(
                        <div key={i} style={{position:"absolute",left:`${p}%`,top:0,bottom:0,width:4,background:"rgba(255,255,255,0.9)",transform:"translateX(-50%)",boxShadow:"0 0 6px rgba(0,0,0,0.4)",borderRadius:2}}/>
                      ));
                    })()}
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>
      )}

      {step===1&&(
        <Card>
          <div style={{marginBottom:22}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:14}}>📊 정량 평가 (0–100점)</div>
            {subjectCfg.quant.map(item=>{
              const on=!!form.quantEnabled[item];
              const{g,c}=gradeInfo(on?form.quant[item]:0);
              return(
                <div key={item} style={{marginBottom:14,opacity:on?1:0.45}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div onClick={()=>setForm(f=>({...f,quantEnabled:{...f.quantEnabled,[item]:!on}}))}
                        style={{width:20,height:20,borderRadius:6,border:`2px solid ${on?T.navy:T.border}`,background:on?T.navy:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {on&&<span style={{color:"#fff",fontSize:12,fontWeight:900}}>✓</span>}
                      </div>
                      <span style={{fontSize:13,color:T.textMid}}>{item}</span>
                    </div>
                    {on&&<div style={{display:"flex",gap:8,alignItems:"center"}}><Pill color={c}>{g}</Pill><span style={{fontSize:14,fontWeight:800,color:T.navy,minWidth:28,textAlign:"right"}}>{form.quant[item]}</span></div>}
                  </div>
                  {on&&<input type="range" min={0} max={100} step={1} value={form.quant[item]} onChange={e=>setForm(f=>({...f,quant:{...f.quant,[item]:Number(e.target.value)}}))} style={sliderFill(form.quant[item],0,100,c)}/>}
                </div>
              );
            })}
          </div>
          <Divider/>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>✅ 정성 수행 (5점 척도)</div>
            <div style={{background:T.surfaceAlt,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",flexDirection:"column",gap:4}}>
              {[["1","전혀 하지 않음","해당 루틴을 아예 생략하고 넘어감","#DC2626"],
                ["2","시도만 했음","형식적으로 흉내만 냈거나 일부분만 수행","#F97316"],
                ["3","절반의 수행","방법은 알지만 일부 핵심 절차를 빠뜨림","#111827"],
                ["4","충실히 수행","정해진 방법대로 성실히 이행, 학습 효과를 느낌","#2563EB"],
                ["5","완벽히 몰입","단 1초의 흐트러짐 없이 뇌에 각인되는 느낌","#16A34A"],
              ].map(([n,title,desc,c])=>(
                <div key={n} style={{display:"flex",alignItems:"flex-start",gap:8}}>
                  <span style={{fontSize:11,fontWeight:800,color:c,minWidth:14}}>{n}</span>
                  <span style={{fontSize:11,color:c}}><strong>{title}</strong> — {desc}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {subjectCfg.qual.map(item=>{
                const on=!!form.qualEnabled[item];
                const score=form.qual[item]||3;
                const qualColor=score>=5?"#16A34A":score>=4?"#2563EB":score>=3?"#111827":score>=2?"#F97316":"#DC2626";
                const qualLabel=["","전혀 하지 않음","시도만 했음","절반의 수행","충실히 수행","완벽히 몰입"][score];
                return(
                  <div key={item} style={{opacity:on?1:0.45}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div onClick={()=>setForm(f=>({...f,qualEnabled:{...f.qualEnabled,[item]:!on}}))}
                          style={{width:20,height:20,borderRadius:6,border:`2px solid ${on?T.navy:T.border}`,background:on?T.navy:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {on&&<span style={{color:"#fff",fontSize:12,fontWeight:900}}>✓</span>}
                        </div>
                        <span style={{fontSize:12,color:T.textMid,fontWeight:600}}>{item}</span>
                      </div>
                      {on&&<div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:11,color:qualColor}}>{qualLabel}</span>
                        <span style={{fontSize:14,fontWeight:800,color:qualColor,minWidth:16,textAlign:"center"}}>{score}</span>
                      </div>}
                    </div>
                    {on&&<div style={{display:"flex",gap:6}}>
                      {[1,2,3,4,5].map(n=>(
                        <div key={n} onClick={()=>setForm(f=>({...f,qual:{...f.qual,[item]:n}}))}
                          style={{flex:1,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                            cursor:"pointer",fontWeight:800,fontSize:13,transition:"all 0.15s",
                            background:score===n?qualColor:score>n?qualColor+"30":T.surfaceAlt,
                            color:score===n?T.white:score>n?qualColor:T.muted,
                            border:`1px solid ${score>=n?qualColor:T.border}`}}>{n}</div>
                      ))}
                    </div>}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {step===2&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:14}}>🧠 CO-IN Filter</div>
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

      <div style={{fontSize:11,color:T.muted,textAlign:"center",marginTop:16,marginBottom:6}}>
        ⚠️ 저장된 데이터는 수정할 수 없습니다. 입력 내용을 다시 한번 확인해 주세요.
      </div>
      <div style={{display:"flex",gap:10}}>
        {step>0&&<button onClick={()=>{setErr("");setStep(s=>s-1);}} style={{...css.btnGhost,flex:1}}>← 이전</button>}
        {step<2
          ?<button onClick={()=>{setErr("");setStep(s=>s+1);}} style={{...css.btnPrimary,flex:2}}>다음 →</button>
          :<button onClick={save} disabled={saving} style={{...css.btnOrange,flex:2,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {saving?<><Spinner size={16} color="#fff"/>저장 중...</>:"💾 오늘의 학습 저장"}
          </button>}
        <button onClick={onCancel} style={{...css.btnGhost,padding:"12px 14px"}}>취소</button>
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
          <div style={{fontSize:14,fontWeight:800,color:T.navy}}>📅 학습 달력</div>
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
        <div style={{position:"fixed",left:tooltip.x,top:tooltip.y-8,transform:"translate(-50%,-100%)",
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
    const recent = all.slice(-7); // 최근 7일
    const oldest = all[0];
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
    const totalErr = Object.values(errTot).reduce((s,v)=>s+v,0);
    const topErr = Object.entries(errTot).sort((a,b)=>b[1]-a[1]).filter(([,v])=>v>0).slice(0,3).map(([k,v])=>`${k}(${v}회)`).join(", ");

    // 과목별 평균 EI
    const subjectMap = {};
    all.forEach(l=>{ if(!subjectMap[l.subject]) subjectMap[l.subject]=[]; subjectMap[l.subject].push(l.engram_index||0); });
    const subjectStats = Object.entries(subjectMap).map(([s,arr])=>
      `${s}: 평균EI ${(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1)}점(${arr.length}회)`
    ).join(", ");

    // 학습 시간 패턴
    const avgNetTime = (recent.reduce((s,l)=>s+(l.net_time||0),0)/recent.length).toFixed(0);
    const avgQCount  = (recent.reduce((s,l)=>s+(l.question_count||0),0)/recent.length).toFixed(0);

    // 전략 지수
    const avgStrategy = (recent.reduce((s,l)=>s+(l.strategy_score||0),0)/recent.length).toFixed(1);
    const avgEfficiency = (recent.reduce((s,l)=>s+(l.efficiency_index||0),0)/recent.length).toFixed(1);

    const prompt = `당신은 20HA META-X 학습 프로그램의 코치 AI입니다.
EI(엔그램 지수): 학습 각인도 종합 점수(100점 만점), C-I: 과잉확신 비율, Q: 지식 결여 오답, M: 실행 오류 오답.

아래 학습 데이터를 바탕으로 학생에게 직접 전달하는 코칭 메시지를 작성해주세요.
조건:
- 반드시 존댓말 사용 (~해요, ~세요)
- 2~3문장
- 이름 언급 금지
- 수치 나열이나 칭찬 위주 금지 — 개선 포인트와 오늘 실천할 구체적 행동 중심으로
- 가장 시급한 문제 1가지만 콕 집어서

EI: 최근7일평균 ${avgEI}점 / 목표 ${profile?.target_ei}점 / 추세 ${eiTrend!==null?(Number(eiTrend)>=0?"+":"")+eiTrend+"점":"유지"}
메타인지: ${metaAcc}% / 과신비율 ${ciRate}%
오답Top3: ${topErr||"없음"}
전략수행: ${avgStrategy}점 / 효율성: ${avgEfficiency}점
학습패턴: 평균 ${avgNetTime}분 / ${avgQCount}문항/회
과목별: ${subjectStats}`;

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
      const snapshot = { avgEI, allAvgEI, metaAcc, ciRate, avgStrategy, avgEfficiency, topErr, subjectStats, avgNetTime, avgQCount };
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
  const normLogs = logs.map(l=>({
    ...l, engramIndex:l.engram_index, strategyScore:l.strategy_score,
    efficiencyIndex:l.efficiency_index, metacognitionAccuracy:l.metacognition_accuracy,
    coinFilter:{cc:l.coin_cc,ci:l.coin_ci,ic:l.coin_ic,ii:l.coin_ii},
    errorAnalysis:{Q1:l.err_q1,Q2:l.err_q2,Q3:l.err_q3,M1:l.err_m1,M2:l.err_m2,M3:l.err_m3},
    subject:l.subject, bookLevel:l.book_level, netTime:l.net_time, questionCount:l.question_count,
    qBasic:l.q_basic||0, qMid:l.q_mid||0, qAdv:l.q_adv||0,
  }));
  const allSubjects=["전체",...new Set(normLogs.map(l=>l.subject))];
  const filtered=subjectFilter==="전체"?normLogs:normLogs.filter(l=>l.subject===subjectFilter);
  const ninetyDaysAgo=new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate()-90);
  const ninetyStr=ninetyDaysAgo.toISOString().slice(0,10);
  const sorted=[...filtered].filter(l=>l.date>=ninetyStr).sort((a,b)=>a.date.localeCompare(b.date));
  const _dateEI={};sorted.forEach(l=>{if(!_dateEI[l.date])_dateEI[l.date]=[];_dateEI[l.date].push(l.engramIndex);});
  const dailyAvg=Object.entries(_dateEI).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,eis])=>({date,engramIndex:+(eis.reduce((s,v)=>s+v,0)/eis.length).toFixed(1)}));
  const maData=dailyAvg.map((d,i)=>{const w=dailyAvg.slice(Math.max(0,i-6),i+1);return{...d,movingAvg:+(w.reduce((s,v)=>s+v.engramIndex,0)/w.length).toFixed(1)};});
  const latest=sorted[sorted.length-1],prev=sorted[sorted.length-2];
  const delta=latest&&prev?+(latest.engramIndex-prev.engramIndex).toFixed(1):null;
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
          {label:"오늘 EI 점수",desc:"최근 학습이 뇌에 얼마나 효과적으로 각인되었는지를 나타내는 종합 점수",kpi:"S(93~) A(81~) B(66~) C(51~) D(~50)\n\n세 가지 역량(전략 수행·풀이 효율·메타인지)을\n종합해 산출하는 학습 각인도 지수입니다.\n점수가 높을수록 오래 기억에 남는 학습을 했다는 의미예요.",value:latest?.engramIndex??"—",color:latest?EI_COLOR(latest.engramIndex):T.navy,sub:delta!==null?`${delta>=0?"▲":"▼"} ${Math.abs(delta)} 어제보다`:null,subColor:delta>=0?T.success:T.danger},
          {label:"목표 달성률",desc:"설정한 목표 점수 대비 현재 도달 정도",kpi:"100%이면 목표 달성, 100% 초과면 목표를 넘어선 상태입니다.\n\n프로필에서 목표 EI를 조정할 수 있어요.",value:latest?((latest.engramIndex/targetEI)*100).toFixed(0):"—",unit:"%",color:T.orange},
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
            const titleIcon=anyDanger?"⚠️":anyWarn?"🟡":"✅";
            const titleText=anyDanger?"메타인지 위험 지표":anyWarn?"메타인지 주의 지표":"메타인지 양호";
            return(
              <div style={{background:bgColor,border:`1px solid ${borderColor}`,borderRadius:10,padding:"10px 14px"}}>
                <div style={{fontSize:11,fontWeight:800,color:titleColor,marginBottom:8}}>{titleIcon} {titleText}</div>
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
            🎓 {c.profile.name} <span style={{opacity:0.7,fontWeight:400}}>({c.profile.grade})</span>
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
          <div style={{fontSize:40,marginBottom:12}}>👨‍👩‍👧</div>
          <div style={{fontSize:16,fontWeight:700,color:T.navy,marginBottom:8}}>연결된 자녀가 없어요</div>
          <div style={{fontSize:13,color:T.muted}}>위에서 자녀의 이메일을 입력해 연결해보세요.</div>
        </Card>
      ) : selChild ? (<>
        {/* 자녀 뷰 탭 */}
        <div style={{display:"flex",gap:2,marginBottom:16,background:T.surfaceAlt,borderRadius:10,padding:4,width:"fit-content"}}>
          {[{v:"dashboard",label:"📊 대시보드"},{v:"history",label:"📅 학습 기록"}].map(({v,label})=>(
            <button key={v} onClick={()=>setChildView(v)}
              style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,
                background:childView===v?T.navy:"transparent",color:childView===v?T.white:T.muted,transition:"all 0.15s"}}>
              {label}
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
// ══════════════════════════════════════════════════════
const AdminDashboard = ({allLogs, allProfiles, onRefresh}) => {
  const [adminTab, setAdminTab] = useState("users"); // "users" | "dashboard"
  const [sel, setSel]           = useState("전체");
  const [editStudent, setEditStudent] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [filterStatus, setFilterStatus] = useState("all"); // "all"|"pending"|"approved"|"rejected"
  const [filterRole, setFilterRole]   = useState("all"); // "all"|"student"|"parent"
  const [detailStudent, setDetailStudent] = useState(null);
  const [dashColFilter, setDashColFilter] = useState({});
  const [dashFilterOpen, setDashFilterOpen] = useState(null);
  const [parentLinks, setParentLinks] = useState({}); // {parent_id: [{student_id, name, grade}]}
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

  const normLogs = allLogs.map(l=>({
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
      p_grade: editStudent.grade,
      p_target_ei: editStudent.target_ei,
      p_approval_status: editStudent.approval_status,
    });
    if(ue) console.error("update error:", ue.message);
    setSaving(false); setEditStudent(null); onRefresh();
  };

  const roleFiltered = filterRole==="all" ? students : students.filter(s=>s.role===filterRole);
  const filteredStudents = filterStatus==="all" ? roleFiltered : roleFiltered.filter(s=>s.approval_status===filterStatus);

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
  if(ciRate>0.3) feedbacks.push({type:"warn",msg:"과잉확신(C-I) 비중이 높습니다. 백지목차 테스트 강도를 높이세요.",icon:"⚠️"});
  if(advLogs.length>0&&avgSec3>180) feedbacks.push({type:"alert",msg:`심화 문항 풀이 평균 ${avgSec3.toFixed(0)}초/문항 — 유형별 심화 학습 세션을 추가하세요.`,icon:"🔴"});
  if(feedbacks.length===0) feedbacks.push({type:"ok",msg:"현재 데이터에서 주요 위험 신호가 감지되지 않았습니다.",icon:"✅"});
  const byStudent=students.filter(s=>s.approval_status==="approved").map(s=>{
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
      {/* Admin tab */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {[
          {key:"users",label:"👥 회원 관리",badge:pendingCount},
          {key:"dashboard",label:"📊 진단 센터"},
        ].map(t=>(
          <button key={t.key} onClick={()=>setAdminTab(t.key)}
            style={{padding:"9px 20px",borderRadius:10,border:`1px solid ${adminTab===t.key?T.navy:T.border}`,cursor:"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:8,
              background:adminTab===t.key?T.navy:T.white,color:adminTab===t.key?T.white:T.muted}}>
            {t.label}
            {t.badge>0&&<span style={{background:T.danger,color:T.white,borderRadius:20,padding:"1px 7px",fontSize:11,fontWeight:800}}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── 회원 관리 탭 ── */}
      {adminTab==="users"&&(
        <div>
          {/* 편집 모달 */}
          {editStudent&&(
            <div style={{position:"fixed",inset:0,background:"rgba(25,29,84,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
              <Card style={{width:"100%",maxWidth:420}}>
                <div style={{fontSize:18,fontWeight:800,color:T.navy,marginBottom:20}}>학생 정보 수정</div>
                <div style={{display:"grid",gap:12}}>
                  {[{label:"이름",key:"name",type:"text"},{label:"학년",key:"grade",type:"sel",opts:GRADES},{label:"목표 EI",key:"target_ei",type:"num",min:50,max:100}].map(({label,key,type,opts,min,max})=>(
                    <div key={key}>
                      <label style={css.label}>{label}</label>
                      {type==="sel"
                        ?<select value={editStudent[key]} onChange={e=>setEditStudent(s=>({...s,[key]:e.target.value}))} style={css.select}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>
                        :<input type={type==="num"?"number":type} min={min} max={max} value={editStudent[key]} onChange={e=>setEditStudent(s=>({...s,[key]:type==="num"?Number(e.target.value):e.target.value}))} style={css.input}/>}
                    </div>
                  ))}
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
              {k:"student", l:`🎓 학생 (${students.filter(s=>s.role==="student").length})`},
              {k:"parent", l:`👨‍👩‍👧 학부모 (${students.filter(s=>s.role==="parent").length})`},
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

          {/* 대기 중 알림 */}
          {pendingCount>0&&filterStatus!=="approved"&&filterStatus!=="rejected"&&(
            <div style={{background:T.orangePale,border:`1px solid ${T.orange}50`,borderRadius:12,padding:"12px 16px",marginBottom:14,fontSize:13,color:T.navy,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>🔔</span>
              <span><strong style={{color:T.orange}}>{pendingCount}명</strong>이 승인을 기다리고 있습니다.</span>
            </div>
          )}

          <Card>
            {filteredStudents.length===0?(
              <div style={{textAlign:"center",padding:"40px 0",color:T.muted,fontSize:13}}>해당 상태의 회원이 없습니다.</div>
            ):(
              <div style={{overflowX:"auto"}}>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1.5fr 1fr 1fr 1.5fr":"2fr 0.8fr 1.2fr 1fr 1.5fr",minWidth:isMobile?480:600}}>
                  {(isMobile?["이름","학년","상태","관리"]:["이름 / 이메일","학년","상태","로그","관리"]).map(h=>(
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
                    <div key={`${s.id}-g`} style={{padding:"12px",fontSize:13,borderBottom:`1px solid ${T.border}`,color:T.textMid,display:"flex",alignItems:"center"}}>{s.grade||"—"}</div>,
                    <div key={`${s.id}-st`} style={{padding:"12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center"}}>{statusBadge(s.approval_status)}</div>,
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
          </Card>
        </div>
      )}

      {/* ── 진단 센터 탭 ── */}
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
                <SectionTitle>🔍 자동 피드백 진단</SectionTitle>
                {feedbacks.map((f,i)=>(
                  <div key={i} style={{padding:"12px 16px",borderRadius:10,marginBottom:i<feedbacks.length-1?8:0,fontSize:13,color:T.navy,
                    background:f.type==="warn"?T.orangePale:f.type==="alert"?"#FEE2E2":"#F0FDF4",
                    border:`1px solid ${f.type==="warn"?T.orange+"50":f.type==="alert"?T.danger+"40":T.success+"40"}`}}>
                    {f.icon} {f.msg}
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
    </div>
  );
};

// ══════════════════════════════════════════════════════
// LOG HISTORY
// ══════════════════════════════════════════════════════
const LogHistory = ({logs, onDelete, isAdmin, allProfiles}) => {
  const sorted=[...logs].sort((a,b)=>b.date.localeCompare(a.date));
  const nameMap=Object.fromEntries((allProfiles||[]).map(p=>[p.id,p.name]));
  if(sorted.length===0) return <div style={{textAlign:"center",padding:"80px 20px",color:T.muted,fontSize:14}}>학습 기록이 없습니다.</div>;
  const grouped={};sorted.forEach(log=>{if(!grouped[log.date])grouped[log.date]=[];grouped[log.date].push(log);});
  const dates=Object.keys(grouped).sort((a,b)=>b.localeCompare(a));
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
        {isAdmin&&<button onClick={()=>onDelete(log.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18,padding:4,flexShrink:0}}>✕</button>}
      </Card>
    );
  };
  return(
    <div>
      {dates.map(date=>(
        <div key={date} style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:T.muted,marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:6}}>
            📅 {date}
            <span style={{fontSize:11,color:T.border,fontWeight:400}}>({grouped[date].length}건)</span>
          </div>
          {grouped[date].map(log=><LogCard key={log.id} log={log}/>)}
        </div>
      ))}
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
            <span style={{fontSize:12,fontWeight:800,color:g.color}}>{g.min}~{g.max}점</span>
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
  const [name, setName]           = useState(profile.name||"");
  const [grade, setGrade]         = useState(profile.grade||"고1");
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
    await supabase.from("profiles").update({name, grade, target_ei:targetEI, avatar_url:avatarUrl, updated_at:new Date().toISOString()}).eq("id", profile.id);
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
    setTimeout(()=>onSave({...profile,name,grade,target_ei:GRADE_MIN[target]||85,avatar_url:avatarUrl}), 800);
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
                  : <span>{profile.role==="admin"?"👨‍💼":"🎓"}</span>
              }
            </div>
            <div style={{position:"absolute",bottom:0,right:0,width:24,height:24,background:T.orange,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}>📷</div>
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
              <label style={css.label}>학년</label>
              <select value={grade} onChange={e=>setGrade(e.target.value)} style={css.select}>
                {GRADES.map(g=><option key={g} value={g}>{g}</option>)}
              </select>
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
    {nav.map(n=>(
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
  const getInitialView = () => {
    const path = window.location.pathname;
    if(path === "/history") return "history";
    if(path === "/input") return "input";
    return "dashboard";
  };
  const [view, setView]           = useState(getInitialView);
  const [showInput, setShowInput] = useState(window.location.pathname === "/input");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const isMobile = useMobile();

  // URL ↔ 상태 동기화
  const navigate = (v, input=false) => {
    const path = input ? "/input" : v === "history" ? "/history" : "/";
    window.history.pushState({ view:v, input }, "", path);
    setView(v);
    setShowInput(input);
  };

  useEffect(() => {
    const onPop = (e) => {
      const s = e.state;
      if(s) { setView(s.view||"dashboard"); setShowInput(s.input||false); }
      else   { setView("dashboard"); setShowInput(false); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const loadUserData = async (sess) => {
    if(!sess?.user) { setAuthState("unauthenticated"); return; }
    const uid = sess.user.id;
    const { data: prof, error } = await supabase
      .from("profiles").select("*").eq("id", uid).single();

    // 프로필 없음 → 소셜 최초 or 미완성 세션 → 로그아웃
    if(!prof || error) {
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
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
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
  const NAV = isAdmin
    ? [{ key:"dashboard", label:"진단 센터", icon:"🔍" }, { key:"history", label:"전체 기록", icon:"📅" }]
    : isParent
      ? [{ key:"dashboard", label:"자녀 현황", icon:"👨‍👩‍👧" }]
      : [{ key:"dashboard", label:"대시보드", icon:"📊" }, { key:"history", label:"학습 기록", icon:"📅" }];
  const pendingCount = allProfiles.filter(p => (p.role==="student"||p.role==="parent") && p.approval_status==="pending").length;

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Noto Sans KR',sans-serif", color:T.text, overflowX:"hidden" }}>
      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:100, borderBottom:`1px solid ${T.border}`,
        background:T.surface, boxShadow:"0 1px 6px rgba(25,29,84,0.06)" }}>
        <div style={{ maxWidth:960, margin:"0 auto", display:"flex", alignItems:"center",
          height:isMobile?56:60, gap:16, padding:`0 ${isMobile?16:24}px` }}>
          <Logo size={isMobile?"sm":"md"} headerMode={true} onClick={()=>navigate("dashboard",false)}/>
          {!isMobile && (
            <div style={{ display:"flex", gap:2, flex:1 }}>
              {NAV.map(n => (
                <button key={n.key} onClick={() => navigate(n.key, false)}
                  style={{ padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer",
                    fontSize:13, fontWeight:600,
                    background:view===n.key&&!showInput ? T.navy+"0e" : "transparent",
                    color:view===n.key&&!showInput ? T.navy : T.muted }}>
                  {n.icon} {n.label}
                </button>
              ))}
            </div>
          )}
          <div style={{ flex:isMobile?1:0 }}/>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {isAdmin && pendingCount > 0 && (
              <div style={{ background:T.danger, color:T.white, borderRadius:20,
                padding:"3px 10px", fontSize:11, fontWeight:800, cursor:"pointer" }}
                onClick={() => { setView("dashboard"); setShowInput(false); }}>
                🔔 {pendingCount}명 승인 대기
              </div>
            )}
            {!isAdmin && !isParent && !isMobile && (
              <button onClick={() => navigate(view, true)} style={{ padding:"8px 18px", borderRadius:8,
                border:"none", cursor:"pointer", fontSize:13, fontWeight:700,
                background:T.orange, color:T.white, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{fontSize:16,fontWeight:300}}>+</span> 학습 입력
              </button>
            )}
            <button onClick={()=>window.open("/manual.html","_blank")}
              title="도움말"
              style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${T.border}`,
                background:"transparent", color:T.muted, cursor:"pointer", fontSize:13, fontWeight:700,
                display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
              {isMobile ? "?" : "❓ 도움말"}
            </button>
            {!isMobile && <div style={{ height:24, width:1, background:T.border }}/>}
            <div onClick={()=>setShowProfileModal(true)}
              style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", padding:"4px 8px", borderRadius:8,
                transition:"background 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.background=T.surfaceAlt}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ width:30, height:30, borderRadius:10, background:T.grad,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, color:T.white, flexShrink:0, overflow:"hidden" }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : isAdmin ? "👨‍💼" : profile.name?.charAt(0)||"🎓"}
              </div>
              {!isMobile && <span style={{ fontSize:13, color:T.navy, fontWeight:700 }}>{profile.name}</span>}
              {!isMobile && (isAdmin
                ? <Pill color={T.orange}>관리자</Pill>
                : <Pill color={T.navyMid}>{profile.grade}</Pill>)}
              {!isMobile && <span style={{fontSize:11,color:T.muted}}>✎</span>}
            </div>
            <button onClick={handleLogout} style={{ padding:"5px 10px", borderRadius:8,
              border:`1px solid ${T.border}`, background:T.white, color:T.muted,
              cursor:"pointer", fontSize:isMobile?11:12, whiteSpace:"nowrap" }}>로그아웃</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:960, margin:"0 auto",
        padding:isMobile?"16px 12px 100px":"28px 24px 60px" }}>
        {showInput ? (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <button onClick={() => navigate(view, false)}
                style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:22 }}>←</button>
              <div>
                <div style={{ fontSize:isMobile?16:18, fontWeight:800, color:T.navy }}>오늘의 학습 데이터 입력</div>
                <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>정직하게 입력할수록 EI의 정확도가 높아집니다.</div>
              </div>
            </div>
            <DataInputForm uid={session.user.id}
              onSave={() => { navigate(view, false); refreshData(); }}
              onCancel={() => navigate(view, false)}/>
          </div>
        ) : view === "dashboard" ? (
          isAdmin
            ? <AdminDashboard allLogs={logs} allProfiles={allProfiles} onRefresh={refreshData}/>
            : isParent
              ? <ParentDashboard
                  children={children}
                  selChildId={selChildId}
                  setSelChildId={setSelChildId}
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

      {isMobile && <BottomNav nav={NAV} view={view} showInput={showInput} onNavigate={navigate} isAdmin={isAdmin||isParent}/>}
      {showEISetup && <EISetupModal profile={profile} logs={logs} onSave={(t)=>{setProfile(p=>({...p,target_ei:t}));setShowEISetup(false);}}/> }
      {showProfileModal && <ProfileModal profile={profile} onClose={()=>setShowProfileModal(false)} onSave={(updated)=>{setProfile(updated);setShowProfileModal(false);}} onDelete={()=>{setShowProfileModal(false);handleLogout();}}/>}
    </div>
  );
}
