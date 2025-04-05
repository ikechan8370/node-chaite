import{A as $,z as h,C as d,d as z,x as l,E as T,I as g,s as f,aM as a,J as w,a_ as B,aU as P}from"./index-BjEaegUP.js";const V=$("h",`
 font-size: var(--n-font-size);
 font-weight: var(--n-font-weight);
 margin: var(--n-margin);
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
`,[h("&:first-child",{marginTop:0}),d("prefix-bar",{position:"relative",paddingLeft:"var(--n-prefix-width)"},[d("align-text",{paddingLeft:0},[h("&::before",{left:"calc(-1 * var(--n-prefix-width))"})]),h("&::before",`
 content: "";
 width: var(--n-bar-width);
 border-radius: calc(var(--n-bar-width) / 2);
 transition: background-color .3s var(--n-bezier);
 left: 0;
 top: 0;
 bottom: 0;
 position: absolute;
 `),h("&::before",{backgroundColor:"var(--n-bar-color)"})])]),H=Object.assign(Object.assign({},g.props),{type:{type:String,default:"default"},prefix:String,alignText:Boolean}),R=e=>z({name:`H${e}`,props:H,setup(o){const{mergedClsPrefixRef:s,inlineThemeDisabled:r}=T(o),n=g("Typography","-h",V,B,o,s),t=f(()=>{const{type:c}=o,{common:{cubicBezierEaseInOut:u},self:{headerFontWeight:b,headerTextColor:m,[a("headerPrefixWidth",e)]:x,[a("headerFontSize",e)]:v,[a("headerMargin",e)]:p,[a("headerBarWidth",e)]:C,[a("headerBarColor",c)]:y}}=n.value;return{"--n-bezier":u,"--n-font-size":v,"--n-margin":p,"--n-bar-color":y,"--n-bar-width":C,"--n-font-weight":b,"--n-text-color":m,"--n-prefix-width":x}}),i=r?w(`h${e}`,f(()=>o.type[0]),t,o):void 0;return{mergedClsPrefix:s,cssVars:r?void 0:t,themeClass:i?.themeClass,onRender:i?.onRender}},render(){var o;const{prefix:s,alignText:r,mergedClsPrefix:n,cssVars:t,$slots:i}=this;return(o=this.onRender)===null||o===void 0||o.call(this),l(`h${e}`,{class:[`${n}-h`,`${n}-h${e}`,this.themeClass,{[`${n}-h--prefix-bar`]:s,[`${n}-h--align-text`]:r}],style:t},i)}}),N=R("2"),_=R("3"),O=$("text",`
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
`,[d("strong",`
 font-weight: var(--n-font-weight-strong);
 `),d("italic",{fontStyle:"italic"}),d("underline",{textDecoration:"underline"}),d("code",`
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
 `)]),W=Object.assign(Object.assign({},g.props),{code:Boolean,type:{type:String,default:"default"},delete:Boolean,strong:Boolean,italic:Boolean,underline:Boolean,depth:[String,Number],tag:String,as:{type:String,validator:()=>!0,default:void 0}}),j=z({name:"Text",props:W,setup(e){const{mergedClsPrefixRef:o,inlineThemeDisabled:s}=T(e),r=g("Typography","-text",O,B,e,o),n=f(()=>{const{depth:i,type:c}=e,u=c==="default"?i===void 0?"textColor":`textColor${i}Depth`:a("textColor",c),{common:{fontWeightStrong:b,fontFamilyMono:m,cubicBezierEaseInOut:x},self:{codeTextColor:v,codeBorderRadius:p,codeColor:C,codeBorder:y,[u]:S}}=r.value;return{"--n-bezier":x,"--n-text-color":S,"--n-font-weight-strong":b,"--n-font-famliy-mono":m,"--n-code-border-radius":p,"--n-code-text-color":v,"--n-code-color":C,"--n-code-border":y}}),t=s?w("text",f(()=>`${e.type[0]}${e.depth||""}`),n,e):void 0;return{mergedClsPrefix:o,compitableTag:P(e,["as","tag"]),cssVars:s?void 0:n,themeClass:t?.themeClass,onRender:t?.onRender}},render(){var e,o,s;const{mergedClsPrefix:r}=this;(e=this.onRender)===null||e===void 0||e.call(this);const n=[`${r}-text`,this.themeClass,{[`${r}-text--code`]:this.code,[`${r}-text--delete`]:this.delete,[`${r}-text--strong`]:this.strong,[`${r}-text--italic`]:this.italic,[`${r}-text--underline`]:this.underline}],t=(s=(o=this.$slots).default)===null||s===void 0?void 0:s.call(o);return this.code?l("code",{class:n,style:this.cssVars},this.delete?l("del",null,t):t):this.delete?l("del",{class:n,style:this.cssVars},t):l(this.compitableTag||"span",{class:n,style:this.cssVars},t)}});export{_ as N,N as a,j as b};
