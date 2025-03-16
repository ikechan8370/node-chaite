import{aw as ee,ax as oe,a6 as P,r as k,a8 as I,a9 as D,aP as V,a4 as $,ac as w,a1 as _,at as m,ah as C,ae as F,ai as T,d as te,h3 as re,h4 as ne,F as A,a7 as G,hs as ae,av as ie,ak as de,x as U,al as E,aa as se}from"./index-CucaxZT9.js";const he={name:String,value:{type:[String,Number,Boolean],default:"on"},checked:{type:Boolean,default:void 0},defaultChecked:Boolean,disabled:{type:Boolean,default:void 0},label:String,size:String,onUpdateChecked:[Function,Array],"onUpdate:checked":[Function,Array],checkedValue:{type:Boolean,default:void 0}},j=ee("n-radio-group");function ve(e){const o=oe(j,null),r=P(e,{mergedSize(t){const{size:a}=e;if(a!==void 0)return a;if(o){const{mergedSizeRef:{value:d}}=o;if(d!==void 0)return d}return t?t.mergedSize.value:"medium"},mergedDisabled(t){return!!(e.disabled||o?.disabledRef.value||t?.disabled.value)}}),{mergedSizeRef:b,mergedDisabledRef:n}=r,s=k(null),l=k(null),u=k(e.defaultChecked),h=I(e,"checked"),g=D(h,u),f=V(()=>o?o.valueRef.value===e.value:g.value),R=V(()=>{const{name:t}=e;if(t!==void 0)return t;if(o)return o.nameRef.value}),v=k(!1);function x(){if(o){const{doUpdateValue:t}=o,{value:a}=e;w(t,a)}else{const{onUpdateChecked:t,"onUpdate:checked":a}=e,{nTriggerFormInput:d,nTriggerFormChange:i}=r;t&&w(t,!0),a&&w(a,!0),d(),i(),u.value=!0}}function p(){n.value||f.value||x()}function y(){p(),s.value&&(s.value.checked=f.value)}function z(){v.value=!1}function S(){v.value=!0}return{mergedClsPrefix:o?o.mergedClsPrefixRef:$(e).mergedClsPrefixRef,inputRef:s,labelRef:l,mergedName:R,mergedDisabled:n,renderSafeChecked:f,focus:v,mergedSize:b,handleRadioInputChange:y,handleRadioInputBlur:z,handleRadioInputFocus:S}}const le=_("radio-group",`
 display: inline-block;
 font-size: var(--n-font-size);
`,[m("splitor",`
 display: inline-block;
 vertical-align: bottom;
 width: 1px;
 transition:
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 background: var(--n-button-border-color);
 `,[C("checked",{backgroundColor:"var(--n-button-border-color-active)"}),C("disabled",{opacity:"var(--n-opacity-disabled)"})]),C("button-group",`
 white-space: nowrap;
 height: var(--n-height);
 line-height: var(--n-height);
 `,[_("radio-button",{height:"var(--n-height)",lineHeight:"var(--n-height)"}),m("splitor",{height:"var(--n-height)"})]),_("radio-button",`
 vertical-align: bottom;
 outline: none;
 position: relative;
 user-select: none;
 -webkit-user-select: none;
 display: inline-block;
 box-sizing: border-box;
 padding-left: 14px;
 padding-right: 14px;
 white-space: nowrap;
 transition:
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 background: var(--n-button-color);
 color: var(--n-button-text-color);
 border-top: 1px solid var(--n-button-border-color);
 border-bottom: 1px solid var(--n-button-border-color);
 `,[_("radio-input",`
 pointer-events: none;
 position: absolute;
 border: 0;
 border-radius: inherit;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 opacity: 0;
 z-index: 1;
 `),m("state-border",`
 z-index: 1;
 pointer-events: none;
 position: absolute;
 box-shadow: var(--n-button-box-shadow);
 transition: box-shadow .3s var(--n-bezier);
 left: -1px;
 bottom: -1px;
 right: -1px;
 top: -1px;
 `),F("&:first-child",`
 border-top-left-radius: var(--n-button-border-radius);
 border-bottom-left-radius: var(--n-button-border-radius);
 border-left: 1px solid var(--n-button-border-color);
 `,[m("state-border",`
 border-top-left-radius: var(--n-button-border-radius);
 border-bottom-left-radius: var(--n-button-border-radius);
 `)]),F("&:last-child",`
 border-top-right-radius: var(--n-button-border-radius);
 border-bottom-right-radius: var(--n-button-border-radius);
 border-right: 1px solid var(--n-button-border-color);
 `,[m("state-border",`
 border-top-right-radius: var(--n-button-border-radius);
 border-bottom-right-radius: var(--n-button-border-radius);
 `)]),T("disabled",`
 cursor: pointer;
 `,[F("&:hover",[m("state-border",`
 transition: box-shadow .3s var(--n-bezier);
 box-shadow: var(--n-button-box-shadow-hover);
 `),T("checked",{color:"var(--n-button-text-color-hover)"})]),C("focus",[F("&:not(:active)",[m("state-border",{boxShadow:"var(--n-button-box-shadow-focus)"})])])]),C("checked",`
 background: var(--n-button-color-active);
 color: var(--n-button-text-color-active);
 border-color: var(--n-button-border-color-active);
 `),C("disabled",`
 cursor: not-allowed;
 opacity: var(--n-opacity-disabled);
 `)])]);function ue(e,o,r){var b;const n=[];let s=!1;for(let l=0;l<e.length;++l){const u=e[l],h=(b=u.type)===null||b===void 0?void 0:b.name;h==="RadioButton"&&(s=!0);const g=u.props;if(h!=="RadioButton"){n.push(u);continue}if(l===0)n.push(u);else{const f=n[n.length-1].props,R=o===f.value,v=f.disabled,x=o===g.value,p=g.disabled,y=(R?2:0)+(v?0:1),z=(x?2:0)+(p?0:1),S={[`${r}-radio-group__splitor--disabled`]:v,[`${r}-radio-group__splitor--checked`]:R},t={[`${r}-radio-group__splitor--disabled`]:p,[`${r}-radio-group__splitor--checked`]:x},a=y<z?t:S;n.push(A("div",{class:[`${r}-radio-group__splitor`,a]}),u)}}return{children:n,isButtonGroup:s}}const ce=Object.assign(Object.assign({},G.props),{name:String,value:[String,Number,Boolean],defaultValue:{type:[String,Number,Boolean],default:null},size:String,disabled:{type:Boolean,default:void 0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array]}),fe=te({name:"RadioGroup",props:ce,setup(e){const o=k(null),{mergedSizeRef:r,mergedDisabledRef:b,nTriggerFormChange:n,nTriggerFormInput:s,nTriggerFormBlur:l,nTriggerFormFocus:u}=P(e),{mergedClsPrefixRef:h,inlineThemeDisabled:g,mergedRtlRef:f}=$(e),R=G("Radio","-radio-group",le,ae,e,h),v=k(e.defaultValue),x=I(e,"value"),p=D(x,v);function y(i){const{onUpdateValue:c,"onUpdate:value":B}=e;c&&w(c,i),B&&w(B,i),v.value=i,n(),s()}function z(i){const{value:c}=o;c&&(c.contains(i.relatedTarget)||u())}function S(i){const{value:c}=o;c&&(c.contains(i.relatedTarget)||l())}ie(j,{mergedClsPrefixRef:h,nameRef:I(e,"name"),valueRef:p,disabledRef:b,mergedSizeRef:r,doUpdateValue:y});const t=de("Radio",f,h),a=U(()=>{const{value:i}=r,{common:{cubicBezierEaseInOut:c},self:{buttonBorderColor:B,buttonBorderColorActive:H,buttonBorderRadius:M,buttonBoxShadow:N,buttonBoxShadowFocus:K,buttonBoxShadowHover:O,buttonColor:L,buttonColorActive:q,buttonTextColor:J,buttonTextColorActive:Q,buttonTextColorHover:W,opacityDisabled:X,[E("buttonHeight",i)]:Y,[E("fontSize",i)]:Z}}=R.value;return{"--n-font-size":Z,"--n-bezier":c,"--n-button-border-color":B,"--n-button-border-color-active":H,"--n-button-border-radius":M,"--n-button-box-shadow":N,"--n-button-box-shadow-focus":K,"--n-button-box-shadow-hover":O,"--n-button-color":L,"--n-button-color-active":q,"--n-button-text-color":J,"--n-button-text-color-hover":W,"--n-button-text-color-active":Q,"--n-height":Y,"--n-opacity-disabled":X}}),d=g?se("radio-group",U(()=>r.value[0]),a,e):void 0;return{selfElRef:o,rtlEnabled:t,mergedClsPrefix:h,mergedValue:p,handleFocusout:S,handleFocusin:z,cssVars:g?void 0:a,themeClass:d?.themeClass,onRender:d?.onRender}},render(){var e;const{mergedValue:o,mergedClsPrefix:r,handleFocusin:b,handleFocusout:n}=this,{children:s,isButtonGroup:l}=ue(re(ne(this)),o,r);return(e=this.onRender)===null||e===void 0||e.call(this),A("div",{onFocusin:b,onFocusout:n,ref:"selfElRef",class:[`${r}-radio-group`,this.rtlEnabled&&`${r}-radio-group--rtl`,this.themeClass,l&&`${r}-radio-group--button-group`],style:this.cssVars},s)}});export{fe as _,he as r,ve as s};
