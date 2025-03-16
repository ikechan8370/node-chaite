import{a1 as w,ae as d,ah as c,d as z,F as $,a4 as T,a7 as l,x as f,al as n,aa as H,gM as R}from"./index-CucaxZT9.js";const B=w("h",`
 font-size: var(--n-font-size);
 font-weight: var(--n-font-weight);
 margin: var(--n-margin);
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
`,[d("&:first-child",{marginTop:0}),c("prefix-bar",{position:"relative",paddingLeft:"var(--n-prefix-width)"},[c("align-text",{paddingLeft:0},[d("&::before",{left:"calc(-1 * var(--n-prefix-width))"})]),d("&::before",`
 content: "";
 width: var(--n-bar-width);
 border-radius: calc(var(--n-bar-width) / 2);
 transition: background-color .3s var(--n-bezier);
 left: 0;
 top: 0;
 bottom: 0;
 position: absolute;
 `),d("&::before",{backgroundColor:"var(--n-bar-color)"})])]),P=Object.assign(Object.assign({},l.props),{type:{type:String,default:"default"},prefix:String,alignText:Boolean}),h=r=>z({name:`H${r}`,props:P,setup(e){const{mergedClsPrefixRef:i,inlineThemeDisabled:o}=T(e),t=l("Typography","-h",B,R,e,i),s=f(()=>{const{type:g}=e,{common:{cubicBezierEaseInOut:b},self:{headerFontWeight:m,headerTextColor:p,[n("headerPrefixWidth",r)]:u,[n("headerFontSize",r)]:x,[n("headerMargin",r)]:C,[n("headerBarWidth",r)]:v,[n("headerBarColor",g)]:y}}=t.value;return{"--n-bezier":b,"--n-font-size":x,"--n-margin":C,"--n-bar-color":y,"--n-bar-width":v,"--n-font-weight":m,"--n-text-color":p,"--n-prefix-width":u}}),a=o?H(`h${r}`,f(()=>e.type[0]),s,e):void 0;return{mergedClsPrefix:i,cssVars:o?void 0:s,themeClass:a?.themeClass,onRender:a?.onRender}},render(){var e;const{prefix:i,alignText:o,mergedClsPrefix:t,cssVars:s,$slots:a}=this;return(e=this.onRender)===null||e===void 0||e.call(this),$(`h${r}`,{class:[`${t}-h`,`${t}-h${r}`,this.themeClass,{[`${t}-h--prefix-bar`]:i,[`${t}-h--align-text`]:o}],style:s},a)}}),N=h("1"),S=h("2"),F=h("3");export{F as N,S as a,N as b};
