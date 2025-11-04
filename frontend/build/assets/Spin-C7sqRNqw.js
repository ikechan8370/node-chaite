import{a4 as f,a0 as c,bT as S,a2 as v,d as C,p as o,bA as x,T as k,ae as T,af as h,bU as $,s as m,b9 as w,ai as R,aj as N,bV as j,r as B,bG as O}from"./index-kLEe-31q.js";const V=f([f("@keyframes spin-rotate",`
 from {
 transform: rotate(0);
 }
 to {
 transform: rotate(360deg);
 }
 `),c("spin-container",`
 position: relative;
 `,[c("spin-body",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 `,[S()])]),c("spin-body",`
 display: inline-flex;
 align-items: center;
 justify-content: center;
 flex-direction: column;
 `),c("spin",`
 display: inline-flex;
 height: var(--n-size);
 width: var(--n-size);
 font-size: var(--n-size);
 color: var(--n-color);
 `,[v("rotate",`
 animation: spin-rotate 2s linear infinite;
 `)]),c("spin-description",`
 display: inline-block;
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 margin-top: 8px;
 `),c("spin-content",`
 opacity: 1;
 transition: opacity .3s var(--n-bezier);
 pointer-events: all;
 `,[v("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]),P={small:20,medium:18,large:16},W=Object.assign(Object.assign({},h.props),{contentClass:String,contentStyle:[Object,String],description:String,stroke:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},strokeWidth:Number,rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number}),E=C({name:"Spin",props:W,slots:Object,setup(e){const{mergedClsPrefixRef:r,inlineThemeDisabled:t}=T(e),s=h("Spin","-spin",V,$,e,r),d=m(()=>{const{size:n}=e,{common:{cubicBezierEaseInOut:a},self:u}=s.value,{opacitySpinning:y,color:b,textColor:g}=u,z=typeof n=="number"?w(n):u[R("size",n)];return{"--n-bezier":a,"--n-opacity-spinning":y,"--n-size":z,"--n-color":b,"--n-text-color":g}}),i=t?N("spin",m(()=>{const{size:n}=e;return typeof n=="number"?String(n):n[0]}),d,e):void 0,p=j(e,["spinning","show"]),l=B(!1);return O(n=>{let a;if(p.value){const{delay:u}=e;if(u){a=window.setTimeout(()=>{l.value=!0},u),n(()=>{clearTimeout(a)});return}}l.value=p.value}),{mergedClsPrefix:r,active:l,mergedStrokeWidth:m(()=>{const{strokeWidth:n}=e;if(n!==void 0)return n;const{size:a}=e;return P[typeof a=="number"?"medium":a]}),cssVars:t?void 0:d,themeClass:i?.themeClass,onRender:i?.onRender}},render(){var e,r;const{$slots:t,mergedClsPrefix:s,description:d}=this,i=t.icon&&this.rotate,p=(d||t.description)&&o("div",{class:`${s}-spin-description`},d||((e=t.description)===null||e===void 0?void 0:e.call(t))),l=t.icon?o("div",{class:[`${s}-spin-body`,this.themeClass]},o("div",{class:[`${s}-spin`,i&&`${s}-spin--rotate`],style:t.default?"":this.cssVars},t.icon()),p):o("div",{class:[`${s}-spin-body`,this.themeClass]},o(x,{clsPrefix:s,style:t.default?"":this.cssVars,stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,class:`${s}-spin`}),p);return(r=this.onRender)===null||r===void 0||r.call(this),t.default?o("div",{class:[`${s}-spin-container`,this.themeClass],style:this.cssVars},o("div",{class:[`${s}-spin-content`,this.active&&`${s}-spin-content--spinning`,this.contentClass],style:this.contentStyle},t),o(k,{name:"fade-in-transition"},{default:()=>this.active?l:null})):l}});export{E as N};
