import{d as _,F as r,a2 as L,hz as M,hy as T,hx as A,hA as H,x,as as k,ae as R,a1 as d,ah as w,a4 as X,a7 as V,hH as Y,al as W,aa as F,r as E,hI as U,b as K,o as Z,y as J,w as P,e as S,a as j,z as Q,u as z,i as ee,t as q,E as re,B as te,g as O}from"./index-CucaxZT9.js";import{d as ie}from"./test-XTGAg7y8.js";const oe={success:r(H,null),error:r(A,null),warning:r(T,null),info:r(M,null)},ne=_({name:"ProgressCircle",props:{clsPrefix:{type:String,required:!0},status:{type:String,required:!0},strokeWidth:{type:Number,required:!0},fillColor:[String,Object],railColor:String,railStyle:[String,Object],percentage:{type:Number,default:0},offsetDegree:{type:Number,default:0},showIndicator:{type:Boolean,required:!0},indicatorTextColor:String,unit:String,viewBoxWidth:{type:Number,required:!0},gapDegree:{type:Number,required:!0},gapOffsetDegree:{type:Number,default:0}},setup(e,{slots:f}){function g(o,n,i,a){const{gapDegree:u,viewBoxWidth:m,strokeWidth:y}=e,c=50,l=0,p=c,t=0,s=2*c,b=50+y/2,$=`M ${b},${b} m ${l},${p}
      a ${c},${c} 0 1 1 ${t},-100
      a ${c},${c} 0 1 1 0,${s}`,v=Math.PI*2*c,C={stroke:a==="rail"?i:typeof e.fillColor=="object"?"url(#gradient)":i,strokeDasharray:`${o/100*(v-u)}px ${m*8}px`,strokeDashoffset:`-${u/2}px`,transformOrigin:n?"center":void 0,transform:n?`rotate(${n}deg)`:void 0};return{pathString:$,pathStyle:C}}const h=()=>{const o=typeof e.fillColor=="object",n=o?e.fillColor.stops[0]:"",i=o?e.fillColor.stops[1]:"";return o&&r("defs",null,r("linearGradient",{id:"gradient",x1:"0%",y1:"100%",x2:"100%",y2:"0%"},r("stop",{offset:"0%","stop-color":n}),r("stop",{offset:"100%","stop-color":i})))};return()=>{const{fillColor:o,railColor:n,strokeWidth:i,offsetDegree:a,status:u,percentage:m,showIndicator:y,indicatorTextColor:c,unit:l,gapOffsetDegree:p,clsPrefix:t}=e,{pathString:s,pathStyle:b}=g(100,0,n,"rail"),{pathString:$,pathStyle:v}=g(m,a,o,"fill"),C=100+i;return r("div",{class:`${t}-progress-content`,role:"none"},r("div",{class:`${t}-progress-graph`,"aria-hidden":!0},r("div",{class:`${t}-progress-graph-circle`,style:{transform:p?`rotate(${p}deg)`:void 0}},r("svg",{viewBox:`0 0 ${C} ${C}`},h(),r("g",null,r("path",{class:`${t}-progress-graph-circle-rail`,d:s,"stroke-width":i,"stroke-linecap":"round",fill:"none",style:b})),r("g",null,r("path",{class:[`${t}-progress-graph-circle-fill`,m===0&&`${t}-progress-graph-circle-fill--empty`],d:$,"stroke-width":i,"stroke-linecap":"round",fill:"none",style:v}))))),y?r("div",null,f.default?r("div",{class:`${t}-progress-custom-content`,role:"none"},f.default()):u!=="default"?r("div",{class:`${t}-progress-icon`,"aria-hidden":!0},r(L,{clsPrefix:t},{default:()=>oe[u]})):r("div",{class:`${t}-progress-text`,style:{color:c},role:"none"},r("span",{class:`${t}-progress-text__percentage`},m),r("span",{class:`${t}-progress-text__unit`},l))):null)}}}),le={success:r(H,null),error:r(A,null),warning:r(T,null),info:r(M,null)},ae=_({name:"ProgressLine",props:{clsPrefix:{type:String,required:!0},percentage:{type:Number,default:0},railColor:String,railStyle:[String,Object],fillColor:[String,Object],status:{type:String,required:!0},indicatorPlacement:{type:String,required:!0},indicatorTextColor:String,unit:{type:String,default:"%"},processing:{type:Boolean,required:!0},showIndicator:{type:Boolean,required:!0},height:[String,Number],railBorderRadius:[String,Number],fillBorderRadius:[String,Number]},setup(e,{slots:f}){const g=x(()=>k(e.height)),h=x(()=>{var i,a;return typeof e.fillColor=="object"?`linear-gradient(to right, ${(i=e.fillColor)===null||i===void 0?void 0:i.stops[0]} , ${(a=e.fillColor)===null||a===void 0?void 0:a.stops[1]})`:e.fillColor}),o=x(()=>e.railBorderRadius!==void 0?k(e.railBorderRadius):e.height!==void 0?k(e.height,{c:.5}):""),n=x(()=>e.fillBorderRadius!==void 0?k(e.fillBorderRadius):e.railBorderRadius!==void 0?k(e.railBorderRadius):e.height!==void 0?k(e.height,{c:.5}):"");return()=>{const{indicatorPlacement:i,railColor:a,railStyle:u,percentage:m,unit:y,indicatorTextColor:c,status:l,showIndicator:p,processing:t,clsPrefix:s}=e;return r("div",{class:`${s}-progress-content`,role:"none"},r("div",{class:`${s}-progress-graph`,"aria-hidden":!0},r("div",{class:[`${s}-progress-graph-line`,{[`${s}-progress-graph-line--indicator-${i}`]:!0}]},r("div",{class:`${s}-progress-graph-line-rail`,style:[{backgroundColor:a,height:g.value,borderRadius:o.value},u]},r("div",{class:[`${s}-progress-graph-line-fill`,t&&`${s}-progress-graph-line-fill--processing`],style:{maxWidth:`${e.percentage}%`,background:h.value,height:g.value,lineHeight:g.value,borderRadius:n.value}},i==="inside"?r("div",{class:`${s}-progress-graph-line-indicator`,style:{color:c}},f.default?f.default():`${m}${y}`):null)))),p&&i==="outside"?r("div",null,f.default?r("div",{class:`${s}-progress-custom-content`,style:{color:c},role:"none"},f.default()):l==="default"?r("div",{role:"none",class:`${s}-progress-icon ${s}-progress-icon--as-text`,style:{color:c}},m,y):r("div",{class:`${s}-progress-icon`,"aria-hidden":!0},r(L,{clsPrefix:s},{default:()=>le[l]}))):null)}}});function G(e,f,g=100){return`m ${g/2} ${g/2-e} a ${e} ${e} 0 1 1 0 ${2*e} a ${e} ${e} 0 1 1 0 -${2*e}`}const se=_({name:"ProgressMultipleCircle",props:{clsPrefix:{type:String,required:!0},viewBoxWidth:{type:Number,required:!0},percentage:{type:Array,default:[0]},strokeWidth:{type:Number,required:!0},circleGap:{type:Number,required:!0},showIndicator:{type:Boolean,required:!0},fillColor:{type:Array,default:()=>[]},railColor:{type:Array,default:()=>[]},railStyle:{type:Array,default:()=>[]}},setup(e,{slots:f}){const g=x(()=>e.percentage.map((n,i)=>`${Math.PI*n/100*(e.viewBoxWidth/2-e.strokeWidth/2*(1+2*i)-e.circleGap*i)*2}, ${e.viewBoxWidth*8}`)),h=(o,n)=>{const i=e.fillColor[n],a=typeof i=="object"?i.stops[0]:"",u=typeof i=="object"?i.stops[1]:"";return typeof e.fillColor[n]=="object"&&r("linearGradient",{id:`gradient-${n}`,x1:"100%",y1:"0%",x2:"0%",y2:"100%"},r("stop",{offset:"0%","stop-color":a}),r("stop",{offset:"100%","stop-color":u}))};return()=>{const{viewBoxWidth:o,strokeWidth:n,circleGap:i,showIndicator:a,fillColor:u,railColor:m,railStyle:y,percentage:c,clsPrefix:l}=e;return r("div",{class:`${l}-progress-content`,role:"none"},r("div",{class:`${l}-progress-graph`,"aria-hidden":!0},r("div",{class:`${l}-progress-graph-circle`},r("svg",{viewBox:`0 0 ${o} ${o}`},r("defs",null,c.map((p,t)=>h(p,t))),c.map((p,t)=>r("g",{key:t},r("path",{class:`${l}-progress-graph-circle-rail`,d:G(o/2-n/2*(1+2*t)-i*t,n,o),"stroke-width":n,"stroke-linecap":"round",fill:"none",style:[{strokeDashoffset:0,stroke:m[t]},y[t]]}),r("path",{class:[`${l}-progress-graph-circle-fill`,p===0&&`${l}-progress-graph-circle-fill--empty`],d:G(o/2-n/2*(1+2*t)-i*t,n,o),"stroke-width":n,"stroke-linecap":"round",fill:"none",style:{strokeDasharray:g.value[t],strokeDashoffset:0,stroke:typeof u[t]=="object"?`url(#gradient-${t})`:u[t]}})))))),a&&f.default?r("div",null,r("div",{class:`${l}-progress-text`},f.default())):null)}}}),ce=R([d("progress",{display:"inline-block"},[d("progress-icon",`
 color: var(--n-icon-color);
 transition: color .3s var(--n-bezier);
 `),w("line",`
 width: 100%;
 display: block;
 `,[d("progress-content",`
 display: flex;
 align-items: center;
 `,[d("progress-graph",{flex:1})]),d("progress-custom-content",{marginLeft:"14px"}),d("progress-icon",`
 width: 30px;
 padding-left: 14px;
 height: var(--n-icon-size-line);
 line-height: var(--n-icon-size-line);
 font-size: var(--n-icon-size-line);
 `,[w("as-text",`
 color: var(--n-text-color-line-outer);
 text-align: center;
 width: 40px;
 font-size: var(--n-font-size);
 padding-left: 4px;
 transition: color .3s var(--n-bezier);
 `)])]),w("circle, dashboard",{width:"120px"},[d("progress-custom-content",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 justify-content: center;
 `),d("progress-text",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 color: inherit;
 font-size: var(--n-font-size-circle);
 color: var(--n-text-color-circle);
 font-weight: var(--n-font-weight-circle);
 transition: color .3s var(--n-bezier);
 white-space: nowrap;
 `),d("progress-icon",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 color: var(--n-icon-color);
 font-size: var(--n-icon-size-circle);
 `)]),w("multiple-circle",`
 width: 200px;
 color: inherit;
 `,[d("progress-text",`
 font-weight: var(--n-font-weight-circle);
 color: var(--n-text-color-circle);
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 justify-content: center;
 transition: color .3s var(--n-bezier);
 `)]),d("progress-content",{position:"relative"}),d("progress-graph",{position:"relative"},[d("progress-graph-circle",[R("svg",{verticalAlign:"bottom"}),d("progress-graph-circle-fill",`
 stroke: var(--n-fill-color);
 transition:
 opacity .3s var(--n-bezier),
 stroke .3s var(--n-bezier),
 stroke-dasharray .3s var(--n-bezier);
 `,[w("empty",{opacity:0})]),d("progress-graph-circle-rail",`
 transition: stroke .3s var(--n-bezier);
 overflow: hidden;
 stroke: var(--n-rail-color);
 `)]),d("progress-graph-line",[w("indicator-inside",[d("progress-graph-line-rail",`
 height: 16px;
 line-height: 16px;
 border-radius: 10px;
 `,[d("progress-graph-line-fill",`
 height: inherit;
 border-radius: 10px;
 `),d("progress-graph-line-indicator",`
 background: #0000;
 white-space: nowrap;
 text-align: right;
 margin-left: 14px;
 margin-right: 14px;
 height: inherit;
 font-size: 12px;
 color: var(--n-text-color-line-inner);
 transition: color .3s var(--n-bezier);
 `)])]),w("indicator-inside-label",`
 height: 16px;
 display: flex;
 align-items: center;
 `,[d("progress-graph-line-rail",`
 flex: 1;
 transition: background-color .3s var(--n-bezier);
 `),d("progress-graph-line-indicator",`
 background: var(--n-fill-color);
 font-size: 12px;
 transform: translateZ(0);
 display: flex;
 vertical-align: middle;
 height: 16px;
 line-height: 16px;
 padding: 0 10px;
 border-radius: 10px;
 position: absolute;
 white-space: nowrap;
 color: var(--n-text-color-line-inner);
 transition:
 right .2s var(--n-bezier),
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `)]),d("progress-graph-line-rail",`
 position: relative;
 overflow: hidden;
 height: var(--n-rail-height);
 border-radius: 5px;
 background-color: var(--n-rail-color);
 transition: background-color .3s var(--n-bezier);
 `,[d("progress-graph-line-fill",`
 background: var(--n-fill-color);
 position: relative;
 border-radius: 5px;
 height: inherit;
 width: 100%;
 max-width: 0%;
 transition:
 background-color .3s var(--n-bezier),
 max-width .2s var(--n-bezier);
 `,[w("processing",[R("&::after",`
 content: "";
 background-image: var(--n-line-bg-processing);
 animation: progress-processing-animation 2s var(--n-bezier) infinite;
 `)])])])])])]),R("@keyframes progress-processing-animation",`
 0% {
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 100%;
 opacity: 1;
 }
 66% {
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 0;
 }
 100% {
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 0;
 }
 `)]),de=Object.assign(Object.assign({},V.props),{processing:Boolean,type:{type:String,default:"line"},gapDegree:Number,gapOffsetDegree:Number,status:{type:String,default:"default"},railColor:[String,Array],railStyle:[String,Array],color:[String,Array,Object],viewBoxWidth:{type:Number,default:100},strokeWidth:{type:Number,default:7},percentage:[Number,Array],unit:{type:String,default:"%"},showIndicator:{type:Boolean,default:!0},indicatorPosition:{type:String,default:"outside"},indicatorPlacement:{type:String,default:"outside"},indicatorTextColor:String,circleGap:{type:Number,default:1},height:Number,borderRadius:[String,Number],fillBorderRadius:[String,Number],offsetDegree:Number}),ue=_({name:"Progress",props:de,setup(e){const f=x(()=>e.indicatorPlacement||e.indicatorPosition),g=x(()=>{if(e.gapDegree||e.gapDegree===0)return e.gapDegree;if(e.type==="dashboard")return 75}),{mergedClsPrefixRef:h,inlineThemeDisabled:o}=X(e),n=V("Progress","-progress",ce,Y,e,h),i=x(()=>{const{status:u}=e,{common:{cubicBezierEaseInOut:m},self:{fontSize:y,fontSizeCircle:c,railColor:l,railHeight:p,iconSizeCircle:t,iconSizeLine:s,textColorCircle:b,textColorLineInner:$,textColorLineOuter:v,lineBgProcessing:C,fontWeightCircle:D,[W("iconColor",u)]:N,[W("fillColor",u)]:B}}=n.value;return{"--n-bezier":m,"--n-fill-color":B,"--n-font-size":y,"--n-font-size-circle":c,"--n-font-weight-circle":D,"--n-icon-color":N,"--n-icon-size-circle":t,"--n-icon-size-line":s,"--n-line-bg-processing":C,"--n-rail-color":l,"--n-rail-height":p,"--n-text-color-circle":b,"--n-text-color-line-inner":$,"--n-text-color-line-outer":v}}),a=o?F("progress",x(()=>e.status[0]),i,e):void 0;return{mergedClsPrefix:h,mergedIndicatorPlacement:f,gapDeg:g,cssVars:o?void 0:i,themeClass:a?.themeClass,onRender:a?.onRender}},render(){const{type:e,cssVars:f,indicatorTextColor:g,showIndicator:h,status:o,railColor:n,railStyle:i,color:a,percentage:u,viewBoxWidth:m,strokeWidth:y,mergedIndicatorPlacement:c,unit:l,borderRadius:p,fillBorderRadius:t,height:s,processing:b,circleGap:$,mergedClsPrefix:v,gapDeg:C,gapOffsetDegree:D,themeClass:N,$slots:B,onRender:I}=this;return I?.(),r("div",{class:[N,`${v}-progress`,`${v}-progress--${e}`,`${v}-progress--${o}`],style:f,"aria-valuemax":100,"aria-valuemin":0,"aria-valuenow":u,role:e==="circle"||e==="line"||e==="dashboard"?"progressbar":"none"},e==="circle"||e==="dashboard"?r(ne,{clsPrefix:v,status:o,showIndicator:h,indicatorTextColor:g,railColor:n,fillColor:a,railStyle:i,offsetDegree:this.offsetDegree,percentage:u,viewBoxWidth:m,strokeWidth:y,gapDegree:C===void 0?e==="dashboard"?75:0:C,gapOffsetDegree:D,unit:l},B):e==="line"?r(ae,{clsPrefix:v,status:o,showIndicator:h,indicatorTextColor:g,railColor:n,fillColor:a,railStyle:i,percentage:u,processing:b,indicatorPlacement:c,unit:l,fillBorderRadius:t,railBorderRadius:p,height:s},B):e==="multiple-circle"?r(se,{clsPrefix:v,strokeWidth:y,railColor:n,fillColor:a,railStyle:i,viewBoxWidth:m,percentage:u,showIndicator:h,circleGap:$},B):null)}}),fe=_({__name:"DownLoadWithProgress",emits:["update"],setup(e,{emit:f}){const g=f,h=E("https://images.unsplash.com/photo-1663529628961-80aa6ebcd157?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80"),{downloading:o,abort:n,send:i,data:a}=U(ie(h.value),{immediate:!1}),u=x(()=>o.value.loaded?Math.floor(o.value.loaded/o.value.total*100):0);async function m(){await i(),g("update","fileOk"),y(a.value,"fileOk")}function y(c,l){const p=URL.createObjectURL(c),t=document.createElement("a");t.download=l,t.style.display="none",t.href=p,document.body.appendChild(t),t.click(),document.body.removeChild(t)}return(c,l)=>{const p=Q,t=ue,s=te,b=re,$=J;return Z(),K($,{title:"带进度的下载文件",size:"small"},{default:P(()=>[S(b,{vertical:""},{default:P(()=>[S(p,{value:z(h),"onUpdate:value":l[0]||(l[0]=v=>ee(h)?h.value=v:null)},null,8,["value"]),j("div",null,"文件大小："+q(z(o).total)+"B",1),j("div",null,"已下载："+q(z(o).loaded)+"B",1),S(t,{type:"line","indicator-placement":"inside",percentage:z(u)},null,8,["percentage"]),S(b,null,{default:P(()=>[S(s,{strong:"",secondary:"",onClick:m},{default:P(()=>l[1]||(l[1]=[O(" 开始下载 ")])),_:1}),S(s,{strong:"",secondary:"",type:"warning",onClick:z(n)},{default:P(()=>l[2]||(l[2]=[O(" 中断下载 ")])),_:1},8,["onClick"])]),_:1})]),_:1})]),_:1})}}});export{fe as _};
