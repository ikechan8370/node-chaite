import M from"./MessageContentCard-CjL6sc3W.js";import{aV as H,a6 as K,bM as L,a7 as i,ay as g,ax as f,ak as s,d as w,aa as B,ad as P,p as m,aN as U,aU as q,q as S,aE as $,aP as G,bk as J,s as C,am as v,bc as Q,ag as X,b as x,o as u,w as z,e as b,u as p,bo as Y,c as T,I as Z,F as ee,A as te,n as ie,K as ne,bp as oe}from"./index-Dp1faHeH.js";import{N as re}from"./Spin-Cy3cVx8W.js";let _=!1;function le(){if(H&&window.CSS&&!_&&(_=!0,"registerProperty"in window?.CSS))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function se(e){const{textColor3:n,infoColor:o,errorColor:l,successColor:t,warningColor:a,textColor1:r,textColor2:d,railColor:c,fontWeightStrong:h,fontSize:y}=e;return Object.assign(Object.assign({},L),{contentFontSize:y,titleFontWeight:h,circleBorder:`2px solid ${n}`,circleBorderInfo:`2px solid ${o}`,circleBorderError:`2px solid ${l}`,circleBorderSuccess:`2px solid ${t}`,circleBorderWarning:`2px solid ${a}`,iconColor:n,iconColorInfo:o,iconColorError:l,iconColorSuccess:t,iconColorWarning:a,titleTextColor:r,contentTextColor:d,metaTextColor:n,lineColor:c})}const ae={common:K,self:se},k=1.25,ce=i("timeline",`
 position: relative;
 width: 100%;
 display: flex;
 flex-direction: column;
 line-height: ${k};
`,[g("horizontal",`
 flex-direction: row;
 `,[f(">",[i("timeline-item",`
 flex-shrink: 0;
 padding-right: 40px;
 `,[g("dashed-line-type",[f(">",[i("timeline-item-timeline",[s("line",`
 background-image: linear-gradient(90deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 10px 1px;
 `)])])]),f(">",[i("timeline-item-content",`
 margin-top: calc(var(--n-icon-size) + 12px);
 `,[f(">",[s("meta",`
 margin-top: 6px;
 margin-bottom: unset;
 `)])]),i("timeline-item-timeline",`
 width: 100%;
 height: calc(var(--n-icon-size) + 12px);
 `,[s("line",`
 left: var(--n-icon-size);
 top: calc(var(--n-icon-size) / 2 - 1px);
 right: 0px;
 width: unset;
 height: 2px;
 `)])])])])]),g("right-placement",[i("timeline-item",[i("timeline-item-content",`
 text-align: right;
 margin-right: calc(var(--n-icon-size) + 12px);
 `),i("timeline-item-timeline",`
 width: var(--n-icon-size);
 right: 0;
 `)])]),g("left-placement",[i("timeline-item",[i("timeline-item-content",`
 margin-left: calc(var(--n-icon-size) + 12px);
 `),i("timeline-item-timeline",`
 left: 0;
 `)])]),i("timeline-item",`
 position: relative;
 `,[f("&:last-child",[i("timeline-item-timeline",[s("line",`
 display: none;
 `)]),i("timeline-item-content",[s("meta",`
 margin-bottom: 0;
 `)])]),i("timeline-item-content",[s("title",`
 margin: var(--n-title-margin);
 font-size: var(--n-title-font-size);
 transition: color .3s var(--n-bezier);
 font-weight: var(--n-title-font-weight);
 color: var(--n-title-text-color);
 `),s("content",`
 transition: color .3s var(--n-bezier);
 font-size: var(--n-content-font-size);
 color: var(--n-content-text-color);
 `),s("meta",`
 transition: color .3s var(--n-bezier);
 font-size: 12px;
 margin-top: 6px;
 margin-bottom: 20px;
 color: var(--n-meta-text-color);
 `)]),g("dashed-line-type",[i("timeline-item-timeline",[s("line",`
 --n-color-start: var(--n-line-color);
 transition: --n-color-start .3s var(--n-bezier);
 background-color: transparent;
 background-image: linear-gradient(180deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 1px 10px;
 `)])]),i("timeline-item-timeline",`
 width: calc(var(--n-icon-size) + 12px);
 position: absolute;
 top: calc(var(--n-title-font-size) * ${k} / 2 - var(--n-icon-size) / 2);
 height: 100%;
 `,[s("circle",`
 border: var(--n-circle-border);
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 border-radius: var(--n-icon-size);
 box-sizing: border-box;
 `),s("icon",`
 color: var(--n-icon-color);
 font-size: var(--n-icon-size);
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 display: flex;
 align-items: center;
 justify-content: center;
 `),s("line",`
 transition: background-color .3s var(--n-bezier);
 position: absolute;
 top: var(--n-icon-size);
 left: calc(var(--n-icon-size) / 2 - 1px);
 bottom: 0px;
 width: 2px;
 background-color: var(--n-line-color);
 `)])])]),me=Object.assign(Object.assign({},P.props),{horizontal:Boolean,itemPlacement:{type:String,default:"left"},size:{type:String,default:"medium"},iconSize:Number}),N=U("n-timeline"),de=w({name:"Timeline",props:me,setup(e,{slots:n}){const{mergedClsPrefixRef:o}=B(e),l=P("Timeline","-timeline",ce,ae,e,o);return q(N,{props:e,mergedThemeRef:l,mergedClsPrefixRef:o}),()=>{const{value:t}=o;return m("div",{class:[`${t}-timeline`,e.horizontal&&`${t}-timeline--horizontal`,`${t}-timeline--${e.size}-size`,!e.horizontal&&`${t}-timeline--${e.itemPlacement}-placement`]},n)}}}),pe={time:[String,Number],title:String,content:String,color:String,lineType:{type:String,default:"default"},type:{type:String,default:"default"}},ue=w({name:"TimelineItem",props:pe,slots:Object,setup(e){const n=G(N);n||J("timeline-item","`n-timeline-item` must be placed inside `n-timeline`."),le();const{inlineThemeDisabled:o}=B(),l=C(()=>{const{props:{size:a,iconSize:r},mergedThemeRef:d}=n,{type:c}=e,{self:{titleTextColor:h,contentTextColor:y,metaTextColor:j,lineColor:I,titleFontWeight:R,contentFontSize:V,[v("iconSize",a)]:D,[v("titleMargin",a)]:E,[v("titleFontSize",a)]:F,[v("circleBorder",c)]:O,[v("iconColor",c)]:W},common:{cubicBezierEaseInOut:A}}=d.value;return{"--n-bezier":A,"--n-circle-border":O,"--n-icon-color":W,"--n-content-font-size":V,"--n-content-text-color":y,"--n-line-color":I,"--n-meta-text-color":j,"--n-title-font-size":F,"--n-title-font-weight":R,"--n-title-margin":E,"--n-title-text-color":h,"--n-icon-size":Q(r)||D}}),t=o?X("timeline-item",C(()=>{const{props:{size:a,iconSize:r}}=n,{type:d}=e;return`${a[0]}${r||"a"}${d[0]}`}),l,n.props):void 0;return{mergedClsPrefix:n.mergedClsPrefixRef,cssVars:o?void 0:l,themeClass:t?.themeClass,onRender:t?.onRender}},render(){const{mergedClsPrefix:e,color:n,onRender:o,$slots:l}=this;return o?.(),m("div",{class:[`${e}-timeline-item`,this.themeClass,`${e}-timeline-item--${this.type}-type`,`${e}-timeline-item--${this.lineType}-line-type`],style:this.cssVars},m("div",{class:`${e}-timeline-item-timeline`},m("div",{class:`${e}-timeline-item-timeline__line`}),S(l.icon,t=>t?m("div",{class:`${e}-timeline-item-timeline__icon`,style:{color:n}},t):m("div",{class:`${e}-timeline-item-timeline__circle`,style:{borderColor:n}}))),m("div",{class:`${e}-timeline-item-content`},S(l.header,t=>t||this.title?m("div",{class:`${e}-timeline-item-content__title`},t||this.title):null),m("div",{class:`${e}-timeline-item-content__content`},$(l.default,()=>[this.content])),m("div",{class:`${e}-timeline-item-content__meta`},$(l.footer,()=>[this.time]))))}}),he={key:0,class:"flex justify-center items-center py-8"},ze=w({__name:"ConversationDetailDrawer",props:{show:{type:Boolean},conversation:{},history:{},loading:{type:Boolean}},emits:["update:show"],setup(e,{emit:n}){const o=e,l=n;function t(r){l("update:show",r)}const a=C(()=>[...o.history].sort((r,d)=>new Date(r.createdAt||"").getTime()-new Date(d.createdAt||"").getTime()));return(r,d)=>(u(),x(p(oe),{show:o.show,width:800,"onUpdate:show":t},{default:z(()=>[b(p(Y),{title:r.conversation?`对话详情: ${r.conversation.name}`:"对话详情",closable:""},{default:z(()=>[b(p(re),{show:r.loading},{default:z(()=>[!r.conversation||r.history.length===0?(u(),T("div",he,[b(p(Z),{description:"无对话记录"})])):(u(),x(p(de),{key:1},{default:z(()=>[(u(!0),T(ee,null,te(a.value,(c,h)=>(u(),x(p(ue),{key:c.id,type:c.role==="user"?"info":"success",title:c.role==="user"?"用户":"AI",time:c.createdAt},{default:z(()=>[b(M,{message:c},null,8,["message"]),h<r.history.length-1?(u(),x(p(ne),{key:0})):ie("",!0)]),_:2},1032,["type","title","time"]))),128))]),_:1}))]),_:1},8,["show"])]),_:1},8,["title"])]),_:1},8,["show"]))}});export{ze as _};
