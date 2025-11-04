import{a0 as w,a4 as d,a2 as h,d as z,p as $,ae as T,af as f,s as c,ai as n,aj as R,aK as B}from"./index-kLEe-31q.js";const H=w("h",`
 font-size: var(--n-font-size);
 font-weight: var(--n-font-weight);
 margin: var(--n-margin);
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
`,[d("&:first-child",{marginTop:0}),h("prefix-bar",{position:"relative",paddingLeft:"var(--n-prefix-width)"},[h("align-text",{paddingLeft:0},[d("&::before",{left:"calc(-1 * var(--n-prefix-width))"})]),d("&::before",`
 content: "";
 width: var(--n-bar-width);
 border-radius: calc(var(--n-bar-width) / 2);
 transition: background-color .3s var(--n-bezier);
 left: 0;
 top: 0;
 bottom: 0;
 position: absolute;
 `),d("&::before",{backgroundColor:"var(--n-bar-color)"})])]),P=Object.assign(Object.assign({},f.props),{type:{type:String,default:"default"},prefix:String,alignText:Boolean}),l=r=>z({name:`H${r}`,props:P,setup(e){const{mergedClsPrefixRef:i,inlineThemeDisabled:o}=T(e),t=f("Typography","-h",H,B,e,i),s=c(()=>{const{type:g}=e,{common:{cubicBezierEaseInOut:p},self:{headerFontWeight:b,headerTextColor:m,[n("headerPrefixWidth",r)]:u,[n("headerFontSize",r)]:x,[n("headerMargin",r)]:C,[n("headerBarWidth",r)]:v,[n("headerBarColor",g)]:y}}=t.value;return{"--n-bezier":p,"--n-font-size":x,"--n-margin":C,"--n-bar-color":y,"--n-bar-width":v,"--n-font-weight":b,"--n-text-color":m,"--n-prefix-width":u}}),a=o?R(`h${r}`,c(()=>e.type[0]),s,e):void 0;return{mergedClsPrefix:i,cssVars:o?void 0:s,themeClass:a?.themeClass,onRender:a?.onRender}},render(){var e;const{prefix:i,alignText:o,mergedClsPrefix:t,cssVars:s,$slots:a}=this;return(e=this.onRender)===null||e===void 0||e.call(this),$(`h${r}`,{class:[`${t}-h`,`${t}-h${r}`,this.themeClass,{[`${t}-h--prefix-bar`]:i,[`${t}-h--align-text`]:o}],style:s},a)}}),S=l("2"),j=l("3");export{j as N,S as a};
