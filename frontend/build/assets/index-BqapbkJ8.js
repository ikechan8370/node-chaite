import{a1 as g,ai as C,ah as l,ae as s,at as _,d as E,F as V,a4 as M,aK as T,ak as W,av as z,hV as F,aB as H,hW as I,be as K,b as p,o as i,w as o,e as a,g as n,t as w,u as b,c as U,M as j,am as A,B as q,E as J,aU as S,n as h,y as O}from"./index-CucaxZT9.js";import{b as Q,a as X}from"./headers-CgeYXxRE.js";const t="0!important",N="-1px!important";function f(r){return l(`${r}-type`,[s("& +",[g("button",{},[l(`${r}-type`,[_("border",{borderLeftWidth:t}),_("state-border",{left:N})])])])])}function c(r){return l(`${r}-type`,[s("& +",[g("button",[l(`${r}-type`,[_("border",{borderTopWidth:t}),_("state-border",{top:N})])])])])}const Y=g("button-group",`
 flex-wrap: nowrap;
 display: inline-flex;
 position: relative;
`,[C("vertical",{flexDirection:"row"},[C("rtl",[g("button",[s("&:first-child:not(:last-child)",`
 margin-right: ${t};
 border-top-right-radius: ${t};
 border-bottom-right-radius: ${t};
 `),s("&:last-child:not(:first-child)",`
 margin-left: ${t};
 border-top-left-radius: ${t};
 border-bottom-left-radius: ${t};
 `),s("&:not(:first-child):not(:last-child)",`
 margin-left: ${t};
 margin-right: ${t};
 border-radius: ${t};
 `),f("default"),l("ghost",[f("primary"),f("info"),f("success"),f("warning"),f("error")])])])]),l("vertical",{flexDirection:"column"},[g("button",[s("&:first-child:not(:last-child)",`
 margin-bottom: ${t};
 margin-left: ${t};
 margin-right: ${t};
 border-bottom-left-radius: ${t};
 border-bottom-right-radius: ${t};
 `),s("&:last-child:not(:first-child)",`
 margin-top: ${t};
 margin-left: ${t};
 margin-right: ${t};
 border-top-left-radius: ${t};
 border-top-right-radius: ${t};
 `),s("&:not(:first-child):not(:last-child)",`
 margin: ${t};
 border-radius: ${t};
 `),c("default"),l("ghost",[c("primary"),c("info"),c("success"),c("warning"),c("error")])])])]),Z={size:{type:String,default:void 0},vertical:Boolean},tt=E({name:"ButtonGroup",props:Z,setup(r){const{mergedClsPrefixRef:u,mergedRtlRef:m}=M(r);return T("-button-group",Y,u),z(F,r),{rtlEnabled:W("ButtonGroup",m,u),mergedClsPrefix:u}},render(){const{mergedClsPrefix:r}=this;return V("div",{class:[`${r}-button-group`,this.rtlEnabled&&`${r}-button-group--rtl`,this.vertical&&`${r}-button-group--vertical`],role:"group"},this.$slots)}}),nt=E({__name:"index",setup(r){const u=H(),{hasPermission:m}=I(),{role:y}=u.userInfo,P=["super","admin","user"];function R(v){u.login(v,"123456")}return(v,e)=>{const D=Q,d=q,G=tt,x=X,B=J,L=O,k=K("permission");return i(),p(L,{title:"权限示例"},{default:o(()=>[a(D,null,{default:o(()=>[n(" 当前权限："+w(b(y)),1)]),_:1}),a(G,null,{default:o(()=>[(i(),U(j,null,A(P,$=>a(d,{key:$,type:"default",onClick:et=>R($)},{default:o(()=>[n(w($),1)]),_:2},1032,["onClick"])),64))]),_:1}),a(x,null,{default:o(()=>e[0]||(e[0]=[n("v-permission 指令用法")])),_:1}),a(B,null,{default:o(()=>[S((i(),p(d,null,{default:o(()=>e[1]||(e[1]=[n(" 仅super可见 ")])),_:1})),[[k,"super"]]),S((i(),p(d,null,{default:o(()=>e[2]||(e[2]=[n(" admin可见 ")])),_:1})),[[k,["admin"]]])]),_:1}),a(x,null,{default:o(()=>e[3]||(e[3]=[n("usePermission 函数用法")])),_:1}),a(B,null,{default:o(()=>[b(m)("super")?(i(),p(d,{key:0},{default:o(()=>e[4]||(e[4]=[n(" super可见 ")])),_:1})):h("",!0),b(m)("admin")?(i(),p(d,{key:1},{default:o(()=>e[5]||(e[5]=[n(" admin可见 ")])),_:1})):h("",!0),b(m)(["admin","user"])?(i(),p(d,{key:2},{default:o(()=>e[6]||(e[6]=[n(" admin和user可见 ")])),_:1})):h("",!0)]),_:1})]),_:1})}}});export{nt as default};
