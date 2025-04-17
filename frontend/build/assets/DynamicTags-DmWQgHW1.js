import{a1 as N,a2 as L,a3 as U,a4 as _,a5 as K,a6 as W,a7 as w,d as E,p as o,N as $,E as H,B as M,a8 as q,a9 as G,z as J,aa as Q,ab as X,ac as Y,r as v,ad as k,ae as Z,af as ee,s as V,ag as te,ah as ae,ai as j,aj as ne}from"./index-C7DPnO_D.js";import{s as se}from"./prop-BjyUHhTu.js";const ie=N({name:"DynamicTags",common:W,peers:{Input:K,Button:_,Tag:U,Space:L},self(){return{inputWidth:"64px"}}}),le=w("dynamic-tags",[w("input",{minWidth:"var(--n-input-width)"})]),ue=Object.assign(Object.assign(Object.assign({},k.props),ne),{size:{type:String,default:"medium"},closable:{type:Boolean,default:!0},defaultValue:{type:Array,default:()=>[]},value:Array,inputClass:String,inputStyle:[String,Object],inputProps:Object,max:Number,tagClass:String,tagStyle:[String,Object],renderTag:Function,onCreate:{type:Function,default:t=>t},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],onChange:[Function,Array]}),de=E({name:"DynamicTags",props:ue,slots:Object,setup(t){const{mergedClsPrefixRef:y,inlineThemeDisabled:d}=Q(t),{localeRef:c}=X("DynamicTags"),m=Y(t),{mergedDisabledRef:s}=m,g=v(""),p=v(!1),h=v(!0),C=v(null),b=k("DynamicTags","-dynamic-tags",le,ie,t,y),T=v(t.defaultValue),F=Z(t,"value"),l=ee(F,T),O=V(()=>c.value.add),z=V(()=>se(t.size)),D=V(()=>s.value||!!t.max&&l.value.length>=t.max);function R(e){const{onChange:a,"onUpdate:value":n,onUpdateValue:r}=t,{nTriggerFormInput:x,nTriggerFormChange:P}=m;a&&j(a,e),r&&j(r,e),n&&j(n,e),T.value=e,x(),P()}function I(e){const a=l.value.slice(0);a.splice(e,1),R(a)}function B(e){switch(e.key){case"Enter":u()}}function u(e){const a=e??g.value;if(a){const n=l.value.slice(0);n.push(t.onCreate(a)),R(n)}p.value=!1,h.value=!0,g.value=""}function A(){u()}function S(){p.value=!0,ae(()=>{var e;(e=C.value)===null||e===void 0||e.focus(),h.value=!1})}const f=V(()=>{const{self:{inputWidth:e}}=b.value;return{"--n-input-width":e}}),i=d?te("dynamic-tags",void 0,f,t):void 0;return{mergedClsPrefix:y,inputInstRef:C,localizedAdd:O,inputSize:z,inputValue:g,showInput:p,inputForceFocused:h,mergedValue:l,mergedDisabled:s,triggerDisabled:D,handleInputKeyDown:B,handleAddClick:S,handleInputBlur:A,handleCloseClick:I,handleInputConfirm:u,mergedTheme:b,cssVars:d?void 0:f,themeClass:i?.themeClass,onRender:i?.onRender}},render(){const{mergedTheme:t,cssVars:y,mergedClsPrefix:d,onRender:c,renderTag:m}=this;return c?.(),o(J,{class:[`${d}-dynamic-tags`,this.themeClass],size:"small",style:y,theme:t.peers.Space,themeOverrides:t.peerOverrides.Space,itemStyle:"display: flex;"},{default:()=>{const{mergedTheme:s,tagClass:g,tagStyle:p,type:h,round:C,size:b,color:T,closable:F,mergedDisabled:l,showInput:O,inputValue:z,inputClass:D,inputStyle:R,inputSize:I,inputForceFocused:B,triggerDisabled:u,handleInputKeyDown:A,handleInputBlur:S,handleAddClick:f,handleCloseClick:i,handleInputConfirm:e,$slots:a}=this;return this.mergedValue.map((n,r)=>m?m(n,r):o($,{key:r,theme:s.peers.Tag,themeOverrides:s.peerOverrides.Tag,class:g,style:p,type:h,round:C,size:b,color:T,closable:F,disabled:l,onClose:()=>{i(r)}},{default:()=>typeof n=="string"?n:n.label})).concat(O?a.input?a.input({submit:e,deactivate:S}):o(H,Object.assign({placeholder:"",size:I,style:R,class:D,autosize:!0},this.inputProps,{ref:"inputInstRef",value:z,onUpdateValue:n=>{this.inputValue=n},theme:s.peers.Input,themeOverrides:s.peerOverrides.Input,onKeydown:A,onBlur:S,internalForceFocus:B})):a.trigger?a.trigger({activate:f,disabled:u}):o(M,{dashed:!0,disabled:u,theme:s.peers.Button,themeOverrides:s.peerOverrides.Button,size:I,onClick:f},{icon:()=>o(q,{clsPrefix:d},{default:()=>o(G,null)})}))}})}});export{de as N};
