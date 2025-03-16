import{aE as S,aF as T,aG as F,d as R,a5 as I,r as V,x as _,v as E,aH as M,a1 as h,at as x,F as c,az as g,a4 as $,a7 as N,aI as P,ak as A,aa as O}from"./index-CucaxZT9.js";var B=1/0,j=17976931348623157e292;function L(t){if(!t)return t===0?t:0;if(t=S(t),t===B||t===-1/0){var e=t<0?-1:1;return e*j}return t===t?t:0}function W(t){var e=L(t),a=e%1;return e===e?a?e-a:e:0}var k=T.isFinite,G=Math.min;function H(t){var e=Math[t];return function(a,n){if(a=S(a),n=n==null?0:G(W(n),292),n&&k(a)){var i=(F(a)+"e").split("e"),l=e(i[0]+"e"+(+i[1]+n));return i=(F(l)+"e").split("e"),+(i[0]+"e"+(+i[1]-n))}return e(a)}}var U=H("round");const q=t=>1-Math.pow(1-t,5);function D(t){const{from:e,to:a,duration:n,onUpdate:i,onFinish:l}=t,s=performance.now(),r=()=>{const u=performance.now(),f=Math.min(u-s,n),d=e+(a-e)*q(f/n);if(f===n){l();return}i(d),requestAnimationFrame(r)};r()}const X={to:{type:Number,default:0},precision:{type:Number,default:0},showSeparator:Boolean,locale:String,from:{type:Number,default:0},active:{type:Boolean,default:!0},duration:{type:Number,default:2e3},onFinish:Function},Q=R({name:"NumberAnimation",props:X,setup(t){const{localeRef:e}=I("name"),{duration:a}=t,n=V(t.from),i=_(()=>{const{locale:o}=t;return o!==void 0?o:e.value});let l=!1;const s=o=>{n.value=o},r=()=>{var o;n.value=t.to,l=!1,(o=t.onFinish)===null||o===void 0||o.call(t)},u=(o=t.from,m=t.to)=>{l=!0,n.value=t.from,o!==m&&D({from:o,to:m,duration:a,onUpdate:s,onFinish:r})},f=_(()=>{var o;const v=U(n.value,t.precision).toFixed(t.precision).split("."),b=new Intl.NumberFormat(i.value),p=(o=b.formatToParts(.5).find(y=>y.type==="decimal"))===null||o===void 0?void 0:o.value,w=t.showSeparator?b.format(Number(v[0])):v[0],C=v[1];return{integer:w,decimal:C,decimalSeparator:p}});function d(){l||u()}return E(()=>{M(()=>{t.active&&u()})}),Object.assign({formattedValue:f},{play:d})},render(){const{formattedValue:{integer:t,decimal:e,decimalSeparator:a}}=this;return[t,e?a:null,e]}}),Y=h("statistic",[x("label",`
 font-weight: var(--n-label-font-weight);
 transition: .3s color var(--n-bezier);
 font-size: var(--n-label-font-size);
 color: var(--n-label-text-color);
 `),h("statistic-value",`
 margin-top: 4px;
 font-weight: var(--n-value-font-weight);
 `,[x("prefix",`
 margin: 0 4px 0 0;
 font-size: var(--n-value-font-size);
 transition: .3s color var(--n-bezier);
 color: var(--n-value-prefix-text-color);
 `,[h("icon",{verticalAlign:"-0.125em"})]),x("content",`
 font-size: var(--n-value-font-size);
 transition: .3s color var(--n-bezier);
 color: var(--n-value-text-color);
 `),x("suffix",`
 margin: 0 0 0 4px;
 font-size: var(--n-value-font-size);
 transition: .3s color var(--n-bezier);
 color: var(--n-value-suffix-text-color);
 `,[h("icon",{verticalAlign:"-0.125em"})])])]),J=Object.assign(Object.assign({},N.props),{tabularNums:Boolean,label:String,value:[String,Number]}),Z=R({name:"Statistic",props:J,slots:Object,setup(t){const{mergedClsPrefixRef:e,inlineThemeDisabled:a,mergedRtlRef:n}=$(t),i=N("Statistic","-statistic",Y,P,t,e),l=A("Statistic",n,e),s=_(()=>{const{self:{labelFontWeight:u,valueFontSize:f,valueFontWeight:d,valuePrefixTextColor:z,labelTextColor:o,valueSuffixTextColor:m,valueTextColor:v,labelFontSize:b},common:{cubicBezierEaseInOut:p}}=i.value;return{"--n-bezier":p,"--n-label-font-size":b,"--n-label-font-weight":u,"--n-label-text-color":o,"--n-value-font-weight":d,"--n-value-font-size":f,"--n-value-prefix-text-color":z,"--n-value-suffix-text-color":m,"--n-value-text-color":v}}),r=a?O("statistic",void 0,s,t):void 0;return{rtlEnabled:l,mergedClsPrefix:e,cssVars:a?void 0:s,themeClass:r?.themeClass,onRender:r?.onRender}},render(){var t;const{mergedClsPrefix:e,$slots:{default:a,label:n,prefix:i,suffix:l}}=this;return(t=this.onRender)===null||t===void 0||t.call(this),c("div",{class:[`${e}-statistic`,this.themeClass,this.rtlEnabled&&`${e}-statistic--rtl`],style:this.cssVars},g(n,s=>c("div",{class:`${e}-statistic__label`},this.label||s)),c("div",{class:`${e}-statistic-value`,style:{fontVariantNumeric:this.tabularNums?"tabular-nums":""}},g(i,s=>s&&c("span",{class:`${e}-statistic-value__prefix`},s)),this.value!==void 0?c("span",{class:`${e}-statistic-value__content`},this.value):g(a,s=>s&&c("span",{class:`${e}-statistic-value__content`},s)),g(l,s=>s&&c("span",{class:`${e}-statistic-value__suffix`},s))))}});export{Z as _,Q as a};
