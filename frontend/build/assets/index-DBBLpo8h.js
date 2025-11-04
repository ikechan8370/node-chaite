import{a4 as $,a0 as m,bn as T,bo as q,a2 as k,a1 as f,d as V,p as n,ae as F,ag as G,af as U,bp as K,b0 as A,ay as X,s as J,aj as Q,aV as W,aX as Y,bq as Z,U as M,m as E,c as w,o as p,a as h,L as ee,r as v,v as re,e as a,w as d,u as l,B as z,g as j,y as oe,br as te,b as S,I as se,F as ne,A as le,O as ie,t as ae,ap as P,bs as de,k as ce}from"./index-kLEe-31q.js";import{I as ue}from"./preview-open-DqXcn0Io.js";import{_ as ve}from"./ConversationDetailDrawer.vue_vue_type_script_setup_true_lang-U0BsqrL8.js";import{N as me}from"./Spin-C7sqRNqw.js";import{N as fe}from"./DataTable-4ViTZyB6.js";import{N as pe}from"./text-BfkuQm58.js";import{N as he}from"./Popconfirm-wmBfNL4Y.js";import"./MessageContentCard-C2uRLdgO.js";import"./CollapseItem-7YFuTj31.js";import"./Image-CbdTV78X.js";import"./download-C2161hUv.js";import"./Checkbox-HPhUtTKu.js";import"./Ellipsis-CEbBdn2n.js";import"./prop-BjyUHhTu.js";const be=$([m("list",`
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
 `,[k("show-divider",[m("list-item",[$("&:not(:last-child)",[f("divider",`
 background-color: var(--n-merged-border-color);
 `)])])]),k("clickable",[m("list-item",`
 cursor: pointer;
 `)]),k("bordered",`
 border: 1px solid var(--n-merged-border-color);
 border-radius: var(--n-border-radius);
 `),k("hoverable",[m("list-item",`
 border-radius: var(--n-border-radius);
 `,[$("&:hover",`
 background-color: var(--n-merged-color-hover);
 `,[f("divider",`
 background-color: transparent;
 `)])])]),k("bordered, hoverable",[m("list-item",`
 padding: 12px 20px;
 `),f("header, footer",`
 padding: 12px 20px;
 `)]),f("header, footer",`
 padding: 12px 0;
 box-sizing: border-box;
 transition: border-color .3s var(--n-bezier);
 `,[$("&:not(:last-child)",`
 border-bottom: 1px solid var(--n-merged-border-color);
 `)]),m("list-item",`
 position: relative;
 padding: 12px 0; 
 box-sizing: border-box;
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[f("prefix",`
 margin-right: 20px;
 flex: 0;
 `),f("suffix",`
 margin-left: 20px;
 flex: 0;
 `),f("main",`
 flex: 1;
 `),f("divider",`
 height: 1px;
 position: absolute;
 bottom: 0;
 left: 0;
 right: 0;
 background-color: transparent;
 transition: background-color .3s var(--n-bezier);
 pointer-events: none;
 `)])]),T(m("list",`
 --n-merged-color-hover: var(--n-color-hover-modal);
 --n-merged-color: var(--n-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),q(m("list",`
 --n-merged-color-hover: var(--n-color-hover-popover);
 --n-merged-color: var(--n-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]),ge=Object.assign(Object.assign({},U.props),{size:{type:String,default:"medium"},bordered:Boolean,clickable:Boolean,hoverable:Boolean,showDivider:{type:Boolean,default:!0}}),H=W("n-list"),xe=V({name:"List",props:ge,slots:Object,setup(t){const{mergedClsPrefixRef:e,inlineThemeDisabled:s,mergedRtlRef:u}=F(t),g=G("List",u,e),I=U("List","-list",be,K,t,e);A(H,{showDividerRef:X(t,"showDivider"),mergedClsPrefixRef:e});const b=J(()=>{const{common:{cubicBezierEaseInOut:_},self:{fontSize:C,textColor:x,color:y,colorModal:N,colorPopover:D,borderColor:R,borderColorModal:B,borderColorPopover:r,borderRadius:o,colorHover:i,colorHoverModal:L,colorHoverPopover:O}}=I.value;return{"--n-font-size":C,"--n-bezier":_,"--n-text-color":x,"--n-color":y,"--n-border-radius":o,"--n-border-color":R,"--n-border-color-modal":B,"--n-border-color-popover":r,"--n-color-modal":N,"--n-color-popover":D,"--n-color-hover":i,"--n-color-hover-modal":L,"--n-color-hover-popover":O}}),c=s?Q("list",void 0,b,t):void 0;return{mergedClsPrefix:e,rtlEnabled:g,cssVars:s?void 0:b,themeClass:c?.themeClass,onRender:c?.onRender}},render(){var t;const{$slots:e,mergedClsPrefix:s,onRender:u}=this;return u?.(),n("ul",{class:[`${s}-list`,this.rtlEnabled&&`${s}-list--rtl`,this.bordered&&`${s}-list--bordered`,this.showDivider&&`${s}-list--show-divider`,this.hoverable&&`${s}-list--hoverable`,this.clickable&&`${s}-list--clickable`,this.themeClass],style:this.cssVars},e.header?n("div",{class:`${s}-list__header`},e.header()):null,(t=e.default)===null||t===void 0?void 0:t.call(e),e.footer?n("div",{class:`${s}-list__footer`},e.footer()):null)}}),ye=V({name:"ListItem",slots:Object,setup(){const t=Y(H,null);return t||Z("list-item","`n-list-item` must be placed in `n-list`."),{showDivider:t.showDividerRef,mergedClsPrefix:t.mergedClsPrefixRef}},render(){const{$slots:t,mergedClsPrefix:e}=this;return n("li",{class:`${e}-list-item`},t.prefix?n("div",{class:`${e}-list-item__prefix`},t.prefix()):null,t.default?n("div",{class:`${e}-list-item__main`},t):null,t.suffix?n("div",{class:`${e}-list-item__suffix`},t.suffix()):null,this.showDivider&&n("div",{class:`${e}-list-item__divider`}))}});function ke(){return M.Get("/api/state/list")}function we(t){return M.Delete(`/api/state/${t}`)}function _e(t,e){return M.Get(`/api/state/history/${e}`,{params:{messageId:t}})}const Ce={style:{display:"inline-block"},viewBox:"0 0 48 48",width:"1.2em",height:"1.2em"};function $e(t,e){return p(),w("svg",Ce,e[0]||(e[0]=[h("g",{fill:"none",stroke:"currentColor","stroke-linejoin":"round","stroke-width":"4"},[h("path",{d:"M9 10v34h30V10z"}),h("path",{"stroke-linecap":"round",d:"M20 20v13m8-13v13M4 10h40"}),h("path",{d:"m16 10l3.289-6h9.488L32 10z"})],-1)]))}const ze=E({name:"icon-park-outline-delete",render:$e}),Ie={style:{display:"inline-block"},viewBox:"0 0 48 48",width:"1.2em",height:"1.2em"};function Ne(t,e){return p(),w("svg",Ie,e[0]||(e[0]=[h("path",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"4",d:"M44 24c0 11.046-8.954 20-20 20H4V24C4 12.954 12.954 4 24 4s20 8.954 20 20m-30-6h18m-18 8h18m-18 8h10"},null,-1)]))}const De=E({name:"icon-park-outline-message",render:Ne}),Re={key:0,class:"flex justify-center items-center py-8"},Be=V({__name:"index",setup(t){const e=ee(),s=v([]),u=v(!1),g=v(!1),I=v(""),b=v([]),c=v(!1),_=v(null),C=v([]),x=v(!1);async function y(){u.value=!0;try{const r=await ke();r.code===0?s.value=r.data:e.error(r.message||"加载用户状态失败")}catch(r){e.error(r.message||"获取用户状态时发生错误")}finally{u.value=!1}}function N(r){I.value=r;const o=s.value.find(i=>i.userId===r);o&&(b.value=o.conversations,g.value=!0)}async function D(r){try{const o=await we(r);o.code===0?(e.success("删除用户状态成功"),await y()):e.error(o.message||"删除用户状态失败")}catch(o){e.error(o.message||"删除用户状态时发生错误")}}async function R(r){_.value=r,c.value=!0,x.value=!0;try{const o=await _e(r.lastMessageId,r.id);o.code===0?C.value=o.data:e.error(o.message||"获取对话历史失败")}catch(o){e.error(o.message||"获取对话历史时发生错误")}finally{x.value=!1}}const B=[{title:"用户ID",key:"userId"},{title:"昵称",key:"nickname",render:r=>r.nickname||"未设置"},{title:"对话数量",key:"conversationCount",render:r=>r.conversations?.length||0},{title:"当前对话",key:"currentConversation",render:r=>{const o=r.conversations?.find(i=>i.id===r.current.conversationId);return o?o.name:"无"}},{title:"预设",key:"settings.preset",render:r=>r.settings?.preset||"默认"},{title:"模型",key:"settings.model",render:r=>r.settings?.model||"未设置"},{title:"操作",key:"actions",render:r=>[n(z,{quaternary:!0,size:"small",onClick:()=>N(r.userId)},{default:()=>"查看对话",icon:()=>n(P,null,{default:()=>n(De)})}),n(he,{onPositiveClick:()=>D(r.userId.toString())},{trigger:()=>n(z,{quaternary:!0,size:"small",type:"error"},{default:()=>"删除",icon:()=>n(P,null,{default:()=>n(ze)})}),default:()=>"确定要删除此用户状态吗？此操作不可撤销。"})]}];return re(()=>{y()}),(r,o)=>(p(),w("div",null,[a(l(oe),{title:"用户状态管理"},{"header-extra":d(()=>[a(l(z),{type:"primary",onClick:y},{default:d(()=>o[2]||(o[2]=[j(" 刷新 ")])),_:1})]),default:d(()=>[a(l(me),{show:u.value},{default:d(()=>[a(l(fe),{columns:B,data:s.value,bordered:!1,striped:""},null,8,["data"])]),_:1},8,["show"])]),_:1}),a(l(de),{show:g.value,"onUpdate:show":o[0]||(o[0]=i=>g.value=i),width:500},{default:d(()=>[a(l(te),{title:"用户对话列表",closable:""},{default:d(()=>[b.value.length===0?(p(),w("div",Re,[a(l(se),{description:"该用户没有对话记录"})])):(p(),S(l(xe),{key:1},{default:d(()=>[(p(!0),w(ne,null,le(b.value,i=>(p(),S(l(ye),{key:i.id},{default:d(()=>[a(l(ie),{justify:"space-between",align:"center"},{default:d(()=>[h("div",null,[a(l(pe),null,{default:d(()=>[j(ae(i.name),1)]),_:2},1024)]),h("div",null,[a(l(z),{text:"",type:"primary",onClick:L=>R(i)},{icon:d(()=>[a(l(P),null,{default:d(()=>[a(l(ue))]),_:1})]),default:d(()=>[o[3]||(o[3]=j(" 查看详情 "))]),_:2},1032,["onClick"])])]),_:2},1024)]),_:2},1024))),128))]),_:1}))]),_:1})]),_:1},8,["show"]),a(ve,{show:c.value,"onUpdate:show":o[1]||(o[1]=i=>c.value=i),conversation:_.value,history:C.value,loading:x.value},null,8,["show","conversation","history","loading"])]))}}),Ke=ce(Be,[["__scopeId","data-v-f34e438e"]]);export{Ke as default};
