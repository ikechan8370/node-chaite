import{d as A,p as l,a1 as Oe,a4 as _e,a_ as Le,a5 as Pe,a$ as Ae,b0 as Ve,a6 as Be,b1 as Ie,b2 as $e,aN as Ne,a7 as x,ay as N,ak as p,ax as Y,b3 as Ue,E as K,a8 as De,aP as H,ab as Me,B as W,b4 as He,b5 as Ee,aB as qe,I as je,b6 as G,b7 as Je,r as P,af as Ke,ae as M,s as m,aa as We,ad as ae,ac as Ge,am as I,b8 as Xe,aU as Ye,b9 as Qe,ai as j,x as Q,b as Ze,n as et,o as tt,J as rt,w as _,e as F,a as lt,u as L,g as Z,t as at}from"./index-C7DPnO_D.js";import{N as ot}from"./Checkbox-DSxx-Bp1.js";import{N as J,_ as it}from"./FormItem-BlQlICgr.js";const st=A({name:"Search",render(){return l("svg",{version:"1.1",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",style:"enable-background: new 0 0 512 512"},l("path",{d:`M443.5,420.2L336.7,312.4c20.9-26.2,33.5-59.4,33.5-95.5c0-84.5-68.5-153-153.1-153S64,132.5,64,217s68.5,153,153.1,153
  c36.6,0,70.1-12.8,96.5-34.2l106.1,107.1c3.2,3.4,7.6,5.1,11.9,5.1c4.1,0,8.2-1.5,11.3-4.5C449.5,437.2,449.7,426.8,443.5,420.2z
   M217.1,337.1c-32.1,0-62.3-12.5-85-35.2c-22.7-22.7-35.2-52.9-35.2-84.9c0-32.1,12.5-62.3,35.2-84.9c22.7-22.7,52.9-35.2,85-35.2
  c32.1,0,62.3,12.5,85,35.2c22.7,22.7,35.2,52.9,35.2,84.9c0,32.1-12.5,62.3-35.2,84.9C279.4,324.6,249.2,337.1,217.1,337.1z`}))}});function nt(e){const{fontWeight:i,fontSizeLarge:r,fontSizeMedium:s,fontSizeSmall:d,heightLarge:o,heightMedium:f,borderRadius:a,cardColor:h,tableHeaderColor:b,textColor1:c,textColorDisabled:u,textColor2:T,textColor3:z,borderColor:g,hoverColor:y,closeColorHover:S,closeColorPressed:C,closeIconColor:O,closeIconColorHover:R,closeIconColorPressed:t}=e;return Object.assign(Object.assign({},Ie),{itemHeightSmall:f,itemHeightMedium:f,itemHeightLarge:o,fontSizeSmall:d,fontSizeMedium:s,fontSizeLarge:r,borderRadius:a,dividerColor:g,borderColor:g,listColor:h,headerColor:$e(h,b),titleTextColor:c,titleTextColorDisabled:u,extraTextColor:z,extraTextColorDisabled:u,itemTextColor:T,itemTextColorDisabled:u,itemColorPending:y,titleFontWeight:i,closeColorHover:S,closeColorPressed:C,closeIconColor:O,closeIconColorHover:R,closeIconColorPressed:t})}const dt=Oe({name:"Transfer",common:Be,peers:{Checkbox:Ve,Scrollbar:Ae,Input:Pe,Empty:Le,Button:_e},self:nt}),U=Ne("n-transfer"),ct=x("transfer",`
 width: 100%;
 font-size: var(--n-font-size);
 height: 300px;
 display: flex;
 flex-wrap: nowrap;
 word-break: break-word;
`,[N("disabled",[x("transfer-list",[x("transfer-list-header",[p("title",`
 color: var(--n-header-text-color-disabled);
 `),p("extra",`
 color: var(--n-header-extra-text-color-disabled);
 `)])])]),x("transfer-list",`
 flex: 1;
 min-width: 0;
 height: inherit;
 display: flex;
 flex-direction: column;
 background-clip: padding-box;
 position: relative;
 transition: background-color .3s var(--n-bezier);
 background-color: var(--n-list-color);
 `,[N("source",`
 border-top-left-radius: var(--n-border-radius);
 border-bottom-left-radius: var(--n-border-radius);
 `,[p("border","border-right: 1px solid var(--n-divider-color);")]),N("target",`
 border-top-right-radius: var(--n-border-radius);
 border-bottom-right-radius: var(--n-border-radius);
 `,[p("border","border-left: none;")]),p("border",`
 padding: 0 12px;
 border: 1px solid var(--n-border-color);
 transition: border-color .3s var(--n-bezier);
 pointer-events: none;
 border-radius: inherit;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 `),x("transfer-list-header",`
 min-height: var(--n-header-height);
 box-sizing: border-box;
 display: flex;
 padding: 12px 12px 10px 12px;
 align-items: center;
 background-clip: padding-box;
 border-radius: inherit;
 border-bottom-left-radius: 0;
 border-bottom-right-radius: 0;
 line-height: 1.5;
 transition:
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `,[Y("> *:not(:first-child)",`
 margin-left: 8px;
 `),p("title",`
 flex: 1;
 min-width: 0;
 line-height: 1.5;
 font-size: var(--n-header-font-size);
 font-weight: var(--n-header-font-weight);
 transition: color .3s var(--n-bezier);
 color: var(--n-header-text-color);
 `),p("button",`
 position: relative;
 `),p("extra",`
 transition: color .3s var(--n-bezier);
 font-size: var(--n-extra-font-size);
 margin-right: 0;
 white-space: nowrap;
 color: var(--n-header-extra-text-color);
 `)]),x("transfer-list-body",`
 flex-basis: 0;
 flex-grow: 1;
 box-sizing: border-box;
 position: relative;
 display: flex;
 flex-direction: column;
 border-radius: inherit;
 border-top-left-radius: 0;
 border-top-right-radius: 0;
 `,[x("transfer-filter",`
 padding: 4px 12px 8px 12px;
 box-sizing: border-box;
 transition:
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `),x("transfer-list-flex-container",`
 flex: 1;
 position: relative;
 `,[x("scrollbar",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 height: unset;
 `),x("empty",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateY(-50%) translateX(-50%);
 `),x("transfer-list-content",`
 padding: 0;
 margin: 0;
 position: relative;
 `,[x("transfer-list-item",`
 padding: 0 12px;
 min-height: var(--n-item-height);
 display: flex;
 align-items: center;
 color: var(--n-item-text-color);
 position: relative;
 transition: color .3s var(--n-bezier);
 `,[p("background",`
 position: absolute;
 left: 4px;
 right: 4px;
 top: 0;
 bottom: 0;
 border-radius: var(--n-border-radius);
 transition: background-color .3s var(--n-bezier);
 `),p("checkbox",`
 position: relative;
 margin-right: 8px;
 `),p("close",`
 opacity: 0;
 pointer-events: none;
 position: relative;
 transition:
 opacity .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `),p("label",`
 position: relative;
 min-width: 0;
 flex-grow: 1;
 `),N("source","cursor: pointer;"),N("disabled",`
 cursor: not-allowed;
 color: var(--n-item-text-color-disabled);
 `),Ue("disabled",[Y("&:hover",[p("background","background-color: var(--n-item-color-pending);"),p("close",`
 opacity: 1;
 pointer-events: all;
 `)])])])])])])])]),ee=A({name:"TransferFilter",props:{value:String,placeholder:String,disabled:Boolean,onUpdateValue:{type:Function,required:!0}},setup(){const{mergedThemeRef:e,mergedClsPrefixRef:i}=H(U);return{mergedClsPrefix:i,mergedTheme:e}},render(){const{mergedTheme:e,mergedClsPrefix:i}=this;return l("div",{class:`${i}-transfer-filter`},l(K,{value:this.value,onUpdateValue:this.onUpdateValue,disabled:this.disabled,placeholder:this.placeholder,theme:e.peers.Input,themeOverrides:e.peerOverrides.Input,clearable:!0,size:"small"},{"clear-icon-placeholder":()=>l(De,{clsPrefix:i},{default:()=>l(st,null)})}))}}),te=A({name:"TransferHeader",props:{size:{type:String,required:!0},selectAllText:String,clearText:String,source:Boolean,onCheckedAll:Function,onClearAll:Function,title:[String,Function]},setup(e){const{targetOptionsRef:i,canNotSelectAnythingRef:r,canBeClearedRef:s,allCheckedRef:d,mergedThemeRef:o,disabledRef:f,mergedClsPrefixRef:a,srcOptionsLengthRef:h}=H(U),{localeRef:b}=Me("Transfer");return()=>{const{source:c,onClearAll:u,onCheckedAll:T,selectAllText:z,clearText:g}=e,{value:y}=o,{value:S}=a,{value:C}=b,O=e.size==="large"?"small":"tiny",{title:R}=e;return l("div",{class:`${S}-transfer-list-header`},R&&l("div",{class:`${S}-transfer-list-header__title`},typeof R=="function"?R():R),c&&l(W,{class:`${S}-transfer-list-header__button`,theme:y.peers.Button,themeOverrides:y.peerOverrides.Button,size:O,tertiary:!0,onClick:d.value?u:T,disabled:r.value||f.value},{default:()=>d.value?g||C.unselectAll:z||C.selectAll}),!c&&s.value&&l(W,{class:`${S}-transfer-list-header__button`,theme:y.peers.Button,themeOverrides:y.peerOverrides.Button,size:O,tertiary:!0,onClick:u,disabled:f.value},{default:()=>C.clearAll}),l("div",{class:`${S}-transfer-list-header__extra`},c?C.total(h.value):C.selected(i.value.length)))}}}),re=A({name:"NTransferListItem",props:{source:Boolean,label:{type:String,required:!0},value:{type:[String,Number],required:!0},disabled:Boolean,option:{type:Object,required:!0}},setup(e){const{targetValueSetRef:i,mergedClsPrefixRef:r,mergedThemeRef:s,handleItemCheck:d,renderSourceLabelRef:o,renderTargetLabelRef:f,showSelectedRef:a}=H(U),h=qe(()=>i.value.has(e.value));function b(){e.disabled||d(!h.value,e.value)}return{mergedClsPrefix:r,mergedTheme:s,checked:h,showSelected:a,renderSourceLabel:o,renderTargetLabel:f,handleClick:b}},render(){const{disabled:e,mergedTheme:i,mergedClsPrefix:r,label:s,checked:d,source:o,renderSourceLabel:f,renderTargetLabel:a}=this;return l("div",{class:[`${r}-transfer-list-item`,e&&`${r}-transfer-list-item--disabled`,o?`${r}-transfer-list-item--source`:`${r}-transfer-list-item--target`],onClick:o?this.handleClick:void 0},l("div",{class:`${r}-transfer-list-item__background`}),o&&this.showSelected&&l("div",{class:`${r}-transfer-list-item__checkbox`},l(ot,{theme:i.peers.Checkbox,themeOverrides:i.peerOverrides.Checkbox,disabled:e,checked:d})),l("div",{class:`${r}-transfer-list-item__label`,title:He(s)},o?f?f({option:this.option}):s:a?a({option:this.option}):s),!o&&!e&&l(Ee,{focusable:!1,class:`${r}-transfer-list-item__close`,clsPrefix:r,onClick:this.handleClick}))}}),le=A({name:"TransferList",props:{virtualScroll:{type:Boolean,required:!0},itemSize:{type:Number,required:!0},options:{type:Array,required:!0},disabled:{type:Boolean,required:!0},source:Boolean},setup(){const{mergedThemeRef:e,mergedClsPrefixRef:i}=H(U),r=P(null),s=P(null);function d(){var a;(a=r.value)===null||a===void 0||a.sync()}function o(){const{value:a}=s;if(!a)return null;const{listElRef:h}=a;return h}function f(){const{value:a}=s;if(!a)return null;const{itemsElRef:h}=a;return h}return{mergedTheme:e,mergedClsPrefix:i,scrollerInstRef:r,vlInstRef:s,syncVLScroller:d,scrollContainer:o,scrollContent:f}},render(){const{mergedTheme:e,options:i}=this;if(i.length===0)return l(je,{theme:e.peers.Empty,themeOverrides:e.peerOverrides.Empty});const{mergedClsPrefix:r,virtualScroll:s,source:d,disabled:o,syncVLScroller:f}=this;return l(G,{ref:"scrollerInstRef",theme:e.peers.Scrollbar,themeOverrides:e.peerOverrides.Scrollbar,container:s?this.scrollContainer:void 0,content:s?this.scrollContent:void 0},{default:()=>s?l(Je,{ref:"vlInstRef",style:{height:"100%"},class:`${r}-transfer-list-content`,items:this.options,itemSize:this.itemSize,showScrollbar:!1,onResize:f,onScroll:f,keyField:"value"},{default:({item:a})=>{const{source:h,disabled:b}=this;return l(re,{source:h,key:a.value,value:a.value,disabled:a.disabled||b,label:a.label,option:a})}}):l("div",{class:`${r}-transfer-list-content`},i.map(a=>l(re,{source:d,key:a.value,value:a.value,disabled:a.disabled||o,label:a.label,option:a})))})}});function ut(e){const i=P(e.defaultValue),r=Ke(M(e,"value"),i),s=m(()=>{const t=new Map;return(e.options||[]).forEach(n=>t.set(n.value,n)),t}),d=m(()=>new Set(r.value||[])),o=m(()=>{const t=s.value,n=[];return(r.value||[]).forEach($=>{const k=t.get($);k&&n.push(k)}),n}),f=P(""),a=P(""),h=m(()=>e.sourceFilterable||!!e.filterable),b=m(()=>{const{showSelected:t,options:n,filter:$}=e;return h.value?n.filter(k=>$(f.value,k,"source")&&(t||!d.value.has(k.value))):t?n:n.filter(k=>!d.value.has(k.value))}),c=m(()=>{if(!e.targetFilterable)return o.value;const{filter:t}=e;return o.value.filter(n=>t(a.value,n,"target"))}),u=m(()=>{const{value:t}=r;return t===null?new Set:new Set(t)}),T=m(()=>{const t=new Set(u.value);return b.value.forEach(n=>{!n.disabled&&!t.has(n.value)&&t.add(n.value)}),t}),z=m(()=>{const t=new Set(u.value);return b.value.forEach(n=>{!n.disabled&&t.has(n.value)&&t.delete(n.value)}),t}),g=m(()=>{const t=new Set(u.value);return c.value.forEach(n=>{n.disabled||t.delete(n.value)}),t}),y=m(()=>b.value.every(t=>t.disabled)),S=m(()=>{if(!b.value.length)return!1;const t=u.value;return b.value.every(n=>n.disabled||t.has(n.value))}),C=m(()=>c.value.some(t=>!t.disabled));function O(t){f.value=t??""}function R(t){a.value=t??""}return{uncontrolledValueRef:i,mergedValueRef:r,targetValueSetRef:d,valueSetForCheckAllRef:T,valueSetForUncheckAllRef:z,valueSetForClearRef:g,filteredTgtOptionsRef:c,filteredSrcOptionsRef:b,targetOptionsRef:o,canNotSelectAnythingRef:y,canBeClearedRef:C,allCheckedRef:S,srcPatternRef:f,tgtPatternRef:a,mergedSrcFilterableRef:h,handleSrcFilterUpdateValue:O,handleTgtFilterUpdateValue:R}}const ft=Object.assign(Object.assign({},ae.props),{value:Array,defaultValue:{type:Array,default:null},options:{type:Array,default:()=>[]},disabled:{type:Boolean,default:void 0},virtualScroll:Boolean,sourceTitle:[String,Function],selectAllText:String,clearText:String,targetTitle:[String,Function],filterable:{type:Boolean,default:void 0},sourceFilterable:Boolean,targetFilterable:Boolean,showSelected:{type:Boolean,default:!0},sourceFilterPlaceholder:String,targetFilterPlaceholder:String,filter:{type:Function,default:(e,i)=>e?~`${i.label}`.toLowerCase().indexOf(`${e}`.toLowerCase()):!0},size:String,renderSourceLabel:Function,renderTargetLabel:Function,renderSourceList:Function,renderTargetList:Function,"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],onChange:[Function,Array]}),ht=A({name:"Transfer",props:ft,setup(e){const{mergedClsPrefixRef:i}=We(e),r=ae("Transfer","-transfer",ct,dt,e,i),s=Ge(e),{mergedSizeRef:d,mergedDisabledRef:o}=s,f=m(()=>{const{value:v}=d,{self:{[I("itemHeight",v)]:w}}=r.value;return Xe(w)}),{uncontrolledValueRef:a,mergedValueRef:h,targetValueSetRef:b,valueSetForCheckAllRef:c,valueSetForUncheckAllRef:u,valueSetForClearRef:T,filteredTgtOptionsRef:z,filteredSrcOptionsRef:g,targetOptionsRef:y,canNotSelectAnythingRef:S,canBeClearedRef:C,allCheckedRef:O,srcPatternRef:R,tgtPatternRef:t,mergedSrcFilterableRef:n,handleSrcFilterUpdateValue:$,handleTgtFilterUpdateValue:k}=ut(e);function V(v){const{onUpdateValue:w,"onUpdate:value":B,onChange:D}=e,{nTriggerFormInput:E,nTriggerFormChange:q}=s;w&&j(w,v),B&&j(B,v),D&&j(D,v),a.value=v,E(),q()}function oe(){V([...c.value])}function ie(){V([...u.value])}function se(){V([...T.value])}function X(v,w){V(v?(h.value||[]).concat(w):(h.value||[]).filter(B=>B!==w))}function ne(v){V(v)}return Ye(U,{targetValueSetRef:b,mergedClsPrefixRef:i,disabledRef:o,mergedThemeRef:r,targetOptionsRef:y,canNotSelectAnythingRef:S,canBeClearedRef:C,allCheckedRef:O,srcOptionsLengthRef:m(()=>e.options.length),handleItemCheck:X,renderSourceLabelRef:M(e,"renderSourceLabel"),renderTargetLabelRef:M(e,"renderTargetLabel"),showSelectedRef:M(e,"showSelected")}),{mergedClsPrefix:i,mergedDisabled:o,itemSize:f,isMounted:Qe(),mergedTheme:r,filteredSrcOpts:g,filteredTgtOpts:z,srcPattern:R,tgtPattern:t,mergedSize:d,mergedSrcFilterable:n,handleSrcFilterUpdateValue:$,handleTgtFilterUpdateValue:k,handleSourceCheckAll:oe,handleSourceUncheckAll:ie,handleTargetClearAll:se,handleItemCheck:X,handleChecked:ne,cssVars:m(()=>{const{value:v}=d,{common:{cubicBezierEaseInOut:w},self:{borderRadius:B,borderColor:D,listColor:E,titleTextColor:q,titleTextColorDisabled:de,extraTextColor:ce,itemTextColor:ue,itemColorPending:fe,itemTextColorDisabled:he,titleFontWeight:be,closeColorHover:me,closeColorPressed:ge,closeIconColor:ve,closeIconColorHover:pe,closeIconColorPressed:xe,closeIconSize:Se,closeSize:Ce,dividerColor:Te,extraTextColorDisabled:ye,[I("extraFontSize",v)]:Re,[I("fontSize",v)]:ze,[I("titleFontSize",v)]:ke,[I("itemHeight",v)]:we,[I("headerHeight",v)]:Fe}}=r.value;return{"--n-bezier":w,"--n-border-color":D,"--n-border-radius":B,"--n-extra-font-size":Re,"--n-font-size":ze,"--n-header-font-size":ke,"--n-header-extra-text-color":ce,"--n-header-extra-text-color-disabled":ye,"--n-header-font-weight":be,"--n-header-text-color":q,"--n-header-text-color-disabled":de,"--n-item-color-pending":fe,"--n-item-height":we,"--n-item-text-color":ue,"--n-item-text-color-disabled":he,"--n-list-color":E,"--n-header-height":Fe,"--n-close-size":Ce,"--n-close-icon-size":Se,"--n-close-color-hover":me,"--n-close-color-pressed":ge,"--n-close-icon-color":ve,"--n-close-icon-color-hover":pe,"--n-close-icon-color-pressed":xe,"--n-divider-color":Te}})}},render(){const{mergedClsPrefix:e,renderSourceList:i,renderTargetList:r,mergedTheme:s,mergedSrcFilterable:d,targetFilterable:o}=this;return l("div",{class:[`${e}-transfer`,this.mergedDisabled&&`${e}-transfer--disabled`],style:this.cssVars},l("div",{class:`${e}-transfer-list ${e}-transfer-list--source`},l(te,{source:!0,selectAllText:this.selectAllText,clearText:this.clearText,title:this.sourceTitle,onCheckedAll:this.handleSourceCheckAll,onClearAll:this.handleSourceUncheckAll,size:this.mergedSize}),l("div",{class:`${e}-transfer-list-body`},d?l(ee,{onUpdateValue:this.handleSrcFilterUpdateValue,value:this.srcPattern,disabled:this.mergedDisabled,placeholder:this.sourceFilterPlaceholder}):null,l("div",{class:`${e}-transfer-list-flex-container`},i?l(G,{theme:s.peers.Scrollbar,themeOverrides:s.peerOverrides.Scrollbar},{default:()=>i({onCheck:this.handleChecked,checkedOptions:this.filteredTgtOpts,pattern:this.srcPattern})}):l(le,{source:!0,options:this.filteredSrcOpts,disabled:this.mergedDisabled,virtualScroll:this.virtualScroll,itemSize:this.itemSize}))),l("div",{class:`${e}-transfer-list__border`})),l("div",{class:`${e}-transfer-list ${e}-transfer-list--target`},l(te,{onClearAll:this.handleTargetClearAll,size:this.mergedSize,title:this.targetTitle}),l("div",{class:`${e}-transfer-list-body`},o?l(ee,{onUpdateValue:this.handleTgtFilterUpdateValue,value:this.tgtPattern,disabled:this.mergedDisabled,placeholder:this.sourceFilterPlaceholder}):null,l("div",{class:`${e}-transfer-list-flex-container`},r?l(G,{theme:s.peers.Scrollbar,themeOverrides:s.peerOverrides.Scrollbar},{default:()=>r({onCheck:this.handleChecked,checkedOptions:this.filteredTgtOpts,pattern:this.tgtPattern})}):l(le,{options:this.filteredTgtOpts,disabled:this.mergedDisabled,virtualScroll:this.virtualScroll,itemSize:this.itemSize}))),l("div",{class:`${e}-transfer-list__border`})))}}),bt={class:"flex justify-end mt-4 gap-2"},pt=A({__name:"ToolGroupFormModal",props:{show:{type:Boolean,default:!1},editMode:{type:Boolean,default:!1},initialData:{type:Object,required:!0},availableTools:{type:Array,default:()=>[]}},emits:["update:show","submit"],setup(e,{emit:i}){const r=e,s=i,d=P(null),o=P({}),f=m(()=>r.availableTools.map(c=>({label:c.name,value:c.id,disabled:!1,description:c.description})));Q(()=>r.initialData,c=>{o.value=JSON.parse(JSON.stringify(c))},{immediate:!0,deep:!0}),Q(()=>r.show,c=>{c||(o.value=JSON.parse(JSON.stringify(r.initialData)))});function a(){d.value?.validate(c=>{c||s("submit",o.value)})}const h=m({get:()=>r.show,set:c=>s("update:show",c)});function b(){s("update:show",!1)}return(c,u)=>{const T=W,z=rt;return h.value?(tt(),Ze(z,{key:0,show:h.value,"onUpdate:show":u[3]||(u[3]=g=>h.value=g),title:e.editMode?"编辑工具组":"新建工具组",preset:"card",style:{width:"60vw"},"mask-closable":!1},{default:_(()=>[F(L(it),{ref_key:"formRef",ref:d,model:o.value,"label-placement":"left","label-width":"80","require-mark-placement":"right-hanging"},{default:_(()=>[F(L(J),{label:"组名称",path:"name",rule:{required:!0,message:"请输入工具组名称"}},{default:_(()=>[F(L(K),{value:o.value.name,"onUpdate:value":u[0]||(u[0]=g=>o.value.name=g),placeholder:"请输入工具组名称"},null,8,["value"])]),_:1}),F(L(J),{label:"描述",path:"description"},{default:_(()=>[F(L(K),{value:o.value.description,"onUpdate:value":u[1]||(u[1]=g=>o.value.description=g),type:"textarea",placeholder:"请输入工具组描述",autosize:{minRows:3,maxRows:5}},null,8,["value"])]),_:1}),F(L(J),{label:"关联工具",path:"toolIds"},{default:_(()=>[F(L(ht),{value:o.value.toolIds,"onUpdate:value":u[2]||(u[2]=g=>o.value.toolIds=g),options:f.value,filterable:"","source-title":"可选工具","target-title":"已选工具",size:"large"},null,8,["value","options"])]),_:1}),lt("div",bt,[F(T,{onClick:b},{default:_(()=>u[4]||(u[4]=[Z(" 取消 ")])),_:1}),F(T,{type:"primary",onClick:a},{default:_(()=>[Z(at(e.editMode?"保存修改":"创建工具组"),1)]),_:1})])]),_:1},8,["model"])]),_:1},8,["show","title"])):et("",!0)}}});export{pt as _};
