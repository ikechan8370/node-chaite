import{ap as Q,a0 as U,aq as X,a1 as a,d as B,a4 as O,a7 as T,ar as Y,x as N,aa as D,as as V,F as u,ae as z,af as Z,ag as ee,ah as x,at as m,ak as te,au as oe,av as L,a8 as ne,aw as M,ax as K,ay as q,az as E,aA as W,al as j,aB as ie,b as re,o as le,w as t,e,E as ae,y as se,j as ce,aC as de,aD as me,u as I,B as ue,g,H as pe,N as fe}from"./index-CucaxZT9.js";import{_ as _e}from"./chart.vue_vue_type_script_setup_true_lang-lZONHpc0.js";import{_ as ve}from"./Thing-CXlbAiyU.js";import{_ as ge,N as be}from"./Grid-KISfveeX.js";import{_ as xe,a as he}from"./Statistic-g4nmRobD.js";import{_ as ze}from"./text-DHsRuBwc.js";let H=!1;function ye(){if(Q&&window.CSS&&!H&&(H=!0,"registerProperty"in window?.CSS))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function Ce(o){const{textColor3:i,infoColor:l,errorColor:n,successColor:r,warningColor:s,textColor1:d,textColor2:c,railColor:f,fontWeightStrong:_,fontSize:p}=o;return Object.assign(Object.assign({},X),{contentFontSize:p,titleFontWeight:_,circleBorder:`2px solid ${i}`,circleBorderInfo:`2px solid ${l}`,circleBorderError:`2px solid ${n}`,circleBorderSuccess:`2px solid ${r}`,circleBorderWarning:`2px solid ${s}`,iconColor:i,iconColorInfo:l,iconColorError:n,iconColorSuccess:r,iconColorWarning:s,titleTextColor:d,contentTextColor:c,metaTextColor:i,lineColor:f})}const $e={common:U,self:Ce},we=a("icon-wrapper",`
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 background-color: var(--n-color);
 display: inline-flex;
 align-items: center;
 justify-content: center;
 color: var(--n-icon-color);
`),Se=Object.assign(Object.assign({},T.props),{size:{type:Number,default:24},borderRadius:{type:Number,default:6},color:String,iconColor:String}),ke=B({name:"IconWrapper",props:Se,setup(o,{slots:i}){const{mergedClsPrefixRef:l,inlineThemeDisabled:n}=O(o),r=T("IconWrapper","-icon-wrapper",we,Y,o,l),s=N(()=>{const{common:{cubicBezierEaseInOut:c},self:{color:f,iconColor:_}}=r.value;return{"--n-bezier":c,"--n-color":f,"--n-icon-color":_}}),d=n?D("icon-wrapper",void 0,s,o):void 0;return()=>{const c=V(o.size);return d?.onRender(),u("div",{class:[`${l.value}-icon-wrapper`,d?.themeClass.value],style:[s?.value,{height:c,width:c,borderRadius:V(o.borderRadius),backgroundColor:o.color,color:o.iconColor}]},i)}}}),Re=z([a("list",`
 --n-merged-border-color: var(--n-border-color);
 --n-merged-color: var(--n-color);
 --n-merged-color-hover: var(--n-color-hover);
 margin: 0;
 font-size: var(--n-font-size);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 padding: 0;
 list-style-type: none;
 color: var(--n-text-color);
 background-color: var(--n-merged-color);
 `,[x("show-divider",[a("list-item",[z("&:not(:last-child)",[m("divider",`
 background-color: var(--n-merged-border-color);
 `)])])]),x("clickable",[a("list-item",`
 cursor: pointer;
 `)]),x("bordered",`
 border: 1px solid var(--n-merged-border-color);
 border-radius: var(--n-border-radius);
 `),x("hoverable",[a("list-item",`
 border-radius: var(--n-border-radius);
 `,[z("&:hover",`
 background-color: var(--n-merged-color-hover);
 `,[m("divider",`
 background-color: transparent;
 `)])])]),x("bordered, hoverable",[a("list-item",`
 padding: 12px 20px;
 `),m("header, footer",`
 padding: 12px 20px;
 `)]),m("header, footer",`
 padding: 12px 0;
 box-sizing: border-box;
 transition: border-color .3s var(--n-bezier);
 `,[z("&:not(:last-child)",`
 border-bottom: 1px solid var(--n-merged-border-color);
 `)]),a("list-item",`
 position: relative;
 padding: 12px 0; 
 box-sizing: border-box;
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[m("prefix",`
 margin-right: 20px;
 flex: 0;
 `),m("suffix",`
 margin-left: 20px;
 flex: 0;
 `),m("main",`
 flex: 1;
 `),m("divider",`
 height: 1px;
 position: absolute;
 bottom: 0;
 left: 0;
 right: 0;
 background-color: transparent;
 transition: background-color .3s var(--n-bezier);
 pointer-events: none;
 `)])]),Z(a("list",`
 --n-merged-color-hover: var(--n-color-hover-modal);
 --n-merged-color: var(--n-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),ee(a("list",`
 --n-merged-color-hover: var(--n-color-hover-popover);
 --n-merged-color: var(--n-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]),Pe=Object.assign(Object.assign({},T.props),{size:{type:String,default:"medium"},bordered:Boolean,clickable:Boolean,hoverable:Boolean,showDivider:{type:Boolean,default:!0}}),A=M("n-list"),Be=B({name:"List",props:Pe,slots:Object,setup(o){const{mergedClsPrefixRef:i,inlineThemeDisabled:l,mergedRtlRef:n}=O(o),r=te("List",n,i),s=T("List","-list",Re,oe,o,i);L(A,{showDividerRef:ne(o,"showDivider"),mergedClsPrefixRef:i});const d=N(()=>{const{common:{cubicBezierEaseInOut:f},self:{fontSize:_,textColor:p,color:v,colorModal:$,colorPopover:h,borderColor:y,borderColorModal:b,borderColorPopover:S,borderRadius:k,colorHover:w,colorHoverModal:C,colorHoverPopover:R}}=s.value;return{"--n-font-size":_,"--n-bezier":f,"--n-text-color":p,"--n-color":v,"--n-border-radius":k,"--n-border-color":y,"--n-border-color-modal":b,"--n-border-color-popover":S,"--n-color-modal":$,"--n-color-popover":h,"--n-color-hover":w,"--n-color-hover-modal":C,"--n-color-hover-popover":R}}),c=l?D("list",void 0,d,o):void 0;return{mergedClsPrefix:i,rtlEnabled:r,cssVars:l?void 0:d,themeClass:c?.themeClass,onRender:c?.onRender}},render(){var o;const{$slots:i,mergedClsPrefix:l,onRender:n}=this;return n?.(),u("ul",{class:[`${l}-list`,this.rtlEnabled&&`${l}-list--rtl`,this.bordered&&`${l}-list--bordered`,this.showDivider&&`${l}-list--show-divider`,this.hoverable&&`${l}-list--hoverable`,this.clickable&&`${l}-list--clickable`,this.themeClass],style:this.cssVars},i.header?u("div",{class:`${l}-list__header`},i.header()):null,(o=i.default)===null||o===void 0?void 0:o.call(i),i.footer?u("div",{class:`${l}-list__footer`},i.footer()):null)}}),Te=B({name:"ListItem",slots:Object,setup(){const o=K(A,null);return o||q("list-item","`n-list-item` must be placed in `n-list`."),{showDivider:o.showDividerRef,mergedClsPrefix:o.mergedClsPrefixRef}},render(){const{$slots:o,mergedClsPrefix:i}=this;return u("li",{class:`${i}-list-item`},o.prefix?u("div",{class:`${i}-list-item__prefix`},o.prefix()):null,o.default?u("div",{class:`${i}-list-item__main`},o):null,o.suffix?u("div",{class:`${i}-list-item__suffix`},o.suffix()):null,this.showDivider&&u("div",{class:`${i}-list-item__divider`}))}}),F=1.25,je=a("timeline",`
 position: relative;
 width: 100%;
 display: flex;
 flex-direction: column;
 line-height: ${F};
`,[x("horizontal",`
 flex-direction: row;
 `,[z(">",[a("timeline-item",`
 flex-shrink: 0;
 padding-right: 40px;
 `,[x("dashed-line-type",[z(">",[a("timeline-item-timeline",[m("line",`
 background-image: linear-gradient(90deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 10px 1px;
 `)])])]),z(">",[a("timeline-item-content",`
 margin-top: calc(var(--n-icon-size) + 12px);
 `,[z(">",[m("meta",`
 margin-top: 6px;
 margin-bottom: unset;
 `)])]),a("timeline-item-timeline",`
 width: 100%;
 height: calc(var(--n-icon-size) + 12px);
 `,[m("line",`
 left: var(--n-icon-size);
 top: calc(var(--n-icon-size) / 2 - 1px);
 right: 0px;
 width: unset;
 height: 2px;
 `)])])])])]),x("right-placement",[a("timeline-item",[a("timeline-item-content",`
 text-align: right;
 margin-right: calc(var(--n-icon-size) + 12px);
 `),a("timeline-item-timeline",`
 width: var(--n-icon-size);
 right: 0;
 `)])]),x("left-placement",[a("timeline-item",[a("timeline-item-content",`
 margin-left: calc(var(--n-icon-size) + 12px);
 `),a("timeline-item-timeline",`
 left: 0;
 `)])]),a("timeline-item",`
 position: relative;
 `,[z("&:last-child",[a("timeline-item-timeline",[m("line",`
 display: none;
 `)]),a("timeline-item-content",[m("meta",`
 margin-bottom: 0;
 `)])]),a("timeline-item-content",[m("title",`
 margin: var(--n-title-margin);
 font-size: var(--n-title-font-size);
 transition: color .3s var(--n-bezier);
 font-weight: var(--n-title-font-weight);
 color: var(--n-title-text-color);
 `),m("content",`
 transition: color .3s var(--n-bezier);
 font-size: var(--n-content-font-size);
 color: var(--n-content-text-color);
 `),m("meta",`
 transition: color .3s var(--n-bezier);
 font-size: 12px;
 margin-top: 6px;
 margin-bottom: 20px;
 color: var(--n-meta-text-color);
 `)]),x("dashed-line-type",[a("timeline-item-timeline",[m("line",`
 --n-color-start: var(--n-line-color);
 transition: --n-color-start .3s var(--n-bezier);
 background-color: transparent;
 background-image: linear-gradient(180deg, var(--n-color-start), var(--n-color-start) 50%, transparent 50%, transparent 100%);
 background-size: 1px 10px;
 `)])]),a("timeline-item-timeline",`
 width: calc(var(--n-icon-size) + 12px);
 position: absolute;
 top: calc(var(--n-title-font-size) * ${F} / 2 - var(--n-icon-size) / 2);
 height: 100%;
 `,[m("circle",`
 border: var(--n-circle-border);
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 border-radius: var(--n-icon-size);
 box-sizing: border-box;
 `),m("icon",`
 color: var(--n-icon-color);
 font-size: var(--n-icon-size);
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 display: flex;
 align-items: center;
 justify-content: center;
 `),m("line",`
 transition: background-color .3s var(--n-bezier);
 position: absolute;
 top: var(--n-icon-size);
 left: calc(var(--n-icon-size) / 2 - 1px);
 bottom: 0px;
 width: 2px;
 background-color: var(--n-line-color);
 `)])])]),Ie=Object.assign(Object.assign({},T.props),{horizontal:Boolean,itemPlacement:{type:String,default:"left"},size:{type:String,default:"medium"},iconSize:Number}),G=M("n-timeline"),Ne=B({name:"Timeline",props:Ie,setup(o,{slots:i}){const{mergedClsPrefixRef:l}=O(o),n=T("Timeline","-timeline",je,$e,o,l);return L(G,{props:o,mergedThemeRef:n,mergedClsPrefixRef:l}),()=>{const{value:r}=l;return u("div",{class:[`${r}-timeline`,o.horizontal&&`${r}-timeline--horizontal`,`${r}-timeline--${o.size}-size`,!o.horizontal&&`${r}-timeline--${o.itemPlacement}-placement`]},i)}}}),Oe={time:[String,Number],title:String,content:String,color:String,lineType:{type:String,default:"default"},type:{type:String,default:"default"}},Ve=B({name:"TimelineItem",props:Oe,slots:Object,setup(o){const i=K(G);i||q("timeline-item","`n-timeline-item` must be placed inside `n-timeline`."),ye();const{inlineThemeDisabled:l}=O(),n=N(()=>{const{props:{size:s,iconSize:d},mergedThemeRef:c}=i,{type:f}=o,{self:{titleTextColor:_,contentTextColor:p,metaTextColor:v,lineColor:$,titleFontWeight:h,contentFontSize:y,[j("iconSize",s)]:b,[j("titleMargin",s)]:S,[j("titleFontSize",s)]:k,[j("circleBorder",f)]:w,[j("iconColor",f)]:C},common:{cubicBezierEaseInOut:R}}=c.value;return{"--n-bezier":R,"--n-circle-border":w,"--n-icon-color":C,"--n-content-font-size":y,"--n-content-text-color":p,"--n-line-color":$,"--n-meta-text-color":v,"--n-title-font-size":k,"--n-title-font-weight":h,"--n-title-margin":S,"--n-title-text-color":_,"--n-icon-size":V(d)||b}}),r=l?D("timeline-item",N(()=>{const{props:{size:s,iconSize:d}}=i,{type:c}=o;return`${s[0]}${d||"a"}${c[0]}`}),n,i.props):void 0;return{mergedClsPrefix:i.mergedClsPrefixRef,cssVars:l?void 0:n,themeClass:r?.themeClass,onRender:r?.onRender}},render(){const{mergedClsPrefix:o,color:i,onRender:l,$slots:n}=this;return l?.(),u("div",{class:[`${o}-timeline-item`,this.themeClass,`${o}-timeline-item--${this.type}-type`,`${o}-timeline-item--${this.lineType}-line-type`],style:this.cssVars},u("div",{class:`${o}-timeline-item-timeline`},u("div",{class:`${o}-timeline-item-timeline__line`}),E(n.icon,r=>r?u("div",{class:`${o}-timeline-item-timeline__icon`,style:{color:i}},r):u("div",{class:`${o}-timeline-item-timeline__circle`,style:{borderColor:i}}))),u("div",{class:`${o}-timeline-item-content`},E(n.header,r=>r||this.title?u("div",{class:`${o}-timeline-item-content__title`},r||this.title):null),u("div",{class:`${o}-timeline-item-content__content`},W(n.default,()=>[this.content])),u("div",{class:`${o}-timeline-item-content__meta`},W(n.footer,()=>[this.time]))))}}),Me=B({__name:"index",setup(o){const{userInfo:i}=ie();return(l,n)=>{const r=se,s=de,d=ke,c=ce,f=he,_=xe,p=ve,v=ge,$=be,h=ue,y=me,b=Te,S=Be,k=ae,w=pe,C=ze,R=fe,P=Ve,J=Ne;return le(),re($,{"x-gap":16,"y-gap":16},{default:t(()=>[e(v,{span:16},{default:t(()=>[e(k,{vertical:"",size:16},{default:t(()=>[e(r,{style:{"--n-padding-left":"0"}},{default:t(()=>[e(_e)]),_:1}),e(r,null,{default:t(()=>[e($,{"x-gap":8,"y-gap":8},{default:t(()=>[e(v,{span:6},{default:t(()=>[e(r,null,{default:t(()=>[e(p,null,{avatar:t(()=>[e(c,null,{default:t(()=>[e(d,{size:46,color:"var(--success-color)","border-radius":999},{default:t(()=>[e(s,{size:26,icon:"icon-park-outline:user"})]),_:1})]),_:1})]),header:t(()=>[e(_,{label:"活跃用户"},{default:t(()=>[e(f,{"show-separator":"",from:0,to:12039})]),_:1})]),_:1})]),_:1})]),_:1}),e(v,{span:6},{default:t(()=>[e(r,null,{default:t(()=>[e(p,null,{avatar:t(()=>[e(c,null,{default:t(()=>[e(d,{size:46,color:"var(--success-color)","border-radius":999},{default:t(()=>[e(s,{size:26,icon:"icon-park-outline:every-user"})]),_:1})]),_:1})]),header:t(()=>[e(_,{label:"用户"},{default:t(()=>[e(f,{"show-separator":"",from:0,to:44039})]),_:1})]),_:1})]),_:1})]),_:1}),e(v,{span:6},{default:t(()=>[e(r,null,{default:t(()=>[e(p,null,{avatar:t(()=>[e(c,null,{default:t(()=>[e(d,{size:46,color:"var(--success-color)","border-radius":999},{default:t(()=>[e(s,{size:26,icon:"icon-park-outline:preview-open"})]),_:1})]),_:1})]),header:t(()=>[e(_,{label:"浏览量"},{default:t(()=>[e(f,{"show-separator":"",from:0,to:551039})]),_:1})]),_:1})]),_:1})]),_:1}),e(v,{span:6},{default:t(()=>[e(r,null,{default:t(()=>[e(p,null,{avatar:t(()=>[e(c,null,{default:t(()=>[e(d,{size:46,color:"var(--success-color)","border-radius":999},{default:t(()=>[e(s,{size:26,icon:"icon-park-outline:star"})]),_:1})]),_:1})]),header:t(()=>[e(_,{label:"收藏数"},{default:t(()=>[e(f,{"show-separator":"",from:0,to:7739})]),_:1})]),_:1})]),_:1})]),_:1})]),_:1})]),_:1}),e(r,{title:"动态"},{"header-extra":t(()=>[e(h,{type:"primary",quaternary:""},{default:t(()=>n[0]||(n[0]=[g(" 更多 ")])),_:1})]),default:t(()=>[e(S,{hoverable:""},{default:t(()=>[e(b,null,{prefix:t(()=>[e(y,{round:"",size:48,src:I(i)?.avatar},null,8,["src"])]),default:t(()=>[e(p,{title:"客怎车","title-extra":"09/29/2022",description:"是“我的客厅怎么会有车”的缩写，指那些在车道间肆意穿梭，把马路当客厅的人，多有嘲讽意味，主要用于车祸视频中。"})]),_:1}),e(b,null,{prefix:t(()=>[e(y,{round:"",size:48,src:I(i)?.avatar},null,8,["src"])]),default:t(()=>[e(p,{title:"街健五大神技","title-extra":"09/29/2022",description:"街头健身五大神技，包括1.单手引体向上。2.慢速双力臂。3.人旗。4.前水平。5.俄式挺身。"})]),_:1}),e(b,null,{prefix:t(()=>[e(y,{round:"",size:48,src:I(i)?.avatar},null,8,["src"])]),default:t(()=>[e(p,{title:"天下岂有七十年太子乎","title-extra":"09/29/2022",description:"★含义：用来调侃由于英国女王超长的在位时间，导致其长子查理斯王子成为史上等待王位时间最久的王储 "})]),_:1}),e(b,null,{prefix:t(()=>[e(y,{round:"",size:48,src:I(i)?.avatar},null,8,["src"])]),default:t(()=>[e(p,{title:"你干嘛～哈哈～哎哟～","title-extra":"09/29/2022",description:"出自著名偶像练习生、练习时长两年半、背带异常梳中分的蔡徐坤在2018年的一档综艺节目偶像练习生中出现的一幕"})]),_:1})]),_:1})]),_:1})]),_:1})]),_:1}),e(v,{span:8},{default:t(()=>[e(k,{vertical:"",size:16},{default:t(()=>[e(r,{title:"公告"},{"header-extra":t(()=>[e(h,{type:"primary",quaternary:""},{default:t(()=>n[1]||(n[1]=[g(" 更多 ")])),_:1})]),default:t(()=>[e(S,null,{default:t(()=>[e(b,null,{prefix:t(()=>[e(w,{bordered:!1,type:"info",size:"small"},{default:t(()=>n[2]||(n[2]=[g(" 通知 ")])),_:1})]),default:t(()=>[e(h,{text:""},{default:t(()=>n[3]||(n[3]=[g(" 漂洋过海上大专 ")])),_:1})]),_:1}),e(b,null,{prefix:t(()=>[e(w,{bordered:!1,type:"success",size:"small"},{default:t(()=>n[4]||(n[4]=[g(" 消息 ")])),_:1})]),default:t(()=>[e(h,{text:""},{default:t(()=>n[5]||(n[5]=[g(" 你在玩很新的东西 ")])),_:1})]),_:1}),e(b,null,{prefix:t(()=>[e(w,{bordered:!1,type:"warning",size:"small"},{default:t(()=>n[6]||(n[6]=[g(" 活动 ")])),_:1})]),default:t(()=>[e(h,{text:""},{default:t(()=>n[7]||(n[7]=[g(" 上岸第一剑，先斩意中人 ")])),_:1})]),_:1})]),_:1})]),_:1}),e($,{"x-gap":8,"y-gap":8},{default:t(()=>[e(v,{span:12},{default:t(()=>[e(r,null,{default:t(()=>[e(R,{vertical:"",align:"center"},{default:t(()=>[e(C,{depth:"3"},{default:t(()=>n[8]||(n[8]=[g(" 订单数 ")])),_:1}),e(d,{size:46,"border-radius":999},{default:t(()=>[e(s,{size:26,icon:"icon-park-outline:all-application"})]),_:1}),e(C,{strong:"",class:"text-2xl"},{default:t(()=>n[9]||(n[9]=[g(" 1,234,123 ")])),_:1})]),_:1})]),_:1})]),_:1}),e(v,{span:12},{default:t(()=>[e(r,null,{default:t(()=>[e(R,{vertical:"",align:"center"},{default:t(()=>[e(C,{depth:"3"},{default:t(()=>n[10]||(n[10]=[g(" 待办 ")])),_:1}),e(c,null,{default:t(()=>[e(d,{size:46,color:"var(--warning-color)","border-radius":999},{default:t(()=>[e(s,{size:26,icon:"icon-park-outline:list-bottom"})]),_:1})]),_:1}),e(C,{strong:"",class:"text-2xl"},{default:t(()=>n[11]||(n[11]=[g(" 78 ")])),_:1})]),_:1})]),_:1})]),_:1})]),_:1}),e(r,{title:"任务进度"},{default:t(()=>[e(J,null,{default:t(()=>[e(P,{content:"啊"}),e(P,{type:"success",title:"成功",content:"哪里成功",time:"2018-04-03 20:46"}),e(P,{type:"error",content:"哪里错误",time:"2018-04-03 20:46"}),e(P,{type:"warning",title:"警告",content:"哪里警告",time:"2018-04-03 20:46"}),e(P,{type:"info",title:"信息",content:"是的",time:"2018-04-03 20:46","line-type":"dashed"}),e(P,{content:"啊"})]),_:1})]),_:1})]),_:1})]),_:1})]),_:1})}}});export{Me as default};
