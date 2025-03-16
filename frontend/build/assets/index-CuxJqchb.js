import{ae as n,a1 as j,af as G,ag as K,ah as v,ai as U,d as N,F as W,a4 as J,a7 as V,aj as Q,ak as X,x as S,al as P,aa as Y,m as R,c as m,o as g,a as r,e as o,w as e,y as Z,E as oo,V as eo,S as ro,U as to,M as no,am as ao,t as b,H as lo,g as T,B as so}from"./index-CucaxZT9.js";import{_ as io}from"./chart-histogram-B0-GAcpb.js";import{_ as co}from"./chart.vue_vue_type_script_setup_true_lang-C3EEcGlj.js";import{_ as po}from"./chart2.vue_vue_type_script_setup_true_lang-DNhztDQr.js";import{_ as uo}from"./chart3.vue_vue_type_script_setup_true_lang-DL3EGVlz.js";import{_ as _o,N as bo}from"./Grid-KISfveeX.js";import{_ as mo,a as go}from"./Statistic-g4nmRobD.js";import"./index-BzwhMMmL.js";const ho=n([j("table",`
 font-size: var(--n-font-size);
 font-variant-numeric: tabular-nums;
 line-height: var(--n-line-height);
 width: 100%;
 border-radius: var(--n-border-radius) var(--n-border-radius) 0 0;
 text-align: left;
 border-collapse: separate;
 border-spacing: 0;
 overflow: hidden;
 background-color: var(--n-td-color);
 border-color: var(--n-merged-border-color);
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 --n-merged-border-color: var(--n-border-color);
 `,[n("th",`
 white-space: nowrap;
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 text-align: inherit;
 padding: var(--n-th-padding);
 vertical-align: inherit;
 text-transform: none;
 border: 0px solid var(--n-merged-border-color);
 font-weight: var(--n-th-font-weight);
 color: var(--n-th-text-color);
 background-color: var(--n-th-color);
 border-bottom: 1px solid var(--n-merged-border-color);
 border-right: 1px solid var(--n-merged-border-color);
 `,[n("&:last-child",`
 border-right: 0px solid var(--n-merged-border-color);
 `)]),n("td",`
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 padding: var(--n-td-padding);
 color: var(--n-td-text-color);
 background-color: var(--n-td-color);
 border: 0px solid var(--n-merged-border-color);
 border-right: 1px solid var(--n-merged-border-color);
 border-bottom: 1px solid var(--n-merged-border-color);
 `,[n("&:last-child",`
 border-right: 0px solid var(--n-merged-border-color);
 `)]),v("bordered",`
 border: 1px solid var(--n-merged-border-color);
 border-radius: var(--n-border-radius);
 `,[n("tr",[n("&:last-child",[n("td",`
 border-bottom: 0 solid var(--n-merged-border-color);
 `)])])]),v("single-line",[n("th",`
 border-right: 0px solid var(--n-merged-border-color);
 `),n("td",`
 border-right: 0px solid var(--n-merged-border-color);
 `)]),v("single-column",[n("tr",[n("&:not(:last-child)",[n("td",`
 border-bottom: 0px solid var(--n-merged-border-color);
 `)])])]),v("striped",[n("tr:nth-of-type(even)",[n("td","background-color: var(--n-td-color-striped)")])]),U("bottom-bordered",[n("tr",[n("&:last-child",[n("td",`
 border-bottom: 0px solid var(--n-merged-border-color);
 `)])])])]),G(j("table",`
 background-color: var(--n-td-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `,[n("th",`
 background-color: var(--n-th-color-modal);
 `),n("td",`
 background-color: var(--n-td-color-modal);
 `)])),K(j("table",`
 background-color: var(--n-td-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `,[n("th",`
 background-color: var(--n-th-color-popover);
 `),n("td",`
 background-color: var(--n-td-color-popover);
 `)]))]),fo=Object.assign(Object.assign({},V.props),{bordered:{type:Boolean,default:!0},bottomBordered:{type:Boolean,default:!0},singleLine:{type:Boolean,default:!0},striped:Boolean,singleColumn:Boolean,size:{type:String,default:"medium"}}),vo=N({name:"Table",props:fo,setup(l){const{mergedClsPrefixRef:t,inlineThemeDisabled:k,mergedRtlRef:a}=J(l),i=V("Table","-table",ho,Q,l,t),_=X("Table",a,t),h=S(()=>{const{size:d}=l,{self:{borderColor:c,tdColor:p,tdColorModal:x,tdColorPopover:w,thColor:y,thColorModal:f,thColorPopover:C,thTextColor:z,tdTextColor:B,borderRadius:M,thFontWeight:$,lineHeight:u,borderColorModal:E,borderColorPopover:H,tdColorStriped:L,tdColorStripedModal:D,tdColorStripedPopover:F,[P("fontSize",d)]:O,[P("tdPadding",d)]:I,[P("thPadding",d)]:q},common:{cubicBezierEaseInOut:A}}=i.value;return{"--n-bezier":A,"--n-td-color":p,"--n-td-color-modal":x,"--n-td-color-popover":w,"--n-td-text-color":B,"--n-border-color":c,"--n-border-color-modal":E,"--n-border-color-popover":H,"--n-border-radius":M,"--n-font-size":O,"--n-th-color":y,"--n-th-color-modal":f,"--n-th-color-popover":C,"--n-th-font-weight":$,"--n-th-text-color":z,"--n-line-height":u,"--n-td-padding":I,"--n-th-padding":q,"--n-td-color-striped":L,"--n-td-color-striped-modal":D,"--n-td-color-striped-popover":F}}),s=k?Y("table",S(()=>l.size[0]),h,l):void 0;return{rtlEnabled:_,mergedClsPrefix:t,cssVars:k?void 0:h,themeClass:s?.themeClass,onRender:s?.onRender}},render(){var l;const{mergedClsPrefix:t}=this;return(l=this.onRender)===null||l===void 0||l.call(this),W("table",{class:[`${t}-table`,this.themeClass,{[`${t}-table--rtl`]:this.rtlEnabled,[`${t}-table--bottom-bordered`]:this.bottomBordered,[`${t}-table--bordered`]:this.bordered,[`${t}-table--single-line`]:this.singleLine,[`${t}-table--single-column`]:this.singleColumn,[`${t}-table--striped`]:this.striped}],style:this.cssVars},this.$slots)}}),ko={style:{display:"inline-block"},viewBox:"0 0 48 48",width:"1.2em",height:"1.2em"};function xo(l,t){return g(),m("svg",ko,t[0]||(t[0]=[r("g",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"4"},[r("path",{d:"M44 24c0 11.046-8.954 20-20 20S4 35.046 4 24S12.954 4 24 4v20z"}),r("path",{d:"M43.084 18H30V4.916A20.05 20.05 0 0 1 43.084 18"})],-1)]))}const wo=R({name:"icon-park-outline-chart-pie",render:xo}),yo={style:{display:"inline-block"},viewBox:"0 0 48 48",width:"1.2em",height:"1.2em"};function Co(l,t){return g(),m("svg",yo,t[0]||(t[0]=[r("g",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"4"},[r("path",{d:"M4 4v40h40"}),r("path",{d:"M10 38S15.313 4 27 4s17 34 17 34"}),r("path",{"stroke-dasharray":"2 6",d:"M10 24h34"})],-1)]))}const zo=R({name:"icon-park-outline-average",render:Co}),Bo={style:{display:"inline-block"},viewBox:"0 0 48 48",width:"1.2em",height:"1.2em"};function Mo(l,t){return g(),m("svg",Bo,t[0]||(t[0]=[r("g",{fill:"none",stroke:"currentColor","stroke-linejoin":"round","stroke-width":"4"},[r("path",{d:"M17 6h14v9H17zM6 33h14v9H6zm22 0h14v9H28z"}),r("path",{"stroke-linecap":"round",d:"M24 16v8m-11 9v-9h22v9"})],-1)]))}const $o=R({name:"icon-park-outline-chart-graph",render:Mo}),Ho=N({__name:"index",setup(l){const t=[{id:0,name:"商品名称1",start:"2022-02-02",end:"2022-02-02",prograss:"100",status:"已完成"},{id:0,name:"商品名称2",start:"2022-02-02",end:"2022-02-02",prograss:"50",status:"交易中"},{id:0,name:"商品名称3",start:"2022-02-02",end:"2022-02-02",prograss:"100",status:"已完成"}];return(k,a)=>{const i=go,_=mo,h=io,s=eo,d=oo,c=Z,p=_o,x=$o,w=zo,y=wo,f=to,C=ro,z=so,B=lo,M=vo,$=bo;return g(),m("div",null,[o($,{"x-gap":16,"y-gap":16},{default:e(()=>[o(p,{span:6},{default:e(()=>[o(c,null,{footer:e(()=>[o(d,{justify:"space-between"},{default:e(()=>[a[0]||(a[0]=r("span",null,"累计访问数",-1)),r("span",null,[o(i,{from:0,to:322039,"show-separator":""})])]),_:1})]),default:e(()=>[o(d,{justify:"space-between",align:"center"},{default:e(()=>[o(_,{label:"访问量"},{default:e(()=>[o(i,{from:0,to:12039,"show-separator":""})]),_:1}),o(s,{color:"#de4307",size:"42"},{default:e(()=>[o(h)]),_:1})]),_:1})]),_:1})]),_:1}),o(p,{span:6},{default:e(()=>[o(c,null,{footer:e(()=>[o(d,{justify:"space-between"},{default:e(()=>[a[1]||(a[1]=r("span",null,"累计下载量",-1)),r("span",null,[o(i,{from:0,to:322039,"show-separator":""})])]),_:1})]),default:e(()=>[o(d,{justify:"space-between",align:"center"},{default:e(()=>[o(_,{label:"下载量"},{default:e(()=>[o(i,{from:0,to:12039,"show-separator":""})]),_:1}),o(s,{color:"#ffb549",size:"42"},{default:e(()=>[o(x)]),_:1})]),_:1})]),_:1})]),_:1}),o(p,{span:6},{default:e(()=>[o(c,null,{footer:e(()=>[o(d,{justify:"space-between"},{default:e(()=>[a[2]||(a[2]=r("span",null,"累计浏览量",-1)),r("span",null,[o(i,{from:0,to:322039,"show-separator":""})])]),_:1})]),default:e(()=>[o(d,{justify:"space-between",align:"center"},{default:e(()=>[o(_,{label:"浏览量"},{default:e(()=>[o(i,{from:0,to:12039,"show-separator":""})]),_:1}),o(s,{color:"#1687a7",size:"42"},{default:e(()=>[o(w)]),_:1})]),_:1})]),_:1})]),_:1}),o(p,{span:6},{default:e(()=>[o(c,null,{footer:e(()=>[o(d,{justify:"space-between"},{default:e(()=>[a[3]||(a[3]=r("span",null,"累计注册量",-1)),r("span",null,[o(i,{from:0,to:322039,"show-separator":""})])]),_:1})]),default:e(()=>[o(d,{justify:"space-between",align:"center"},{default:e(()=>[o(_,{label:"注册量"},{default:e(()=>[o(i,{from:0,to:12039,"show-separator":""})]),_:1}),o(s,{color:"#42218E",size:"42"},{default:e(()=>[o(y)]),_:1})]),_:1})]),_:1})]),_:1}),o(p,{span:24},{default:e(()=>[o(c,{"content-style":"padding: 0;"},{default:e(()=>[o(C,{type:"line",size:"large","tabs-padding":20,"pane-style":"padding: 20px;"},{default:e(()=>[o(f,{name:"流量趋势"},{default:e(()=>[o(co)]),_:1}),o(f,{name:"访问量趋势"},{default:e(()=>[o(po)]),_:1})]),_:1})]),_:1})]),_:1}),o(p,{span:8},{default:e(()=>[o(c,{title:"访问来源",segmented:{content:!0}},{default:e(()=>[o(uo)]),_:1})]),_:1}),o(p,{span:16},{default:e(()=>[o(c,{title:"成交记录",segmented:{content:!0}},{"header-extra":e(()=>[o(z,{type:"primary",quaternary:""},{default:e(()=>a[4]||(a[4]=[T(" 更多 ")])),_:1})]),default:e(()=>[o(M,{bordered:!1,"single-line":!1},{default:e(()=>[a[5]||(a[5]=r("thead",null,[r("tr",null,[r("th",null,"交易名称"),r("th",null,"开始时间"),r("th",null,"结束时间"),r("th",null,"进度"),r("th",null,"状态")])],-1)),r("tbody",null,[(g(),m(no,null,ao(t,u=>r("tr",{key:u.id},[r("td",null,b(u.name),1),r("td",null,b(u.start),1),r("td",null,b(u.end),1),r("td",null,b(u.prograss)+"%",1),r("td",null,[o(B,{bordered:!1,type:"info"},{default:e(()=>[T(b(u.status),1)]),_:2},1024)])])),64))])]),_:1})]),_:1})]),_:1})]),_:1})])}}});export{Ho as default};
