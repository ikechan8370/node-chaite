import{a1 as c,ah as d,at as o,ai as O,ae as n,d as j,F as l,az as H,a7 as v,hs as T,x as h,al as u,a4 as V,ak as L,aa as M}from"./index-CucaxZT9.js";import{s as N,r as W}from"./RadioGroup-B2AZpoS6.js";const K=c("radio",`
 line-height: var(--n-label-line-height);
 outline: none;
 position: relative;
 user-select: none;
 -webkit-user-select: none;
 display: inline-flex;
 align-items: flex-start;
 flex-wrap: nowrap;
 font-size: var(--n-font-size);
 word-break: break-word;
`,[d("checked",[o("dot",`
 background-color: var(--n-color-active);
 `)]),o("dot-wrapper",`
 position: relative;
 flex-shrink: 0;
 flex-grow: 0;
 width: var(--n-radio-size);
 `),c("radio-input",`
 position: absolute;
 border: 0;
 border-radius: inherit;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 opacity: 0;
 z-index: 1;
 cursor: pointer;
 `),o("dot",`
 position: absolute;
 top: 50%;
 left: 0;
 transform: translateY(-50%);
 height: var(--n-radio-size);
 width: var(--n-radio-size);
 background: var(--n-color);
 box-shadow: var(--n-box-shadow);
 border-radius: 50%;
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 `,[n("&::before",`
 content: "";
 opacity: 0;
 position: absolute;
 left: 4px;
 top: 4px;
 height: calc(100% - 8px);
 width: calc(100% - 8px);
 border-radius: 50%;
 transform: scale(.8);
 background: var(--n-dot-color-active);
 transition: 
 opacity .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 transform .3s var(--n-bezier);
 `),d("checked",{boxShadow:"var(--n-box-shadow-active)"},[n("&::before",`
 opacity: 1;
 transform: scale(1);
 `)])]),o("label",`
 color: var(--n-text-color);
 padding: var(--n-label-padding);
 font-weight: var(--n-label-font-weight);
 display: inline-block;
 transition: color .3s var(--n-bezier);
 `),O("disabled",`
 cursor: pointer;
 `,[n("&:hover",[o("dot",{boxShadow:"var(--n-box-shadow-hover)"})]),d("focus",[n("&:not(:active)",[o("dot",{boxShadow:"var(--n-box-shadow-focus)"})])])]),d("disabled",`
 cursor: not-allowed;
 `,[o("dot",{boxShadow:"var(--n-box-shadow-disabled)",backgroundColor:"var(--n-color-disabled)"},[n("&::before",{backgroundColor:"var(--n-dot-color-disabled)"}),d("checked",`
 opacity: 1;
 `)]),o("label",{color:"var(--n-text-color-disabled)"}),c("radio-input",`
 cursor: not-allowed;
 `)])]),Y=Object.assign(Object.assign({},v.props),W),J=j({name:"Radio",props:Y,setup(a){const e=N(a),i=v("Radio","-radio",K,T,a,e.mergedClsPrefix),s=h(()=>{const{mergedSize:{value:b}}=e,{common:{cubicBezierEaseInOut:g},self:{boxShadow:w,boxShadowActive:m,boxShadowDisabled:z,boxShadowFocus:k,boxShadowHover:C,color:S,colorDisabled:R,colorActive:_,textColor:y,textColorDisabled:$,dotColorActive:D,dotColorDisabled:P,labelPadding:B,labelLineHeight:E,labelFontWeight:F,[u("fontSize",b)]:A,[u("radioSize",b)]:I}}=i.value;return{"--n-bezier":g,"--n-label-line-height":E,"--n-label-font-weight":F,"--n-box-shadow":w,"--n-box-shadow-active":m,"--n-box-shadow-disabled":z,"--n-box-shadow-focus":k,"--n-box-shadow-hover":C,"--n-color":S,"--n-color-active":_,"--n-color-disabled":R,"--n-dot-color-active":D,"--n-dot-color-disabled":P,"--n-font-size":A,"--n-radio-size":I,"--n-text-color":y,"--n-text-color-disabled":$,"--n-label-padding":B}}),{inlineThemeDisabled:t,mergedClsPrefixRef:f,mergedRtlRef:p}=V(a),x=L("Radio",p,f),r=t?M("radio",h(()=>e.mergedSize.value[0]),s,a):void 0;return Object.assign(e,{rtlEnabled:x,cssVars:t?void 0:s,themeClass:r?.themeClass,onRender:r?.onRender})},render(){const{$slots:a,mergedClsPrefix:e,onRender:i,label:s}=this;return i?.(),l("label",{class:[`${e}-radio`,this.themeClass,this.rtlEnabled&&`${e}-radio--rtl`,this.mergedDisabled&&`${e}-radio--disabled`,this.renderSafeChecked&&`${e}-radio--checked`,this.focus&&`${e}-radio--focus`],style:this.cssVars},l("input",{ref:"inputRef",type:"radio",class:`${e}-radio-input`,value:this.value,name:this.mergedName,checked:this.renderSafeChecked,disabled:this.mergedDisabled,onChange:this.handleRadioInputChange,onFocus:this.handleRadioInputFocus,onBlur:this.handleRadioInputBlur}),l("div",{class:`${e}-radio__dot-wrapper`}," ",l("div",{class:[`${e}-radio__dot`,this.renderSafeChecked&&`${e}-radio__dot--checked`]})),H(a.default,t=>!t&&!s?null:l("div",{ref:"labelRef",class:`${e}-radio__label`},t||s)))}});export{J as _};
