import{_ as D,a as q}from"./add-one-CaVNR016.js";import{d as j,q as H,s as y,r as i,v as K,c as Q,o as W,e as o,w as n,y as X,u as r,z as Y,N as O,B as _,g as h,C as Z,D as ee,E as S,a as te,F as f,G as oe,k as ne}from"./index-BerDumZT.js";import{I as ae}from"./cloudy-CKKDLxO2.js";import{f as se,c as le,d as re}from"./presets-CnP5Ncw9.js";import ie from"./PresetFormModal-CkT_ww-j.js";import{f as ue}from"./processors-DWkIYn9z.js";import{f as pe}from"./toolGroup-ChX0qXu3.js";import{_ as ce}from"./FormItem-DPe3OX-i.js";import{N as de,_ as me,a as _e}from"./Grid-DIE8y2Et.js";import"./Checkbox-DF4_xZPC.js";import"./prop-BjyUHhTu.js";import"./InputNumber-4dFMXJp2.js";import"./CollapseItem-Rh2rN3kY.js";const fe={class:"flex gap-4"},ve=j({__name:"index",setup(ge){function I({edit:t,remove:e}){return[{title:"ID",key:"id"},{title:"名称",key:"name",render(s){const m=[s.name];return s.uploader&&m.push(f(oe,{trigger:"hover"},{trigger:()=>f(ae,{style:{color:"green"}}),default:()=>"云端预设"})),f(O,{align:"center"},{default:()=>m})}},{title:"前缀",key:"prefix"},{title:"温度",key:"sendMessageOption.temperature"},{title:"上传者",key:"uploader"},{title:"更新日期",key:"updatedAt"},{title:"创建日期",key:"createdAt"},{title:"操作",key:"actions",render(s){return[f(_,{type:"info",strong:!0,tertiary:!0,size:"small",onClick:()=>t(s)},{default:()=>"修改"}),f(_,{type:"error",strong:!0,tertiary:!0,size:"small",onClick:()=>e(s)},{default:()=>"删除"})]}}]}const u=H(),k=y({value:[]}),M=y({value:{}}),l=i(!1),c=i(!1),v=i(!1),P={modelType:"settings",name:"",embedded:!1,description:"",sendMessageOption:{systemOverride:"",temperature:.6,model:""},prefix:"",channelId:"",local:!0},g=i(JSON.parse(JSON.stringify(P))),N=i([]),x=i([]),b=i([]),a=y({name:void 0,prompt:""});function d(t){l.value=!0,se(t).then(e=>{k.value=e.data,l.value=!1}).catch(e=>{console.error(e),l.value=!1})}function w(){a.name=void 0,a.prompt="",d(a)}function G(){v.value=!1,g.value=JSON.parse(JSON.stringify(P)),c.value=!0}function T(t){v.value=!0,console.error(t),g.value={...t},c.value=!0}function z(t){window.$dialog.warning({title:"确认删除",content:`确定要删除预设 "${t.name}" 吗？此操作不可恢复。`,positiveText:"确认删除",negativeText:"取消",onPositiveClick:()=>{l.value=!0,re(t.id).then(e=>{e.code===0?(u.success("删除成功"),d(a)):u.error(e.message||"删除失败")}).catch(e=>{u.error(e.message||"删除操作发生错误")}).finally(()=>{l.value=!1})}})}function B(t){l.value=!0,le(t).then(e=>{e.code===0?(u.success(v.value?"更新成功":"创建成功"),d(a)):u.error(e.message),l.value=!1,c.value=!1}).catch(e=>{u.error(e.message),l.value=!1})}const F=I({edit(t){T(t)},remove(t){z(t)}});async function J(){try{const t=await ue({});N.value=t.data.filter(e=>e.type==="pre").map(e=>({label:e.name,value:e.id})),x.value=t.data.filter(e=>e.type==="post").map(e=>({label:e.name,value:e.id}))}catch(t){console.error(t)}}function L(t){pe(t).then(e=>{b.value=e.data.map(s=>({label:s.name,value:s.id}))})}return K(()=>{d(M.value),J(),L()}),(t,e)=>{const s=Y,m=me,A=Z,E=ee,R=_e,U=ce,C=X,V=D,$=q;return W(),Q("div",null,[o(r(S),{vertical:"",size:"large"},{default:n(()=>[o(C,null,{default:n(()=>[o(U,{ref:"formRef",model:a,"label-placement":"left",inline:"","show-feedback":!1},{default:n(()=>[o(r(de),{cols:"1 s:2 m:3 l:4","x-gap":12,"y-gap":16,responsive:"screen","item-responsive":""},{default:n(()=>[o(m,{span:"1",label:"名称",path:"name"},{default:n(()=>[o(s,{value:a.name,"onUpdate:value":e[0]||(e[0]=p=>a.name=p),placeholder:"请输入要搜索的名称关键词"},null,8,["value"])]),_:1}),o(m,{span:"1",label:"模型",path:"model"},{default:n(()=>[o(s,{value:a.prompt,"onUpdate:value":e[1]||(e[1]=p=>a.prompt=p),placeholder:"请输入要搜索的设定内容"},null,8,["value"])]),_:1}),o(R,{span:"1"},{default:n(()=>[o(r(O),{class:"ml-auto"},{default:n(()=>[o(r(_),{type:"primary",onClick:e[2]||(e[2]=p=>d(a))},{icon:n(()=>[o(A)]),default:n(()=>[e[4]||(e[4]=h(" 搜索 "))]),_:1}),o(r(_),{strong:"",secondary:"",onClick:w},{icon:n(()=>[o(E)]),default:n(()=>[e[5]||(e[5]=h(" 重置 "))]),_:1})]),_:1})]),_:1})]),_:1})]),_:1},8,["model"])]),_:1}),o(C,null,{default:n(()=>[o(r(S),{vertical:"",size:"large"},{default:n(()=>[te("div",fe,[o(r(_),{type:"primary",onClick:G},{icon:n(()=>[o(V)]),default:n(()=>[e[6]||(e[6]=h(" 新建预设 "))]),_:1})]),o($,{columns:r(F),data:k.value,loading:l.value},null,8,["columns","data","loading"])]),_:1})]),_:1})]),_:1}),o(ie,{show:c.value,"onUpdate:show":e[3]||(e[3]=p=>c.value=p),"edit-mode":v.value,"initial-data":g.value,"pre-processor-options":N.value,"post-processor-options":x.value,"tools-options":b.value,onSubmit:B},null,8,["show","edit-mode","initial-data","pre-processor-options","post-processor-options","tools-options"])])}}}),Ge=ne(ve,[["__scopeId","data-v-6ab303e4"]]);export{Ge as default};
