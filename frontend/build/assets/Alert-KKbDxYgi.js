import{a0 as O,hu as M,hv as u,b9 as v,a1 as I,at as i,ah as T,h7 as V,ae as N,d as D,F as l,h1 as K,hw as q,aA as G,a2 as J,hx as Q,hy as U,hz as X,hA as Y,az as Z,h9 as oo,a4 as eo,a7 as E,ak as ro,x as $,hB as no,al as c,aa as so,r as lo}from"./index-CucaxZT9.js";function to(r){const{lineHeight:o,borderRadius:d,fontWeightStrong:b,baseColor:t,dividerColor:C,actionColor:P,textColor1:h,textColor2:s,closeColorHover:g,closeColorPressed:f,closeIconColor:m,closeIconColorHover:p,closeIconColorPressed:n,infoColor:e,successColor:x,warningColor:z,errorColor:y,fontSize:S}=r;return Object.assign(Object.assign({},M),{fontSize:S,lineHeight:o,titleFontWeight:b,borderRadius:d,border:`1px solid ${C}`,color:P,titleTextColor:h,iconColor:s,contentTextColor:s,closeBorderRadius:d,closeColorHover:g,closeColorPressed:f,closeIconColor:m,closeIconColorHover:p,closeIconColorPressed:n,borderInfo:`1px solid ${u(t,v(e,{alpha:.25}))}`,colorInfo:u(t,v(e,{alpha:.08})),titleTextColorInfo:h,iconColorInfo:e,contentTextColorInfo:s,closeColorHoverInfo:g,closeColorPressedInfo:f,closeIconColorInfo:m,closeIconColorHoverInfo:p,closeIconColorPressedInfo:n,borderSuccess:`1px solid ${u(t,v(x,{alpha:.25}))}`,colorSuccess:u(t,v(x,{alpha:.08})),titleTextColorSuccess:h,iconColorSuccess:x,contentTextColorSuccess:s,closeColorHoverSuccess:g,closeColorPressedSuccess:f,closeIconColorSuccess:m,closeIconColorHoverSuccess:p,closeIconColorPressedSuccess:n,borderWarning:`1px solid ${u(t,v(z,{alpha:.33}))}`,colorWarning:u(t,v(z,{alpha:.08})),titleTextColorWarning:h,iconColorWarning:z,contentTextColorWarning:s,closeColorHoverWarning:g,closeColorPressedWarning:f,closeIconColorWarning:m,closeIconColorHoverWarning:p,closeIconColorPressedWarning:n,borderError:`1px solid ${u(t,v(y,{alpha:.25}))}`,colorError:u(t,v(y,{alpha:.08})),titleTextColorError:h,iconColorError:y,contentTextColorError:s,closeColorHoverError:g,closeColorPressedError:f,closeIconColorError:m,closeIconColorHoverError:p,closeIconColorPressedError:n})}const io={common:O,self:to},ao=I("alert",`
 line-height: var(--n-line-height);
 border-radius: var(--n-border-radius);
 position: relative;
 transition: background-color .3s var(--n-bezier);
 background-color: var(--n-color);
 text-align: start;
 word-break: break-word;
`,[i("border",`
 border-radius: inherit;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 transition: border-color .3s var(--n-bezier);
 border: var(--n-border);
 pointer-events: none;
 `),T("closable",[I("alert-body",[i("title",`
 padding-right: 24px;
 `)])]),i("icon",{color:"var(--n-icon-color)"}),I("alert-body",{padding:"var(--n-padding)"},[i("title",{color:"var(--n-title-text-color)"}),i("content",{color:"var(--n-content-text-color)"})]),V({originalTransition:"transform .3s var(--n-bezier)",enterToProps:{transform:"scale(1)"},leaveToProps:{transform:"scale(0.9)"}}),i("icon",`
 position: absolute;
 left: 0;
 top: 0;
 align-items: center;
 justify-content: center;
 display: flex;
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 font-size: var(--n-icon-size);
 margin: var(--n-icon-margin);
 `),i("close",`
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 position: absolute;
 right: 0;
 top: 0;
 margin: var(--n-close-margin);
 `),T("show-icon",[I("alert-body",{paddingLeft:"calc(var(--n-icon-margin-left) + var(--n-icon-size) + var(--n-icon-margin-right))"})]),T("right-adjust",[I("alert-body",{paddingRight:"calc(var(--n-close-size) + var(--n-padding) + 2px)"})]),I("alert-body",`
 border-radius: var(--n-border-radius);
 transition: border-color .3s var(--n-bezier);
 `,[i("title",`
 transition: color .3s var(--n-bezier);
 font-size: 16px;
 line-height: 19px;
 font-weight: var(--n-title-font-weight);
 `,[N("& +",[i("content",{marginTop:"9px"})])]),i("content",{transition:"color .3s var(--n-bezier)",fontSize:"var(--n-font-size)"})]),i("icon",{transition:"color .3s var(--n-bezier)"})]),co=Object.assign(Object.assign({},E.props),{title:String,showIcon:{type:Boolean,default:!0},type:{type:String,default:"default"},bordered:{type:Boolean,default:!0},closable:Boolean,onClose:Function,onAfterLeave:Function,onAfterHide:Function}),go=D({name:"Alert",inheritAttrs:!1,props:co,slots:Object,setup(r){const{mergedClsPrefixRef:o,mergedBorderedRef:d,inlineThemeDisabled:b,mergedRtlRef:t}=eo(r),C=E("Alert","-alert",ao,io,r,o),P=ro("Alert",t,o),h=$(()=>{const{common:{cubicBezierEaseInOut:n},self:e}=C.value,{fontSize:x,borderRadius:z,titleFontWeight:y,lineHeight:S,iconSize:H,iconMargin:R,iconMarginRtl:_,closeIconSize:w,closeBorderRadius:A,closeSize:W,closeMargin:B,closeMarginRtl:k,padding:j}=e,{type:a}=r,{left:L,right:F}=no(R);return{"--n-bezier":n,"--n-color":e[c("color",a)],"--n-close-icon-size":w,"--n-close-border-radius":A,"--n-close-color-hover":e[c("closeColorHover",a)],"--n-close-color-pressed":e[c("closeColorPressed",a)],"--n-close-icon-color":e[c("closeIconColor",a)],"--n-close-icon-color-hover":e[c("closeIconColorHover",a)],"--n-close-icon-color-pressed":e[c("closeIconColorPressed",a)],"--n-icon-color":e[c("iconColor",a)],"--n-border":e[c("border",a)],"--n-title-text-color":e[c("titleTextColor",a)],"--n-content-text-color":e[c("contentTextColor",a)],"--n-line-height":S,"--n-border-radius":z,"--n-font-size":x,"--n-title-font-weight":y,"--n-icon-size":H,"--n-icon-margin":R,"--n-icon-margin-rtl":_,"--n-close-size":W,"--n-close-margin":B,"--n-close-margin-rtl":k,"--n-padding":j,"--n-icon-margin-left":L,"--n-icon-margin-right":F}}),s=b?so("alert",$(()=>r.type[0]),h,r):void 0,g=lo(!0),f=()=>{const{onAfterLeave:n,onAfterHide:e}=r;n&&n(),e&&e()};return{rtlEnabled:P,mergedClsPrefix:o,mergedBordered:d,visible:g,handleCloseClick:()=>{var n;Promise.resolve((n=r.onClose)===null||n===void 0?void 0:n.call(r)).then(e=>{e!==!1&&(g.value=!1)})},handleAfterLeave:()=>{f()},mergedTheme:C,cssVars:b?void 0:h,themeClass:s?.themeClass,onRender:s?.onRender}},render(){var r;return(r=this.onRender)===null||r===void 0||r.call(this),l(oo,{onAfterLeave:this.handleAfterLeave},{default:()=>{const{mergedClsPrefix:o,$slots:d}=this,b={class:[`${o}-alert`,this.themeClass,this.closable&&`${o}-alert--closable`,this.showIcon&&`${o}-alert--show-icon`,!this.title&&this.closable&&`${o}-alert--right-adjust`,this.rtlEnabled&&`${o}-alert--rtl`],style:this.cssVars,role:"alert"};return this.visible?l("div",Object.assign({},K(this.$attrs,b)),this.closable&&l(q,{clsPrefix:o,class:`${o}-alert__close`,onClick:this.handleCloseClick}),this.bordered&&l("div",{class:`${o}-alert__border`}),this.showIcon&&l("div",{class:`${o}-alert__icon`,"aria-hidden":"true"},G(d.icon,()=>[l(J,{clsPrefix:o},{default:()=>{switch(this.type){case"success":return l(Y,null);case"info":return l(X,null);case"warning":return l(U,null);case"error":return l(Q,null);default:return null}}})])),l("div",{class:[`${o}-alert-body`,this.mergedBordered&&`${o}-alert-body--bordered`]},Z(d.header,t=>{const C=t||this.title;return C?l("div",{class:`${o}-alert-body__title`},C):null}),d.default&&l("div",{class:`${o}-alert-body__content`},d))):null}})}});export{go as _};
