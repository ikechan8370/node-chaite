import{d as A,p as ne,q as ot,c as R,o as x,a as b,r as g,s as ae,v as st,x as it,b as D,w as i,e as o,u as r,g as c,N as T,y as fe,z as w,F as _e,A as Oe,t as h,C as lt,D as ut,E as dt,B as Q,n as W,G as ct,H as ft,I as mt,J as re,K as I}from"./index-C7DPnO_D.js";import{d as ht,l as pt}from"./tools-Dl5azvJP.js";import{d as gt,l as wt}from"./processors-CdjtZWXg.js";import{d as vt,l as yt}from"./channels-Dl6PBZLY.js";import{d as bt,l as kt}from"./presets-CJN-XbX1.js";import{N as G,_ as C}from"./Grid-CE08eNSd.js";import{s as xt,r as Pt,N as De,a as Ce,b as Mt}from"./Ellipsis-D_4gyLs8.js";import{N as U,a as Se}from"./Image-1RlySHWJ.js";import{a as J,N as z}from"./headers-22uec1jH.js";import{N as M}from"./text-kXjecLaA.js";import"./prop-BjyUHhTu.js";import"./download-C2161hUv.js";const oe=A({name:"RadioButton",props:Pt,setup:xt,render(){const{mergedClsPrefix:t}=this;return ne("label",{class:[`${t}-radio-button`,this.mergedDisabled&&`${t}-radio-button--disabled`,this.renderSafeChecked&&`${t}-radio-button--checked`,this.focus&&[`${t}-radio-button--focus`]]},ne("input",{ref:"inputRef",type:"radio",class:`${t}-radio-input`,value:this.value,name:this.mergedName,checked:this.renderSafeChecked,disabled:this.mergedDisabled,onChange:this.handleRadioInputChange,onFocus:this.handleRadioInputFocus,onBlur:this.handleRadioInputBlur}),ne("div",{class:`${t}-radio-button__state-border`}),ot(this.$slots.default,e=>!e&&!this.label?null:ne("div",{ref:"labelRef",class:`${t}-radio__label`},e||this.label)))}}),_t={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",viewBox:"0 0 512 512"},Ot=A({name:"CloudOutline",render:function(e,n){return x(),R("svg",_t,n[0]||(n[0]=[b("path",{d:"M400 240c-8.89-89.54-71-144-144-144c-69 0-113.44 48.2-128 96c-60 6-112 43.59-112 112c0 66 54 112 120 112h260c55 0 100-27.44 100-88c0-59.82-53-85.76-96-88z",fill:"none",stroke:"currentColor","stroke-linejoin":"round","stroke-width":"32"},null,-1)]))}}),Dt={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",viewBox:"0 0 512 512"},K=A({name:"DownloadOutline",render:function(e,n){return x(),R("svg",Dt,n[0]||(n[0]=[b("path",{d:"M336 176h40a40 40 0 0 1 40 40v208a40 40 0 0 1-40 40H136a40 40 0 0 1-40-40V216a40 40 0 0 1 40-40h40",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32"},null,-1),b("path",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32",d:"M176 272l80 80l80-80"},null,-1),b("path",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32",d:"M256 48v288"},null,-1)]))}}),Ct={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",viewBox:"0 0 512 512"},St=A({name:"LinkOutline",render:function(e,n){return x(),R("svg",Ct,n[0]||(n[0]=[b("path",{d:"M208 352h-64a96 96 0 0 1 0-192h64",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"36"},null,-1),b("path",{d:"M304 160h64a96 96 0 0 1 0 192h-64",fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"36"},null,-1),b("path",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"36",d:"M163.29 256h187.42"},null,-1)]))}}),Tt={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",viewBox:"0 0 512 512"},Wt=A({name:"SearchOutline",render:function(e,n){return x(),R("svg",Tt,n[0]||(n[0]=[b("path",{d:"M221.09 64a157.09 157.09 0 1 0 157.09 157.09A157.1 157.1 0 0 0 221.09 64z",fill:"none",stroke:"currentColor","stroke-miterlimit":"10","stroke-width":"32"},null,-1),b("path",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-miterlimit":"10","stroke-width":"32",d:"M338.29 338.29L448 448"},null,-1)]))}}),qe=6048e5,Ft=864e5,Te=Symbol.for("constructDateFrom");function B(t,e){return typeof t=="function"?t(e):t&&typeof t=="object"&&Te in t?t[Te](e):t instanceof Date?new t.constructor(e):new Date(e)}function F(t,e){return B(e||t,t)}let Yt={};function ie(){return Yt}function te(t,e){const n=ie(),a=e?.weekStartsOn??e?.locale?.options?.weekStartsOn??n.weekStartsOn??n.locale?.options?.weekStartsOn??0,l=F(t,e?.in),d=l.getDay(),f=(d<a?7:0)+d-a;return l.setDate(l.getDate()-f),l.setHours(0,0,0,0),l}function se(t,e){return te(t,{...e,weekStartsOn:1})}function Ie(t,e){const n=F(t,e?.in),a=n.getFullYear(),l=B(n,0);l.setFullYear(a+1,0,4),l.setHours(0,0,0,0);const d=se(l),f=B(n,0);f.setFullYear(a,0,4),f.setHours(0,0,0,0);const y=se(f);return n.getTime()>=d.getTime()?a+1:n.getTime()>=y.getTime()?a:a-1}function We(t){const e=F(t),n=new Date(Date.UTC(e.getFullYear(),e.getMonth(),e.getDate(),e.getHours(),e.getMinutes(),e.getSeconds(),e.getMilliseconds()));return n.setUTCFullYear(e.getFullYear()),+t-+n}function Nt(t,...e){const n=B.bind(null,e.find(a=>typeof a=="object"));return e.map(n)}function Fe(t,e){const n=F(t,e?.in);return n.setHours(0,0,0,0),n}function Et(t,e,n){const[a,l]=Nt(n?.in,t,e),d=Fe(a),f=Fe(l),y=+d-We(d),P=+f-We(f);return Math.round((y-P)/Ft)}function zt(t,e){const n=Ie(t,e),a=B(t,0);return a.setFullYear(n,0,4),a.setHours(0,0,0,0),se(a)}function qt(t){return t instanceof Date||typeof t=="object"&&Object.prototype.toString.call(t)==="[object Date]"}function It(t){return!(!qt(t)&&typeof t!="number"||isNaN(+F(t)))}function jt(t,e){const n=F(t,e?.in);return n.setFullYear(n.getFullYear(),0,1),n.setHours(0,0,0,0),n}const Bt={lessThanXSeconds:{one:"less than a second",other:"less than {{count}} seconds"},xSeconds:{one:"1 second",other:"{{count}} seconds"},halfAMinute:"half a minute",lessThanXMinutes:{one:"less than a minute",other:"less than {{count}} minutes"},xMinutes:{one:"1 minute",other:"{{count}} minutes"},aboutXHours:{one:"about 1 hour",other:"about {{count}} hours"},xHours:{one:"1 hour",other:"{{count}} hours"},xDays:{one:"1 day",other:"{{count}} days"},aboutXWeeks:{one:"about 1 week",other:"about {{count}} weeks"},xWeeks:{one:"1 week",other:"{{count}} weeks"},aboutXMonths:{one:"about 1 month",other:"about {{count}} months"},xMonths:{one:"1 month",other:"{{count}} months"},aboutXYears:{one:"about 1 year",other:"about {{count}} years"},xYears:{one:"1 year",other:"{{count}} years"},overXYears:{one:"over 1 year",other:"over {{count}} years"},almostXYears:{one:"almost 1 year",other:"almost {{count}} years"}},Lt=(t,e,n)=>{let a;const l=Bt[t];return typeof l=="string"?a=l:e===1?a=l.one:a=l.other.replace("{{count}}",e.toString()),n?.addSuffix?n.comparison&&n.comparison>0?"in "+a:a+" ago":a};function me(t){return(e={})=>{const n=e.width?String(e.width):t.defaultWidth;return t.formats[n]||t.formats[t.defaultWidth]}}const Rt={full:"EEEE, MMMM do, y",long:"MMMM do, y",medium:"MMM d, y",short:"MM/dd/yyyy"},Ht={full:"h:mm:ss a zzzz",long:"h:mm:ss a z",medium:"h:mm:ss a",short:"h:mm a"},$t={full:"{{date}} 'at' {{time}}",long:"{{date}} 'at' {{time}}",medium:"{{date}}, {{time}}",short:"{{date}}, {{time}}"},Qt={date:me({formats:Rt,defaultWidth:"full"}),time:me({formats:Ht,defaultWidth:"full"}),dateTime:me({formats:$t,defaultWidth:"full"})},Gt={lastWeek:"'last' eeee 'at' p",yesterday:"'yesterday at' p",today:"'today at' p",tomorrow:"'tomorrow at' p",nextWeek:"eeee 'at' p",other:"P"},Xt=(t,e,n,a)=>Gt[t];function Z(t){return(e,n)=>{const a=n?.context?String(n.context):"standalone";let l;if(a==="formatting"&&t.formattingValues){const f=t.defaultFormattingWidth||t.defaultWidth,y=n?.width?String(n.width):f;l=t.formattingValues[y]||t.formattingValues[f]}else{const f=t.defaultWidth,y=n?.width?String(n.width):t.defaultWidth;l=t.values[y]||t.values[f]}const d=t.argumentCallback?t.argumentCallback(e):e;return l[d]}}const At={narrow:["B","A"],abbreviated:["BC","AD"],wide:["Before Christ","Anno Domini"]},Vt={narrow:["1","2","3","4"],abbreviated:["Q1","Q2","Q3","Q4"],wide:["1st quarter","2nd quarter","3rd quarter","4th quarter"]},Ut={narrow:["J","F","M","A","M","J","J","A","S","O","N","D"],abbreviated:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],wide:["January","February","March","April","May","June","July","August","September","October","November","December"]},Jt={narrow:["S","M","T","W","T","F","S"],short:["Su","Mo","Tu","We","Th","Fr","Sa"],abbreviated:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],wide:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]},Kt={narrow:{am:"a",pm:"p",midnight:"mi",noon:"n",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"},abbreviated:{am:"AM",pm:"PM",midnight:"midnight",noon:"noon",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"},wide:{am:"a.m.",pm:"p.m.",midnight:"midnight",noon:"noon",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"}},Zt={narrow:{am:"a",pm:"p",midnight:"mi",noon:"n",morning:"in the morning",afternoon:"in the afternoon",evening:"in the evening",night:"at night"},abbreviated:{am:"AM",pm:"PM",midnight:"midnight",noon:"noon",morning:"in the morning",afternoon:"in the afternoon",evening:"in the evening",night:"at night"},wide:{am:"a.m.",pm:"p.m.",midnight:"midnight",noon:"noon",morning:"in the morning",afternoon:"in the afternoon",evening:"in the evening",night:"at night"}},en=(t,e)=>{const n=Number(t),a=n%100;if(a>20||a<10)switch(a%10){case 1:return n+"st";case 2:return n+"nd";case 3:return n+"rd"}return n+"th"},tn={ordinalNumber:en,era:Z({values:At,defaultWidth:"wide"}),quarter:Z({values:Vt,defaultWidth:"wide",argumentCallback:t=>t-1}),month:Z({values:Ut,defaultWidth:"wide"}),day:Z({values:Jt,defaultWidth:"wide"}),dayPeriod:Z({values:Kt,defaultWidth:"wide",formattingValues:Zt,defaultFormattingWidth:"wide"})};function ee(t){return(e,n={})=>{const a=n.width,l=a&&t.matchPatterns[a]||t.matchPatterns[t.defaultMatchWidth],d=e.match(l);if(!d)return null;const f=d[0],y=a&&t.parsePatterns[a]||t.parsePatterns[t.defaultParseWidth],P=Array.isArray(y)?an(y,v=>v.test(f)):nn(y,v=>v.test(f));let _;_=t.valueCallback?t.valueCallback(P):P,_=n.valueCallback?n.valueCallback(_):_;const k=e.slice(f.length);return{value:_,rest:k}}}function nn(t,e){for(const n in t)if(Object.prototype.hasOwnProperty.call(t,n)&&e(t[n]))return n}function an(t,e){for(let n=0;n<t.length;n++)if(e(t[n]))return n}function rn(t){return(e,n={})=>{const a=e.match(t.matchPattern);if(!a)return null;const l=a[0],d=e.match(t.parsePattern);if(!d)return null;let f=t.valueCallback?t.valueCallback(d[0]):d[0];f=n.valueCallback?n.valueCallback(f):f;const y=e.slice(l.length);return{value:f,rest:y}}}const on=/^(\d+)(th|st|nd|rd)?/i,sn=/\d+/i,ln={narrow:/^(b|a)/i,abbreviated:/^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,wide:/^(before christ|before common era|anno domini|common era)/i},un={any:[/^b/i,/^(a|c)/i]},dn={narrow:/^[1234]/i,abbreviated:/^q[1234]/i,wide:/^[1234](th|st|nd|rd)? quarter/i},cn={any:[/1/i,/2/i,/3/i,/4/i]},fn={narrow:/^[jfmasond]/i,abbreviated:/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,wide:/^(january|february|march|april|may|june|july|august|september|october|november|december)/i},mn={narrow:[/^j/i,/^f/i,/^m/i,/^a/i,/^m/i,/^j/i,/^j/i,/^a/i,/^s/i,/^o/i,/^n/i,/^d/i],any:[/^ja/i,/^f/i,/^mar/i,/^ap/i,/^may/i,/^jun/i,/^jul/i,/^au/i,/^s/i,/^o/i,/^n/i,/^d/i]},hn={narrow:/^[smtwf]/i,short:/^(su|mo|tu|we|th|fr|sa)/i,abbreviated:/^(sun|mon|tue|wed|thu|fri|sat)/i,wide:/^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i},pn={narrow:[/^s/i,/^m/i,/^t/i,/^w/i,/^t/i,/^f/i,/^s/i],any:[/^su/i,/^m/i,/^tu/i,/^w/i,/^th/i,/^f/i,/^sa/i]},gn={narrow:/^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,any:/^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i},wn={any:{am:/^a/i,pm:/^p/i,midnight:/^mi/i,noon:/^no/i,morning:/morning/i,afternoon:/afternoon/i,evening:/evening/i,night:/night/i}},vn={ordinalNumber:rn({matchPattern:on,parsePattern:sn,valueCallback:t=>parseInt(t,10)}),era:ee({matchPatterns:ln,defaultMatchWidth:"wide",parsePatterns:un,defaultParseWidth:"any"}),quarter:ee({matchPatterns:dn,defaultMatchWidth:"wide",parsePatterns:cn,defaultParseWidth:"any",valueCallback:t=>t+1}),month:ee({matchPatterns:fn,defaultMatchWidth:"wide",parsePatterns:mn,defaultParseWidth:"any"}),day:ee({matchPatterns:hn,defaultMatchWidth:"wide",parsePatterns:pn,defaultParseWidth:"any"}),dayPeriod:ee({matchPatterns:gn,defaultMatchWidth:"any",parsePatterns:wn,defaultParseWidth:"any"})},yn={code:"en-US",formatDistance:Lt,formatLong:Qt,formatRelative:Xt,localize:tn,match:vn,options:{weekStartsOn:0,firstWeekContainsDate:1}};function bn(t,e){const n=F(t,e?.in);return Et(n,jt(n))+1}function kn(t,e){const n=F(t,e?.in),a=+se(n)-+zt(n);return Math.round(a/qe)+1}function je(t,e){const n=F(t,e?.in),a=n.getFullYear(),l=ie(),d=e?.firstWeekContainsDate??e?.locale?.options?.firstWeekContainsDate??l.firstWeekContainsDate??l.locale?.options?.firstWeekContainsDate??1,f=B(e?.in||t,0);f.setFullYear(a+1,0,d),f.setHours(0,0,0,0);const y=te(f,e),P=B(e?.in||t,0);P.setFullYear(a,0,d),P.setHours(0,0,0,0);const _=te(P,e);return+n>=+y?a+1:+n>=+_?a:a-1}function xn(t,e){const n=ie(),a=e?.firstWeekContainsDate??e?.locale?.options?.firstWeekContainsDate??n.firstWeekContainsDate??n.locale?.options?.firstWeekContainsDate??1,l=je(t,e),d=B(e?.in||t,0);return d.setFullYear(l,0,a),d.setHours(0,0,0,0),te(d,e)}function Pn(t,e){const n=F(t,e?.in),a=+te(n,e)-+xn(n,e);return Math.round(a/qe)+1}function p(t,e){const n=t<0?"-":"",a=Math.abs(t).toString().padStart(e,"0");return n+a}const j={y(t,e){const n=t.getFullYear(),a=n>0?n:1-n;return p(e==="yy"?a%100:a,e.length)},M(t,e){const n=t.getMonth();return e==="M"?String(n+1):p(n+1,2)},d(t,e){return p(t.getDate(),e.length)},a(t,e){const n=t.getHours()/12>=1?"pm":"am";switch(e){case"a":case"aa":return n.toUpperCase();case"aaa":return n;case"aaaaa":return n[0];case"aaaa":default:return n==="am"?"a.m.":"p.m."}},h(t,e){return p(t.getHours()%12||12,e.length)},H(t,e){return p(t.getHours(),e.length)},m(t,e){return p(t.getMinutes(),e.length)},s(t,e){return p(t.getSeconds(),e.length)},S(t,e){const n=e.length,a=t.getMilliseconds(),l=Math.trunc(a*Math.pow(10,n-3));return p(l,e.length)}},X={midnight:"midnight",noon:"noon",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"},Ye={G:function(t,e,n){const a=t.getFullYear()>0?1:0;switch(e){case"G":case"GG":case"GGG":return n.era(a,{width:"abbreviated"});case"GGGGG":return n.era(a,{width:"narrow"});case"GGGG":default:return n.era(a,{width:"wide"})}},y:function(t,e,n){if(e==="yo"){const a=t.getFullYear(),l=a>0?a:1-a;return n.ordinalNumber(l,{unit:"year"})}return j.y(t,e)},Y:function(t,e,n,a){const l=je(t,a),d=l>0?l:1-l;if(e==="YY"){const f=d%100;return p(f,2)}return e==="Yo"?n.ordinalNumber(d,{unit:"year"}):p(d,e.length)},R:function(t,e){const n=Ie(t);return p(n,e.length)},u:function(t,e){const n=t.getFullYear();return p(n,e.length)},Q:function(t,e,n){const a=Math.ceil((t.getMonth()+1)/3);switch(e){case"Q":return String(a);case"QQ":return p(a,2);case"Qo":return n.ordinalNumber(a,{unit:"quarter"});case"QQQ":return n.quarter(a,{width:"abbreviated",context:"formatting"});case"QQQQQ":return n.quarter(a,{width:"narrow",context:"formatting"});case"QQQQ":default:return n.quarter(a,{width:"wide",context:"formatting"})}},q:function(t,e,n){const a=Math.ceil((t.getMonth()+1)/3);switch(e){case"q":return String(a);case"qq":return p(a,2);case"qo":return n.ordinalNumber(a,{unit:"quarter"});case"qqq":return n.quarter(a,{width:"abbreviated",context:"standalone"});case"qqqqq":return n.quarter(a,{width:"narrow",context:"standalone"});case"qqqq":default:return n.quarter(a,{width:"wide",context:"standalone"})}},M:function(t,e,n){const a=t.getMonth();switch(e){case"M":case"MM":return j.M(t,e);case"Mo":return n.ordinalNumber(a+1,{unit:"month"});case"MMM":return n.month(a,{width:"abbreviated",context:"formatting"});case"MMMMM":return n.month(a,{width:"narrow",context:"formatting"});case"MMMM":default:return n.month(a,{width:"wide",context:"formatting"})}},L:function(t,e,n){const a=t.getMonth();switch(e){case"L":return String(a+1);case"LL":return p(a+1,2);case"Lo":return n.ordinalNumber(a+1,{unit:"month"});case"LLL":return n.month(a,{width:"abbreviated",context:"standalone"});case"LLLLL":return n.month(a,{width:"narrow",context:"standalone"});case"LLLL":default:return n.month(a,{width:"wide",context:"standalone"})}},w:function(t,e,n,a){const l=Pn(t,a);return e==="wo"?n.ordinalNumber(l,{unit:"week"}):p(l,e.length)},I:function(t,e,n){const a=kn(t);return e==="Io"?n.ordinalNumber(a,{unit:"week"}):p(a,e.length)},d:function(t,e,n){return e==="do"?n.ordinalNumber(t.getDate(),{unit:"date"}):j.d(t,e)},D:function(t,e,n){const a=bn(t);return e==="Do"?n.ordinalNumber(a,{unit:"dayOfYear"}):p(a,e.length)},E:function(t,e,n){const a=t.getDay();switch(e){case"E":case"EE":case"EEE":return n.day(a,{width:"abbreviated",context:"formatting"});case"EEEEE":return n.day(a,{width:"narrow",context:"formatting"});case"EEEEEE":return n.day(a,{width:"short",context:"formatting"});case"EEEE":default:return n.day(a,{width:"wide",context:"formatting"})}},e:function(t,e,n,a){const l=t.getDay(),d=(l-a.weekStartsOn+8)%7||7;switch(e){case"e":return String(d);case"ee":return p(d,2);case"eo":return n.ordinalNumber(d,{unit:"day"});case"eee":return n.day(l,{width:"abbreviated",context:"formatting"});case"eeeee":return n.day(l,{width:"narrow",context:"formatting"});case"eeeeee":return n.day(l,{width:"short",context:"formatting"});case"eeee":default:return n.day(l,{width:"wide",context:"formatting"})}},c:function(t,e,n,a){const l=t.getDay(),d=(l-a.weekStartsOn+8)%7||7;switch(e){case"c":return String(d);case"cc":return p(d,e.length);case"co":return n.ordinalNumber(d,{unit:"day"});case"ccc":return n.day(l,{width:"abbreviated",context:"standalone"});case"ccccc":return n.day(l,{width:"narrow",context:"standalone"});case"cccccc":return n.day(l,{width:"short",context:"standalone"});case"cccc":default:return n.day(l,{width:"wide",context:"standalone"})}},i:function(t,e,n){const a=t.getDay(),l=a===0?7:a;switch(e){case"i":return String(l);case"ii":return p(l,e.length);case"io":return n.ordinalNumber(l,{unit:"day"});case"iii":return n.day(a,{width:"abbreviated",context:"formatting"});case"iiiii":return n.day(a,{width:"narrow",context:"formatting"});case"iiiiii":return n.day(a,{width:"short",context:"formatting"});case"iiii":default:return n.day(a,{width:"wide",context:"formatting"})}},a:function(t,e,n){const l=t.getHours()/12>=1?"pm":"am";switch(e){case"a":case"aa":return n.dayPeriod(l,{width:"abbreviated",context:"formatting"});case"aaa":return n.dayPeriod(l,{width:"abbreviated",context:"formatting"}).toLowerCase();case"aaaaa":return n.dayPeriod(l,{width:"narrow",context:"formatting"});case"aaaa":default:return n.dayPeriod(l,{width:"wide",context:"formatting"})}},b:function(t,e,n){const a=t.getHours();let l;switch(a===12?l=X.noon:a===0?l=X.midnight:l=a/12>=1?"pm":"am",e){case"b":case"bb":return n.dayPeriod(l,{width:"abbreviated",context:"formatting"});case"bbb":return n.dayPeriod(l,{width:"abbreviated",context:"formatting"}).toLowerCase();case"bbbbb":return n.dayPeriod(l,{width:"narrow",context:"formatting"});case"bbbb":default:return n.dayPeriod(l,{width:"wide",context:"formatting"})}},B:function(t,e,n){const a=t.getHours();let l;switch(a>=17?l=X.evening:a>=12?l=X.afternoon:a>=4?l=X.morning:l=X.night,e){case"B":case"BB":case"BBB":return n.dayPeriod(l,{width:"abbreviated",context:"formatting"});case"BBBBB":return n.dayPeriod(l,{width:"narrow",context:"formatting"});case"BBBB":default:return n.dayPeriod(l,{width:"wide",context:"formatting"})}},h:function(t,e,n){if(e==="ho"){let a=t.getHours()%12;return a===0&&(a=12),n.ordinalNumber(a,{unit:"hour"})}return j.h(t,e)},H:function(t,e,n){return e==="Ho"?n.ordinalNumber(t.getHours(),{unit:"hour"}):j.H(t,e)},K:function(t,e,n){const a=t.getHours()%12;return e==="Ko"?n.ordinalNumber(a,{unit:"hour"}):p(a,e.length)},k:function(t,e,n){let a=t.getHours();return a===0&&(a=24),e==="ko"?n.ordinalNumber(a,{unit:"hour"}):p(a,e.length)},m:function(t,e,n){return e==="mo"?n.ordinalNumber(t.getMinutes(),{unit:"minute"}):j.m(t,e)},s:function(t,e,n){return e==="so"?n.ordinalNumber(t.getSeconds(),{unit:"second"}):j.s(t,e)},S:function(t,e){return j.S(t,e)},X:function(t,e,n){const a=t.getTimezoneOffset();if(a===0)return"Z";switch(e){case"X":return Ee(a);case"XXXX":case"XX":return L(a);case"XXXXX":case"XXX":default:return L(a,":")}},x:function(t,e,n){const a=t.getTimezoneOffset();switch(e){case"x":return Ee(a);case"xxxx":case"xx":return L(a);case"xxxxx":case"xxx":default:return L(a,":")}},O:function(t,e,n){const a=t.getTimezoneOffset();switch(e){case"O":case"OO":case"OOO":return"GMT"+Ne(a,":");case"OOOO":default:return"GMT"+L(a,":")}},z:function(t,e,n){const a=t.getTimezoneOffset();switch(e){case"z":case"zz":case"zzz":return"GMT"+Ne(a,":");case"zzzz":default:return"GMT"+L(a,":")}},t:function(t,e,n){const a=Math.trunc(+t/1e3);return p(a,e.length)},T:function(t,e,n){return p(+t,e.length)}};function Ne(t,e=""){const n=t>0?"-":"+",a=Math.abs(t),l=Math.trunc(a/60),d=a%60;return d===0?n+String(l):n+String(l)+e+p(d,2)}function Ee(t,e){return t%60===0?(t>0?"-":"+")+p(Math.abs(t)/60,2):L(t,e)}function L(t,e=""){const n=t>0?"-":"+",a=Math.abs(t),l=p(Math.trunc(a/60),2),d=p(a%60,2);return n+l+e+d}const ze=(t,e)=>{switch(t){case"P":return e.date({width:"short"});case"PP":return e.date({width:"medium"});case"PPP":return e.date({width:"long"});case"PPPP":default:return e.date({width:"full"})}},Be=(t,e)=>{switch(t){case"p":return e.time({width:"short"});case"pp":return e.time({width:"medium"});case"ppp":return e.time({width:"long"});case"pppp":default:return e.time({width:"full"})}},Mn=(t,e)=>{const n=t.match(/(P+)(p+)?/)||[],a=n[1],l=n[2];if(!l)return ze(t,e);let d;switch(a){case"P":d=e.dateTime({width:"short"});break;case"PP":d=e.dateTime({width:"medium"});break;case"PPP":d=e.dateTime({width:"long"});break;case"PPPP":default:d=e.dateTime({width:"full"});break}return d.replace("{{date}}",ze(a,e)).replace("{{time}}",Be(l,e))},_n={p:Be,P:Mn},On=/^D+$/,Dn=/^Y+$/,Cn=["D","DD","YY","YYYY"];function Sn(t){return On.test(t)}function Tn(t){return Dn.test(t)}function Wn(t,e,n){const a=Fn(t,e,n);if(console.warn(a),Cn.includes(t))throw new RangeError(a)}function Fn(t,e,n){const a=t[0]==="Y"?"years":"days of the month";return`Use \`${t.toLowerCase()}\` instead of \`${t}\` (in \`${e}\`) for formatting ${a} to the input \`${n}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`}const Yn=/[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,Nn=/P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,En=/^'([^]*?)'?$/,zn=/''/g,qn=/[a-zA-Z]/;function In(t,e,n){const a=ie(),l=a.locale??yn,d=a.firstWeekContainsDate??a.locale?.options?.firstWeekContainsDate??1,f=a.weekStartsOn??a.locale?.options?.weekStartsOn??0,y=F(t,n?.in);if(!It(y))throw new RangeError("Invalid time value");let P=e.match(Nn).map(k=>{const v=k[0];if(v==="p"||v==="P"){const H=_n[v];return H(k,l.formatLong)}return k}).join("").match(Yn).map(k=>{if(k==="''")return{isToken:!1,value:"'"};const v=k[0];if(v==="'")return{isToken:!1,value:jn(k)};if(Ye[v])return{isToken:!0,value:k};if(v.match(qn))throw new RangeError("Format string contains an unescaped latin alphabet character `"+v+"`");return{isToken:!1,value:k}});l.localize.preprocessor&&(P=l.localize.preprocessor(y,P));const _={firstWeekContainsDate:d,weekStartsOn:f,locale:l};return P.map(k=>{if(!k.isToken)return k.value;const v=k.value;(Tn(v)||Sn(v))&&Wn(v,e,String(t));const H=Ye[v[0]];return H(y,v,l.localize,_)}).join("")}function jn(t){const e=t.match(En);return e?e[1].replace(zn,"'"):t}const Bn={style:{display:"flex","align-items":"center","margin-bottom":"8px"}},Ln={style:{display:"flex","align-items":"center",gap:"8px"}},Rn={style:{position:"relative"}},Hn={style:{position:"absolute",top:"8px",right:"8px",display:"flex",gap:"4px","background-color":"rgba(255,255,255,0.8)",padding:"4px 8px","border-radius":"4px"}},$n={style:{display:"flex","justify-content":"space-between","align-items":"center"}},Qn={class:"relative"},Gn={key:0,class:"absolute top-2 right-2"},Xn={style:{"max-height":"300px",overflow:"auto",background:"#f5f5f5",padding:"12px","border-radius":"4px"}},An={style:{"max-height":"300px",overflow:"auto",background:"#f5f5f5",padding:"12px","border-radius":"4px"}},E="/assets/default-resource.png",ia=A({__name:"index",setup(t){const e=window.$message,n=[{label:"工具",value:"tool"},{label:"处理器",value:"processor"},{label:"预设",value:"preset"},{label:"渠道",value:"channel"}],a=g(10),l=g(1),d=g(""),f=g(n[0].value),y=g("newest"),P=g(!1),_=g(!1),k=g(!1),v=g(!1),H=g(0),he=g(0),pe=g(0),ge=g(0),O=g(null),Y=g(null),N=g(null),S=g(null),we=g([]),ve=g([]),ye=g([]),be=g([]),le=g(!1),ue=g(!1),de=g(!1),ce=g(!1),Le=ae(()=>{switch(f.value){case"tool":return H.value;case"processor":return he.value;case"preset":return pe.value;case"channel":return ge.value;default:return 0}}),Re=ae(()=>{switch(f.value){case"tool":return le.value;case"processor":return ue.value;case"preset":return de.value;case"channel":return ce.value;default:return!1}});function He(u){switch(f.value){case"tool":O.value=u,P.value=!0;break;case"processor":Y.value=u,_.value=!0;break;case"preset":N.value=u,k.value=!0;break;case"channel":S.value=u,v.value=!0;break;default:O.value=u,P.value=!0}}const $e=[{label:"最新发布",value:"newest"},{label:"热度最高",value:"popular"},{label:"下载最多",value:"downloads"}],$=g("all"),ke=ae(()=>{let u=[];switch(f.value){case"tool":u=we.value;break;case"processor":u=ve.value;break;case"preset":u=ye.value;break;case"channel":u=be.value;break;default:u=[]}if($.value!=="all"){const s=$.value==="downloaded";u=u.filter(m=>!!m.downloaded===s)}return u}),xe=ae(()=>Math.ceil(Le.value/a.value));function Qe(u){if(!u)return"Unknown";if(typeof u=="string"&&(u.includes("年")||u.includes("月")))return u;if(typeof u!="string"&&!(u instanceof Date))return"Invalid date";try{return In(new Date(u),"yyyy-MM-dd")}catch{return String(u)||"Invalid date"}}function Pe(u){switch(u){case"tool":return"工具";case"processor":return"处理器";case"preset":return"预设";case"channel":return"渠道";default:return"未知类型"}}function Ge(u){a.value=u,l.value>xe.value&&(l.value=1)}function Me(u){switch(u){case"tool":return"success";case"processor":return"info";case"preset":return"warning";case"channel":return"error";default:return"default"}}async function Xe(u){try{const s=await ht({id:u.id});s.code===0?(e.success("工具下载成功"),P.value=!1,q()):e.error(s.message||"下载失败")}catch(s){console.error("Failed to download tool:",s),e.error("下载失败")}}async function Ae(u){try{const s=await gt({id:u.id});s.code===0?(e.success("处理器下载成功"),_.value=!1,q()):e.error(s.message||"下载失败")}catch(s){console.error("Failed to download processor:",s),e.error("下载失败")}}async function Ve(u){try{const s=await bt({id:u.id});s.code===0?(e.success("预设下载成功"),k.value=!1,q()):e.error(s.message||"下载失败")}catch(s){console.error("Failed to download preset:",s),e.error("下载失败")}}async function Ue(u){try{const s=await vt({id:u.id});s.code===0?(e.success("渠道下载成功"),v.value=!1,q()):e.error(s.message||"下载失败")}catch(s){console.error("Failed to download channel:",s),e.error("下载失败")}}async function Je(u){try{await V(u),q()}catch(s){console.error("Download failed:",s)}}function V(u){switch(f.value){case"tool":return Xe(u);case"processor":return Ae(u);case"preset":return Ve(u);case"channel":return Ue(u)}}async function Ke(){le.value=!0;try{const u=await pt({filter:{},options:{page:l.value,pageSize:a.value,searchFields:["name","description"]},query:d.value||""});if(u.code===0){const s=u.data;we.value=s.items,H.value=s.pagination.totalItems}else e.error(u.message||"获取工具列表失败")}catch(u){console.error("Failed to fetch tools:",u),e.error("获取工具列表失败")}finally{le.value=!1}}async function Ze(){ue.value=!0;try{const u=await wt({filter:{},options:{page:l.value,pageSize:a.value,searchFields:["name","description"]},query:d.value||""});if(u.code===0){const s=u.data;ve.value=s.items,he.value=s.pagination.totalItems}else e.error(u.message||"获取处理器列表失败")}catch(u){console.error("Failed to fetch processors:",u),e.error("获取处理器列表失败")}finally{ue.value=!1}}async function et(){de.value=!0;try{const u=await kt({filter:{},options:{page:l.value,pageSize:a.value,searchFields:["name","description"]},query:d.value||""});if(u.code===0){const s=u.data;ye.value=s.items,pe.value=s.pagination.totalItems}else e.error(u.message||"获取预设列表失败")}catch(u){console.error("Failed to fetch presets:",u),e.error("获取预设列表失败")}finally{de.value=!1}}function tt(u){window?.open?.(u,"_blank")}async function nt(){ce.value=!0;try{const u=await yt({filter:{},options:{page:l.value,pageSize:a.value,searchFields:["name","description"]},query:d.value||""});if(u.code===0){const s=u.data;be.value=s.items,ge.value=s.pagination.totalItems}else e.error(u.message||"获取渠道列表失败")}catch(u){console.error("Failed to fetch channels:",u),e.error("获取渠道列表失败")}finally{ce.value=!1}}function q(){switch(f.value){case"tool":Ke();break;case"processor":Ze();break;case"preset":et();break;case"channel":nt();break}}function at(u){return u?{cardStyle:"border: 2px solid var(--primary-color); box-shadow: 0 2px 8px rgba(0, 128, 255, 0.1);",tagType:"success",tagText:"已下载",buttonText:"重新下载",buttonType:"default"}:{cardStyle:"",tagType:"default",tagText:"未下载",buttonText:"下载资源",buttonType:"primary"}}return st(()=>{q()}),it([l,a,d,f,$],()=>{$.value!=="all"&&(l.value=1),q()}),(u,s)=>(x(),D(r(w),{vertical:"",size:"large"},{default:i(()=>[b("div",Bn,[o(r(J),{style:{margin:"0","margin-right":"16px"}},{default:i(()=>s[14]||(s[14]=[c("资源社区")])),_:1}),b("div",Ln,[o(r(T),{type:"success",round:"",size:"small"},{icon:i(()=>[o(r(Ot))]),default:i(()=>[s[15]||(s[15]=c(" api.chaite.cloud "))]),_:1}),o(r(T),{type:"info",round:"",size:"small",style:{cursor:"pointer"},onClick:s[0]||(s[0]=m=>tt("https://www.chaite.cloud"))},{icon:i(()=>[o(r(St))]),default:i(()=>[s[16]||(s[16]=c(" www.chaite.cloud "))]),_:1})])]),o(r(fe),{title:"筛选条件"},{default:i(()=>[o(r(G),{cols:4,"x-gap":16,"y-gap":16,responsive:"screen"},{default:i(()=>[o(r(C),null,{default:i(()=>[o(r(w),{vertical:"",size:"small"},{default:i(()=>[o(r(M),{strong:""},{default:i(()=>s[17]||(s[17]=[c(" 资源类型 ")])),_:1}),o(r(De),{value:f.value,"onUpdate:value":s[1]||(s[1]=m=>f.value=m),name:"resourceType"},{default:i(()=>[(x(),R(_e,null,Oe(n,m=>o(r(oe),{key:m.value,value:m.value},{default:i(()=>[c(h(m.label),1)]),_:2},1032,["value"])),64))]),_:1},8,["value"])]),_:1})]),_:1}),o(r(C),null,{default:i(()=>[o(r(w),{vertical:"",size:"small"},{default:i(()=>[o(r(M),{strong:""},{default:i(()=>s[18]||(s[18]=[c(" 下载状态 ")])),_:1}),o(r(De),{value:$.value,"onUpdate:value":s[2]||(s[2]=m=>$.value=m),name:"downloadedStatus"},{default:i(()=>[o(r(oe),{value:"all"},{default:i(()=>s[19]||(s[19]=[c(" 全部 ")])),_:1}),o(r(oe),{value:"downloaded"},{default:i(()=>s[20]||(s[20]=[c(" 已下载 ")])),_:1}),o(r(oe),{value:"notDownloaded"},{default:i(()=>s[21]||(s[21]=[c(" 未下载 ")])),_:1})]),_:1},8,["value"])]),_:1})]),_:1}),o(r(C),null,{default:i(()=>[o(r(w),{vertical:"",size:"small"},{default:i(()=>[o(r(M),{strong:""},{default:i(()=>s[22]||(s[22]=[c(" 排序方式 ")])),_:1}),o(r(lt),{value:y.value,"onUpdate:value":s[3]||(s[3]=m=>y.value=m),options:$e,style:{width:"100%"}},null,8,["value"])]),_:1})]),_:1}),o(r(C),null,{default:i(()=>[o(r(w),{vertical:"",size:"small"},{default:i(()=>[o(r(M),{strong:""},{default:i(()=>s[23]||(s[23]=[c(" 搜索 ")])),_:1}),o(r(ut),null,{default:i(()=>[o(r(dt),{value:d.value,"onUpdate:value":s[4]||(s[4]=m=>d.value=m),placeholder:"搜索资源名称或描述...",clearable:""},null,8,["value"]),o(r(Q),{type:"primary",onClick:q},{icon:i(()=>[o(r(Wt))]),default:i(()=>[s[24]||(s[24]=c(" 搜索 "))]),_:1})]),_:1})]),_:1})]),_:1})]),_:1})]),_:1}),o(r(fe),null,{default:i(()=>[o(r(w),{vertical:""},{default:i(()=>[o(r(w),{vertical:""},{default:i(()=>[o(r(G),{"x-gap":"16","y-gap":"16",cols:"1 s:2 m:3 l:4 xl:5",responsive:"screen"},{default:i(()=>[(x(!0),R(_e,null,Oe(ke.value,m=>(x(),D(r(C),{key:m.id},{default:i(()=>[o(r(fe),{hoverable:"",style:ct(at(m.downloaded).cardStyle),onClick:rt=>He(m)},{cover:i(()=>[b("div",Rn,[o(r(U),{width:"100%",height:"160",src:m.coverImage||E,"fallback-src":E,"preview-disabled":!0,"object-fit":"cover"},null,8,["src"]),b("div",Hn,[o(r(T),{type:Me(f.value),size:"small"},{default:i(()=>[c(h(Pe(f.value)),1)]),_:1},8,["type"]),m.downloaded?(x(),D(r(T),{key:0,type:"success",size:"small"},{default:i(()=>s[25]||(s[25]=[c(" 已下载 ")])),_:1})):W("",!0)])])]),default:i(()=>[o(r(w),{vertical:""},{default:i(()=>[o(r(z),{style:{"margin-top":"0","margin-bottom":"4px"}},{default:i(()=>[o(r(Ce),null,{default:i(()=>[c(h(m.name),1)]),_:2},1024)]),_:2},1024),o(r(Ce),{style:{color:"rgba(0, 0, 0, 0.6)","min-height":"40px"},"line-clamp":2},{default:i(()=>[c(h(m.description||"暂无描述"),1)]),_:2},1024),b("div",$n,[o(r(M),{depth:"3",style:{"font-size":"0.85rem"}},{default:i(()=>[c(h(m.uploader.username)+" · "+h(Qe(m.updatedAt)),1)]),_:2},1024),o(r(Q),{size:"small",type:m.downloaded?"default":"primary",onClick:ft(rt=>Je(m),["stop"])},{icon:i(()=>[o(r(K))]),default:i(()=>[c(" "+h(m.downloaded?"重新下载":"下载"),1)]),_:2},1032,["type","onClick"])])]),_:2},1024)]),_:2},1032,["style","onClick"])]),_:2},1024))),128))]),_:1})]),_:1}),!Re.value&&ke.value.length===0?(x(),D(r(mt),{key:0,description:"没有找到匹配的资源"})):W("",!0),o(r(w),{justify:"center",style:{"margin-top":"16px"}},{default:i(()=>[o(r(Mt),{page:l.value,"onUpdate:page":s[5]||(s[5]=m=>l.value=m),"page-count":xe.value,"page-size":a.value,"show-size-picker":"","page-sizes":[10,20,30,40],"onUpdate:pageSize":Ge},null,8,["page","page-count","page-size"])]),_:1})]),_:1})]),_:1}),o(r(re),{show:P.value,"onUpdate:show":s[7]||(s[7]=m=>P.value=m),preset:"card",title:"工具详情",style:{width:"70%","max-width":"900px"}},{default:i(()=>[O.value?(x(),D(r(w),{key:0,vertical:"",size:"large"},{default:i(()=>[o(r(G),{cols:2,"x-gap":16},{default:i(()=>[o(r(C),null,{default:i(()=>[b("div",Qn,[o(r(U),{width:"100%",src:E,"fallback-src":E}),O.value.downloaded?(x(),R("div",Gn,[o(r(T),{type:"success"},{default:i(()=>s[26]||(s[26]=[c(" 已下载 ")])),_:1})])):W("",!0)])]),_:1}),o(r(C),null,{default:i(()=>[o(r(w),{vertical:""},{default:i(()=>[o(r(J),null,{default:i(()=>[c(h(O.value.name),1)]),_:1}),o(r(w),null,{default:i(()=>[o(r(T),{size:"large",type:Me("tool")},{default:i(()=>[c(h(Pe("tool")),1)]),_:1},8,["type"]),O.value.downloaded?(x(),D(r(T),{key:0,size:"small",type:"success"},{default:i(()=>s[27]||(s[27]=[c(" 已下载 ")])),_:1})):W("",!0)]),_:1}),o(r(M),null,{default:i(()=>[c("上传者: "+h(O.value.uploader?.username),1)]),_:1}),o(r(M),null,{default:i(()=>[c("上传日期: "+h(O.value.updatedAt),1)]),_:1}),o(r(M),null,{default:i(()=>[c("模型类型: "+h(O.value.modelType||"executable"),1)]),_:1})]),_:1})]),_:1})]),_:1}),o(r(I)),o(r(z),null,{default:i(()=>s[28]||(s[28]=[c("资源描述")])),_:1}),b("div",null,h(O.value.description),1),o(r(I)),o(r(z),null,{default:i(()=>s[29]||(s[29]=[c("代码")])),_:1}),o(r(Se),{code:O.value.code,language:"javascript","word-wrap":""},null,8,["code"]),o(r(w),{justify:"end"},{default:i(()=>[o(r(Q),{type:O.value.downloaded?"default":"primary",onClick:s[6]||(s[6]=m=>V(O.value))},{icon:i(()=>[o(r(K))]),default:i(()=>[c(" "+h(O.value.downloaded?"重新下载":"下载工具"),1)]),_:1},8,["type"])]),_:1})]),_:1})):W("",!0)]),_:1},8,["show"]),o(r(re),{show:_.value,"onUpdate:show":s[9]||(s[9]=m=>_.value=m),preset:"card",title:"处理器详情",style:{width:"70%","max-width":"900px"}},{default:i(()=>[Y.value?(x(),D(r(w),{key:0,vertical:"",size:"large"},{default:i(()=>[o(r(G),{cols:2,"x-gap":16},{default:i(()=>[o(r(C),null,{default:i(()=>[o(r(U),{width:"100%",src:E,"fallback-src":E})]),_:1}),o(r(C),null,{default:i(()=>[o(r(w),{vertical:""},{default:i(()=>[o(r(J),null,{default:i(()=>[c(h(Y.value.name),1)]),_:1}),o(r(w),null,{default:i(()=>[o(r(T),{size:"large",type:"info"},{default:i(()=>s[30]||(s[30]=[c(" 处理器 ")])),_:1})]),_:1}),o(r(M),null,{default:i(()=>[c("上传者: "+h(Y.value.uploader?.username),1)]),_:1}),o(r(M),null,{default:i(()=>[c("更新日期: "+h(Y.value.updatedAt),1)]),_:1}),Y.value.type?(x(),D(r(M),{key:0},{default:i(()=>[c(" 处理器类型: "+h(Y.value.type),1)]),_:1})):W("",!0)]),_:1})]),_:1})]),_:1}),o(r(I)),o(r(z),null,{default:i(()=>s[31]||(s[31]=[c("资源描述")])),_:1}),b("div",null,h(Y.value.description),1),o(r(I)),o(r(z),null,{default:i(()=>s[32]||(s[32]=[c("代码")])),_:1}),o(r(Se),{code:Y.value.code,language:"javascript","word-wrap":""},null,8,["code"]),o(r(w),{justify:"end"},{default:i(()=>[o(r(Q),{type:"primary",onClick:s[8]||(s[8]=m=>V(Y.value))},{icon:i(()=>[o(r(K))]),default:i(()=>[s[33]||(s[33]=c(" 下载资源 "))]),_:1})]),_:1})]),_:1})):W("",!0)]),_:1},8,["show"]),o(r(re),{show:k.value,"onUpdate:show":s[11]||(s[11]=m=>k.value=m),preset:"card",title:"预设详情",style:{width:"70%","max-width":"900px"}},{default:i(()=>[N.value?(x(),D(r(w),{key:0,vertical:"",size:"large"},{default:i(()=>[o(r(G),{cols:2,"x-gap":16},{default:i(()=>[o(r(C),null,{default:i(()=>[o(r(U),{width:"100%",src:E,"fallback-src":E})]),_:1}),o(r(C),null,{default:i(()=>[o(r(w),{vertical:""},{default:i(()=>[o(r(J),null,{default:i(()=>[c(h(N.value.name),1)]),_:1}),o(r(w),null,{default:i(()=>[o(r(T),{size:"large",type:"warning"},{default:i(()=>s[34]||(s[34]=[c(" 预设 ")])),_:1}),N.value.modelType?(x(),D(r(T),{key:0,size:"small"},{default:i(()=>[c(h(N.value.modelType),1)]),_:1})):W("",!0)]),_:1}),o(r(M),null,{default:i(()=>[c("上传者: "+h(N.value.uploader?.username),1)]),_:1}),o(r(M),null,{default:i(()=>[c("更新日期: "+h(N.value.updatedAt),1)]),_:1})]),_:1})]),_:1})]),_:1}),o(r(I)),o(r(z),null,{default:i(()=>s[35]||(s[35]=[c("资源描述")])),_:1}),b("div",null,h(N.value.description),1),o(r(I)),o(r(z),null,{default:i(()=>s[36]||(s[36]=[c("预设内容")])),_:1}),b("pre",Xn,h(N.value.sendMessageOption.systemOverride),1),o(r(w),{justify:"end"},{default:i(()=>[o(r(Q),{type:"primary",onClick:s[10]||(s[10]=m=>V(N.value))},{icon:i(()=>[o(r(K))]),default:i(()=>[s[37]||(s[37]=c(" 下载资源 "))]),_:1})]),_:1})]),_:1})):W("",!0)]),_:1},8,["show"]),o(r(re),{show:v.value,"onUpdate:show":s[13]||(s[13]=m=>v.value=m),preset:"card",title:"渠道详情",style:{width:"70%","max-width":"900px"}},{default:i(()=>[S.value?(x(),D(r(w),{key:0,vertical:"",size:"large"},{default:i(()=>[o(r(G),{cols:2,"x-gap":16},{default:i(()=>[o(r(C),null,{default:i(()=>[o(r(U),{width:"100%",src:E,"fallback-src":E})]),_:1}),o(r(C),null,{default:i(()=>[o(r(w),{vertical:""},{default:i(()=>[o(r(J),null,{default:i(()=>[c(h(S.value.name),1)]),_:1}),o(r(w),null,{default:i(()=>[o(r(T),{size:"large",type:"error"},{default:i(()=>s[38]||(s[38]=[c(" 渠道 ")])),_:1}),S.value.adapterType?(x(),D(r(T),{key:0,size:"small"},{default:i(()=>[c(h(S.value.adapterType),1)]),_:1})):W("",!0)]),_:1}),o(r(M),null,{default:i(()=>[c("上传者: "+h(S.value.uploader?.username),1)]),_:1}),o(r(M),null,{default:i(()=>[c("更新日期: "+h(S.value.updatedAt),1)]),_:1}),S.value.options.baseUrl?(x(),D(r(M),{key:0},{default:i(()=>[c(" 端点: "+h(S.value.options.baseUrl),1)]),_:1})):W("",!0)]),_:1})]),_:1})]),_:1}),o(r(I)),o(r(z),null,{default:i(()=>s[39]||(s[39]=[c("资源描述")])),_:1}),b("div",null,h(S.value.description),1),o(r(I)),o(r(z),null,{default:i(()=>s[40]||(s[40]=[c("配置信息")])),_:1}),b("pre",An,h(JSON.stringify(S.value.options||{},null,2)),1),o(r(w),{justify:"end"},{default:i(()=>[o(r(Q),{type:"primary",onClick:s[12]||(s[12]=m=>V(S.value))},{icon:i(()=>[o(r(K))]),default:i(()=>[s[41]||(s[41]=c(" 下载资源 "))]),_:1})]),_:1})]),_:1})):W("",!0)]),_:1},8,["show"])]),_:1}))}});export{ia as default};
