import{a1 as $,al as h,an as l,d as z,F as d,a4 as T,a7 as g,x as f,ag as i,aa as w,aC as B,ar as P}from"./index-DTsNwqi0.js";const _=$("h",`
 font-size: var(--n-font-size);
 font-weight: var(--n-font-weight);
 margin: var(--n-margin);
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
`,[h("&:first-child",{marginTop:0}),l("prefix-bar",{position:"relative",paddingLeft:"var(--n-prefix-width)"},[l("align-text",{paddingLeft:0},[h("&::before",{left:"calc(-1 * var(--n-prefix-width))"})]),h("&::before",`
 content: "";
 width: var(--n-bar-width);
 border-radius: calc(var(--n-bar-width) / 2);
 transition: background-color .3s var(--n-bezier);
 left: 0;
 top: 0;
 bottom: 0;
 position: absolute;
 `),h("&::before",{backgroundColor:"var(--n-bar-color)"})])]),V=Object.assign(Object.assign({},g.props),{type:{type:String,default:"default"},prefix:String,alignText:Boolean}),R=e=>z({name:`H${e}`,props:V,setup(o){const{mergedClsPrefixRef:a,inlineThemeDisabled:r}=T(o),n=g("Typography","-h",_,B,o,a),t=f(()=>{const{type:c}=o,{common:{cubicBezierEaseInOut:u},self:{headerFontWeight:b,headerTextColor:m,[i("headerPrefixWidth",e)]:x,[i("headerFontSize",e)]:v,[i("headerMargin",e)]:p,[i("headerBarWidth",e)]:C,[i("headerBarColor",c)]:y}}=n.value;return{"--n-bezier":u,"--n-font-size":v,"--n-margin":p,"--n-bar-color":y,"--n-bar-width":C,"--n-font-weight":b,"--n-text-color":m,"--n-prefix-width":x}}),s=r?w(`h${e}`,f(()=>o.type[0]),t,o):void 0;return{mergedClsPrefix:a,cssVars:r?void 0:t,themeClass:s?.themeClass,onRender:s?.onRender}},render(){var o;const{prefix:a,alignText:r,mergedClsPrefix:n,cssVars:t,$slots:s}=this;return(o=this.onRender)===null||o===void 0||o.call(this),d(`h${e}`,{class:[`${n}-h`,`${n}-h${e}`,this.themeClass,{[`${n}-h--prefix-bar`]:a,[`${n}-h--align-text`]:r}],style:t},s)}}),k=R("2"),j=R("3"),H=$("text",`
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
`,[l("strong",`
 font-weight: var(--n-font-weight-strong);
 `),l("italic",{fontStyle:"italic"}),l("underline",{textDecoration:"underline"}),l("code",`
 line-height: 1.4;
 display: inline-block;
 font-family: var(--n-font-famliy-mono);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 box-sizing: border-box;
 padding: .05em .35em 0 .35em;
 border-radius: var(--n-code-border-radius);
 font-size: .9em;
 color: var(--n-code-text-color);
 background-color: var(--n-code-color);
 border: var(--n-code-border);
 `)]),O=Object.assign(Object.assign({},g.props),{code:Boolean,type:{type:String,default:"default"},delete:Boolean,strong:Boolean,italic:Boolean,underline:Boolean,depth:[String,Number],tag:String,as:{type:String,validator:()=>!0,default:void 0}}),D=z({name:"Text",props:O,setup(e){const{mergedClsPrefixRef:o,inlineThemeDisabled:a}=T(e),r=g("Typography","-text",H,B,e,o),n=f(()=>{const{depth:s,type:c}=e,u=c==="default"?s===void 0?"textColor":`textColor${s}Depth`:i("textColor",c),{common:{fontWeightStrong:b,fontFamilyMono:m,cubicBezierEaseInOut:x},self:{codeTextColor:v,codeBorderRadius:p,codeColor:C,codeBorder:y,[u]:S}}=r.value;return{"--n-bezier":x,"--n-text-color":S,"--n-font-weight-strong":b,"--n-font-famliy-mono":m,"--n-code-border-radius":p,"--n-code-text-color":v,"--n-code-color":C,"--n-code-border":y}}),t=a?w("text",f(()=>`${e.type[0]}${e.depth||""}`),n,e):void 0;return{mergedClsPrefix:o,compitableTag:P(e,["as","tag"]),cssVars:a?void 0:n,themeClass:t?.themeClass,onRender:t?.onRender}},render(){var e,o,a;const{mergedClsPrefix:r}=this;(e=this.onRender)===null||e===void 0||e.call(this);const n=[`${r}-text`,this.themeClass,{[`${r}-text--code`]:this.code,[`${r}-text--delete`]:this.delete,[`${r}-text--strong`]:this.strong,[`${r}-text--italic`]:this.italic,[`${r}-text--underline`]:this.underline}],t=(a=(o=this.$slots).default)===null||a===void 0?void 0:a.call(o);return this.code?d("code",{class:n,style:this.cssVars},this.delete?d("del",null,t):t):this.delete?d("del",{class:n,style:this.cssVars},t):d(this.compitableTag||"span",{class:n,style:this.cssVars},t)}});export{j as N,D as _,k as a};
