import{ax as w,a7 as C,bh as oe,bi as te,ay as N,ak as x,d as I,p as l,aa as M,aC as re,ad as j,bj as se,aV as G,ae as V,s as R,ag as W,aN as A,aP as Z,bk as ie,b0 as ne,aE as E,B as z,q as le,a8 as ae,ao as de,ab as H,R as ce,bl as ue,aZ as ve,bm as pe,r as k,ai as F,bn as fe,U,m as J,c as $,o as P,a as _,L as me,v as he,e as v,w as p,u as d,g as O,y as ge,bo as be,b as q,I as xe,F as ye,A as ke,O as Ce,t as Pe,a0 as D,bp as _e,k as we}from"./index-ODYIy7Xh.js";import{I as ze}from"./preview-open-BHtiJeC4.js";import{_ as Ne}from"./ConversationDetailDrawer.vue_vue_type_script_setup_true_lang-CeWPvSjE.js";import{N as $e}from"./Spin-BiP1MUco.js";import{N as Ie}from"./DataTable-D5UReYxF.js";import{N as Re}from"./text-wRfvlJal.js";import"./MessageContentCard-BEgHVRqC.js";import"./CollapseItem-Dh60zBP9.js";import"./Image-Bno4eTxG.js";import"./download-C2161hUv.js";import"./Checkbox-COyVwk_5.js";import"./Ellipsis-CB8MjzQA.js";import"./prop-BjyUHhTu.js";const je=w([C("list",`
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
 `,[N("show-divider",[C("list-item",[w("&:not(:last-child)",[x("divider",`
 background-color: var(--n-merged-border-color);
 `)])])]),N("clickable",[C("list-item",`
 cursor: pointer;
 `)]),N("bordered",`
 border: 1px solid var(--n-merged-border-color);
 border-radius: var(--n-border-radius);
 `),N("hoverable",[C("list-item",`
 border-radius: var(--n-border-radius);
 `,[w("&:hover",`
 background-color: var(--n-merged-color-hover);
 `,[x("divider",`
 background-color: transparent;
 `)])])]),N("bordered, hoverable",[C("list-item",`
 padding: 12px 20px;
 `),x("header, footer",`
 padding: 12px 20px;
 `)]),x("header, footer",`
 padding: 12px 0;
 box-sizing: border-box;
 transition: border-color .3s var(--n-bezier);
 `,[w("&:not(:last-child)",`
 border-bottom: 1px solid var(--n-merged-border-color);
 `)]),C("list-item",`
 position: relative;
 padding: 12px 0; 
 box-sizing: border-box;
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[x("prefix",`
 margin-right: 20px;
 flex: 0;
 `),x("suffix",`
 margin-left: 20px;
 flex: 0;
 `),x("main",`
 flex: 1;
 `),x("divider",`
 height: 1px;
 position: absolute;
 bottom: 0;
 left: 0;
 right: 0;
 background-color: transparent;
 transition: background-color .3s var(--n-bezier);
 pointer-events: none;
 `)])]),oe(C("list",`
 --n-merged-color-hover: var(--n-color-hover-modal);
 --n-merged-color: var(--n-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),te(C("list",`
 --n-merged-color-hover: var(--n-color-hover-popover);
 --n-merged-color: var(--n-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]),Be=Object.assign(Object.assign({},j.props),{size:{type:String,default:"medium"},bordered:Boolean,clickable:Boolean,hoverable:Boolean,showDivider:{type:Boolean,default:!0}}),Q=A("n-list"),Se=I({name:"List",props:Be,slots:Object,setup(o){const{mergedClsPrefixRef:e,inlineThemeDisabled:r,mergedRtlRef:n}=M(o),f=re("List",n,e),m=j("List","-list",je,se,o,e);G(Q,{showDividerRef:V(o,"showDivider"),mergedClsPrefixRef:e});const y=R(()=>{const{common:{cubicBezierEaseInOut:a},self:{fontSize:h,textColor:c,color:g,colorModal:b,colorPopover:B,borderColor:S,borderColorModal:T,borderColorPopover:t,borderRadius:i,colorHover:u,colorHoverModal:L,colorHoverPopover:ee}}=m.value;return{"--n-font-size":h,"--n-bezier":a,"--n-text-color":c,"--n-color":g,"--n-border-radius":i,"--n-border-color":S,"--n-border-color-modal":T,"--n-border-color-popover":t,"--n-color-modal":b,"--n-color-popover":B,"--n-color-hover":u,"--n-color-hover-modal":L,"--n-color-hover-popover":ee}}),s=r?W("list",void 0,y,o):void 0;return{mergedClsPrefix:e,rtlEnabled:f,cssVars:r?void 0:y,themeClass:s?.themeClass,onRender:s?.onRender}},render(){var o;const{$slots:e,mergedClsPrefix:r,onRender:n}=this;return n?.(),l("ul",{class:[`${r}-list`,this.rtlEnabled&&`${r}-list--rtl`,this.bordered&&`${r}-list--bordered`,this.showDivider&&`${r}-list--show-divider`,this.hoverable&&`${r}-list--hoverable`,this.clickable&&`${r}-list--clickable`,this.themeClass],style:this.cssVars},e.header?l("div",{class:`${r}-list__header`},e.header()):null,(o=e.default)===null||o===void 0?void 0:o.call(e),e.footer?l("div",{class:`${r}-list__footer`},e.footer()):null)}}),Te=I({name:"ListItem",slots:Object,setup(){const o=Z(Q,null);return o||ie("list-item","`n-list-item` must be placed in `n-list`."),{showDivider:o.showDividerRef,mergedClsPrefix:o.mergedClsPrefixRef}},render(){const{$slots:o,mergedClsPrefix:e}=this;return l("li",{class:`${e}-list-item`},o.prefix?l("div",{class:`${e}-list-item__prefix`},o.prefix()):null,o.default?l("div",{class:`${e}-list-item__main`},o):null,o.suffix?l("div",{class:`${e}-list-item__suffix`},o.suffix()):null,this.showDivider&&l("div",{class:`${e}-list-item__divider`}))}}),X=A("n-popconfirm"),Y={positiveText:String,negativeText:String,showIcon:{type:Boolean,default:!0},onPositiveClick:{type:Function,required:!0},onNegativeClick:{type:Function,required:!0}},K=ne(Y),Oe=I({name:"NPopconfirmPanel",props:Y,setup(o){const{localeRef:e}=H("Popconfirm"),{inlineThemeDisabled:r}=M(),{mergedClsPrefixRef:n,mergedThemeRef:f,props:m}=Z(X),y=R(()=>{const{common:{cubicBezierEaseInOut:a},self:{fontSize:h,iconSize:c,iconColor:g}}=f.value;return{"--n-bezier":a,"--n-font-size":h,"--n-icon-size":c,"--n-icon-color":g}}),s=r?W("popconfirm-panel",void 0,y,m):void 0;return Object.assign(Object.assign({},H("Popconfirm")),{mergedClsPrefix:n,cssVars:r?void 0:y,localizedPositiveText:R(()=>o.positiveText||e.value.positiveText),localizedNegativeText:R(()=>o.negativeText||e.value.negativeText),positiveButtonProps:V(m,"positiveButtonProps"),negativeButtonProps:V(m,"negativeButtonProps"),handlePositiveClick(a){o.onPositiveClick(a)},handleNegativeClick(a){o.onNegativeClick(a)},themeClass:s?.themeClass,onRender:s?.onRender})},render(){var o;const{mergedClsPrefix:e,showIcon:r,$slots:n}=this,f=E(n.action,()=>this.negativeText===null&&this.positiveText===null?[]:[this.negativeText!==null&&l(z,Object.assign({size:"small",onClick:this.handleNegativeClick},this.negativeButtonProps),{default:()=>this.localizedNegativeText}),this.positiveText!==null&&l(z,Object.assign({size:"small",type:"primary",onClick:this.handlePositiveClick},this.positiveButtonProps),{default:()=>this.localizedPositiveText})]);return(o=this.onRender)===null||o===void 0||o.call(this),l("div",{class:[`${e}-popconfirm__panel`,this.themeClass],style:this.cssVars},le(n.default,m=>r||m?l("div",{class:`${e}-popconfirm__body`},r?l("div",{class:`${e}-popconfirm__icon`},E(n.icon,()=>[l(ae,{clsPrefix:e},{default:()=>l(de,null)})])):null,m):null),f?l("div",{class:[`${e}-popconfirm__action`]},f):null)}}),De=C("popconfirm",[x("body",`
 font-size: var(--n-font-size);
 display: flex;
 align-items: center;
 flex-wrap: nowrap;
 position: relative;
 `,[x("icon",`
 display: flex;
 font-size: var(--n-icon-size);
 color: var(--n-icon-color);
 transition: color .3s var(--n-bezier);
 margin: 0 8px 0 0;
 `)]),x("action",`
 display: flex;
 justify-content: flex-end;
 `,[w("&:not(:first-child)","margin-top: 8px"),C("button",[w("&:not(:last-child)","margin-right: 8px;")])])]),Ve=Object.assign(Object.assign(Object.assign({},j.props),fe),{positiveText:String,negativeText:String,showIcon:{type:Boolean,default:!0},trigger:{type:String,default:"click"},positiveButtonProps:Object,negativeButtonProps:Object,onPositiveClick:Function,onNegativeClick:Function}),Me=I({name:"Popconfirm",props:Ve,slots:Object,__popover__:!0,setup(o){const{mergedClsPrefixRef:e}=M(),r=j("Popconfirm","-popconfirm",De,pe,o,e),n=k(null);function f(s){var a;if(!(!((a=n.value)===null||a===void 0)&&a.getMergedShow()))return;const{onPositiveClick:h,"onUpdate:show":c}=o;Promise.resolve(h?h(s):!0).then(g=>{var b;g!==!1&&((b=n.value)===null||b===void 0||b.setShow(!1),c&&F(c,!1))})}function m(s){var a;if(!(!((a=n.value)===null||a===void 0)&&a.getMergedShow()))return;const{onNegativeClick:h,"onUpdate:show":c}=o;Promise.resolve(h?h(s):!0).then(g=>{var b;g!==!1&&((b=n.value)===null||b===void 0||b.setShow(!1),c&&F(c,!1))})}return G(X,{mergedThemeRef:r,mergedClsPrefixRef:e,props:o}),{setShow(s){var a;(a=n.value)===null||a===void 0||a.setShow(s)},syncPosition(){var s;(s=n.value)===null||s===void 0||s.syncPosition()},mergedTheme:r,popoverInstRef:n,handlePositiveClick:f,handleNegativeClick:m}},render(){const{$slots:o,$props:e,mergedTheme:r}=this;return l(ce,ue(e,K,{theme:r.peers.Popover,themeOverrides:r.peerOverrides.Popover,internalExtraClass:["popconfirm"],ref:"popoverInstRef"}),{trigger:o.trigger,default:()=>{const n=ve(e,K);return l(Oe,Object.assign(Object.assign({},n),{onPositiveClick:this.handlePositiveClick,onNegativeClick:this.handleNegativeClick}),o)}})}});function Ue(){return U.Get("/api/state/list")}function Le(o){return U.Delete(`/api/state/${o}`)}function Ee(o,e){return U.Get(`/api/state/history/${e}`,{params:{messageId:o}})}const He={style:{display:"inline-block"},viewBox:"0 0 48 48",width:"1.2em",height:"1.2em"};function Fe(o,e){return P(),$("svg",He,e[0]||(e[0]=[_("g",{fill:"none",stroke:"currentColor","stroke-linejoin":"round","stroke-width":"4"},[_("path",{d:"M9 10v34h30V10z"}),_("path",{"stroke-linecap":"round",d:"M20 20v13m8-13v13M4 10h40"}),_("path",{d:"m16 10l3.289-6h9.488L32 10z"})],-1)]))}const qe=J({name:"icon-park-outline-delete",render:Fe}),Ke={style:{display:"inline-block"},viewBox:"0 0 48 48",width:"1.2em",height:"1.2em"};function Ge(o,e){return P(),$("svg",Ke,e[0]||(e[0]=[_("path",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"4",d:"M44 24c0 11.046-8.954 20-20 20H4V24C4 12.954 12.954 4 24 4s20 8.954 20 20m-30-6h18m-18 8h18m-18 8h10"},null,-1)]))}const We=J({name:"icon-park-outline-message",render:Ge}),Ae={key:0,class:"flex justify-center items-center py-8"},Ze=I({__name:"index",setup(o){const e=me(),r=k([]),n=k(!1),f=k(!1),m=k(""),y=k([]),s=k(!1),a=k(null),h=k([]),c=k(!1);async function g(){n.value=!0;try{const t=await Ue();t.code===0?r.value=t.data:e.error(t.message||"加载用户状态失败")}catch(t){e.error(t.message||"获取用户状态时发生错误")}finally{n.value=!1}}function b(t){m.value=t;const i=r.value.find(u=>u.userId===t);i&&(y.value=i.conversations,f.value=!0)}async function B(t){try{const i=await Le(t);i.code===0?(e.success("删除用户状态成功"),await g()):e.error(i.message||"删除用户状态失败")}catch(i){e.error(i.message||"删除用户状态时发生错误")}}async function S(t){a.value=t,s.value=!0,c.value=!0;try{const i=await Ee(t.lastMessageId,t.id);i.code===0?h.value=i.data:e.error(i.message||"获取对话历史失败")}catch(i){e.error(i.message||"获取对话历史时发生错误")}finally{c.value=!1}}const T=[{title:"用户ID",key:"userId"},{title:"昵称",key:"nickname",render:t=>t.nickname||"未设置"},{title:"对话数量",key:"conversationCount",render:t=>t.conversations?.length||0},{title:"当前对话",key:"currentConversation",render:t=>{const i=t.conversations?.find(u=>u.id===t.current.conversationId);return i?i.name:"无"}},{title:"预设",key:"settings.preset",render:t=>t.settings?.preset||"默认"},{title:"模型",key:"settings.model",render:t=>t.settings?.model||"未设置"},{title:"操作",key:"actions",render:t=>[l(z,{quaternary:!0,size:"small",onClick:()=>b(t.userId)},{default:()=>"查看对话",icon:()=>l(D,null,{default:()=>l(We)})}),l(Me,{onPositiveClick:()=>B(t.userId.toString())},{trigger:()=>l(z,{quaternary:!0,size:"small",type:"error"},{default:()=>"删除",icon:()=>l(D,null,{default:()=>l(qe)})}),default:()=>"确定要删除此用户状态吗？此操作不可撤销。"})]}];return he(()=>{g()}),(t,i)=>(P(),$("div",null,[v(d(ge),{title:"用户状态管理"},{"header-extra":p(()=>[v(d(z),{type:"primary",onClick:g},{default:p(()=>i[2]||(i[2]=[O(" 刷新 ")])),_:1})]),default:p(()=>[v(d($e),{show:n.value},{default:p(()=>[v(d(Ie),{columns:T,data:r.value,bordered:!1,striped:""},null,8,["data"])]),_:1},8,["show"])]),_:1}),v(d(_e),{show:f.value,"onUpdate:show":i[0]||(i[0]=u=>f.value=u),width:500},{default:p(()=>[v(d(be),{title:"用户对话列表",closable:""},{default:p(()=>[y.value.length===0?(P(),$("div",Ae,[v(d(xe),{description:"该用户没有对话记录"})])):(P(),q(d(Se),{key:1},{default:p(()=>[(P(!0),$(ye,null,ke(y.value,u=>(P(),q(d(Te),{key:u.id},{default:p(()=>[v(d(Ce),{justify:"space-between",align:"center"},{default:p(()=>[_("div",null,[v(d(Re),null,{default:p(()=>[O(Pe(u.name),1)]),_:2},1024)]),_("div",null,[v(d(z),{text:"",type:"primary",onClick:L=>S(u)},{icon:p(()=>[v(d(D),null,{default:p(()=>[v(d(ze))]),_:1})]),default:p(()=>[i[3]||(i[3]=O(" 查看详情 "))]),_:2},1032,["onClick"])])]),_:2},1024)]),_:2},1024))),128))]),_:1}))]),_:1})]),_:1},8,["show"]),v(Ne,{show:s.value,"onUpdate:show":i[1]||(i[1]=u=>s.value=u),conversation:a.value,history:h.value,loading:c.value},null,8,["show","conversation","history","loading"])]))}}),co=we(Ze,[["__scopeId","data-v-f34e438e"]]);export{co as default};
