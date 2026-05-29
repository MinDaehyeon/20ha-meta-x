// 공통 UI 컴포넌트 — App.jsx에서 분리 (2026-05-28)
// 동작 변경 0: 정의 그대로 이동

import { useState } from "react";
import { T } from "../styles/theme";

export const Card = ({children,style={}}) => (
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 6px rgba(25,29,84,0.06)",animation:"fadeIn 0.3s ease",...style}}>{children}</div>
);

export const Pill = ({children,color=T.navy}) => (
  <span style={{background:color+"18",color,border:`1px solid ${color}30`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,letterSpacing:"0.04em",whiteSpace:"nowrap"}}>{children}</span>
);

export const NavyNum = ({value,unit="",size=32,color=T.navy}) => (
  <div style={{display:"flex",alignItems:"baseline",gap:3}}>
    <span style={{fontSize:size,fontWeight:900,color,fontFamily:"'DM Mono','Courier New',monospace",lineHeight:1}}>{value}</span>
    {unit&&<span style={{fontSize:12,color:T.muted,fontWeight:600}}>{unit}</span>}
  </div>
);

// sub = "tag1 · tag2 · tag3" string, tooltip = detailed explanation
export const SectionTitle = ({children,sub,tooltip}) => {
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

export const Divider = () => <div style={{height:1,background:T.border,margin:"16px 0"}} />;

export const Spinner = ({size=24,color=T.navy}) => (
  <div style={{width:size,height:size,border:`3px solid ${T.border}`,borderTop:`3px solid ${color}`,borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}} />
);

export const ChartTip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",fontSize:11,boxShadow:"0 2px 8px rgba(25,29,84,0.10)"}}>
      <div style={{color:T.muted,marginBottom:4,fontWeight:600,fontSize:10}}>{label}</div>
      {payload.map((p,i)=>{const v=p.value;const displayName=p.name==="value"?label:p.name;const isErrCode=/^[QM][1-3]$/.test(displayName);const isSpeed=displayName==="기본"||displayName==="응용"||displayName==="심화";const isCount=isErrCode||displayName&&(displayName.includes("회")||displayName.includes("건")||displayName.includes("오답")||displayName.includes("횟수"));const disp=typeof v==="number"?(Number.isInteger(v)||isCount||isSpeed?Math.round(v):v.toFixed(1)):v;if(isErrCode)return<div key={i} style={{color:p.color||T.navy,fontWeight:700,fontSize:12,lineHeight:1.8}}>{displayName} {disp}</div>;return<div key={i} style={{color:p.color||T.navy,fontWeight:700,fontSize:11}}>{displayName}: {disp}{isSpeed?"초":isCount?"회":""}</div>;})}
    </div>
  );
};
