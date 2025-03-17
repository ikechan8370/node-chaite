import{_ as G,a as T}from"./add-one-hnGcN2CH.js";import{d as V,q as A,s as C,r as m,v as D,b as R,o as U,w as n,e as t,y as q,u as a,z as E,N as L,B as r,g as y,C as j,D as H,E as b,a as K,F as p}from"./index-DTsNwqi0.js";import{f as Q,c as W,d as X}from"./processors-C3yev00g.js";import{_ as Y}from"./ProcessorFormModal.vue_vue_type_script_setup_true_lang-B8v8uGW0.js";import{_ as Z}from"./FormItem-DQq8ZGbK.js";import{N as ee,_ as te,a as ne}from"./Grid-5vP1pSlP.js";import"./Checkbox-DUCmUl_Z.js";import"./prop-BjyUHhTu.js";import"./index-D2mwPElf.js";const oe={class:"flex gap-4"},pe=V({__name:"index",setup(ae){function P({test:o,edit:e,remove:g}){return[{title:"ID",key:"id",resizable:!0},{title:"名称",key:"name",render(l){return p("div",{},l.name)},resizable:!0},{title:"类型",key:"type",width:300},{title:"描述",key:"description",width:500},{title:"创建日期",key:"createdAt",resizable:!0},{title:"操作",key:"actions",render(l){return[p(r,{type:"primary",strong:!0,tertiary:!0,size:"small",onClick:()=>o(l)},{default:()=>"测试"}),p(r,{type:"info",strong:!0,tertiary:!0,size:"small",onClick:()=>e(l)},{default:()=>"修改"}),p(r,{type:"error",strong:!0,tertiary:!0,size:"small",onClick:()=>g(l)},{default:()=>"删除"})]}}]}const f=A(),k=C({value:[]}),u=m(!1),d=m(!1),h={modelType:"settings",name:"",code:"",description:"",uploader:void 0},v=m(JSON.parse(JSON.stringify(h))),s=m(!1);function c(o){s.value=!0,Q(o).then(e=>{k.value=e.data,s.value=!1}).catch(()=>{s.value=!1})}function w(o){window.$dialog.warning({title:"确认删除",content:`确定要删除处理器 "${o.name}" 吗？此操作不可恢复`,positiveText:"确认删除",onPositiveClick:()=>{X(o.id).then(e=>{e.code===0&&(f.success("删除成功"),c())}).finally(()=>s.value=!1)}})}function x(o){s.value=!0,W(o).then(e=>{e.code===0&&(f.success(d.value?"修改成功":"创建成功"),c())}).finally(()=>{s.value=!1,u.value=!1})}const z=P({test(o){f.success(`测试处理器: ${o.name}`)},edit(o){d.value=!0,v.value={...o},u.value=!0},remove:w});function S(){d.value=!1,v.value=JSON.parse(JSON.stringify(h)),u.value=!0}D(()=>{c()});const i=C({name:void 0});function B(){i.name=void 0,c(i)}return(o,e)=>{const g=E,l=te,M=j,$=H,I=ne,J=Z,N=q,O=G,F=T;return U(),R(a(b),{vertical:"",size:"large"},{default:n(()=>[t(N,null,{default:n(()=>[t(J,{model:i,"label-placement":"left",inline:"","show-feedback":!1},{default:n(()=>[t(a(ee),{cols:"1 s:2 m:3 l:6","x-gap":12,"y-gap":16,responsive:"screen","item-responsive":""},{default:n(()=>[t(l,{span:"1",label:"名称",path:"name"},{default:n(()=>[t(g,{value:i.name,"onUpdate:value":e[0]||(e[0]=_=>i.name=_),placeholder:"请输入要搜索的名称关键词"},null,8,["value"])]),_:1}),t(I,{span:"1"},{default:n(()=>[t(a(L),{class:"ml-auto"},{default:n(()=>[t(a(r),{type:"primary",onClick:e[1]||(e[1]=_=>c(i))},{icon:n(()=>[t(M)]),default:n(()=>[e[3]||(e[3]=y(" 搜索 "))]),_:1}),t(a(r),{strong:"",secondary:"",onClick:B},{icon:n(()=>[t($)]),default:n(()=>[e[4]||(e[4]=y(" 重置 "))]),_:1})]),_:1})]),_:1})]),_:1})]),_:1},8,["model"])]),_:1}),t(N,null,{default:n(()=>[t(a(b),{vertical:"",size:"large"},{default:n(()=>[K("div",oe,[t(a(r),{type:"primary",onClick:S},{icon:n(()=>[t(O)]),default:n(()=>[e[5]||(e[5]=y(" 新建处理器 "))]),_:1})]),t(F,{columns:a(z),data:k.value,loading:s.value},null,8,["columns","data","loading"])]),_:1})]),_:1}),t(Y,{show:u.value,"onUpdate:show":e[2]||(e[2]=_=>u.value=_),"edit-mode":d.value,"initial-data":v.value,onSubmit:x},null,8,["show","edit-mode","initial-data"])]),_:1})}}});export{pe as default};
