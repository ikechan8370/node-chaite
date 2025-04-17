import{d as T,c as _,o as N,a as u,r as C,s as P,x as c,e as s,u as t,J as E,w as a,y as H,E as v,z as b,g as r,C as g,aA as S,a0 as z,R as y,B as f,k as A}from"./index-C7DPnO_D.js";import{_ as G}from"./FormItem-BlQlICgr.js";import{N as O}from"./Grid-CE08eNSd.js";import{_ as n}from"./FormItemGridItem-B9miZ-vg.js";import{N as k}from"./InputNumber-Dv72HyaG.js";import{N as q,a as $}from"./CollapseItem-Dbw0w12b.js";import{N as M}from"./Checkbox-DSxx-Bp1.js";const j={xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink",viewBox:"0 0 512 512"},D=T({name:"InformationCircleOutline",render:function(x,d){return N(),_("svg",j,d[0]||(d[0]=[u("path",{d:"M248 64C146.39 64 64 146.39 64 248s82.39 184 184 184s184-82.39 184-184S349.61 64 248 64z",fill:"none",stroke:"currentColor","stroke-miterlimit":"10","stroke-width":"32"},null,-1),u("path",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round","stroke-width":"32",d:"M220 220h32v116"},null,-1),u("path",{fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-miterlimit":"10","stroke-width":"32",d:"M208 340h88"},null,-1),u("path",{d:"M248 130a26 26 0 1 0 26 26a26 26 0 0 0-26-26z",fill:"currentColor"},null,-1)]))}}),F={style:{display:"flex","align-items":"center",width:"100%"}},V={style:{display:"flex","justify-content":"flex-end","margin-top":"24px"}},J=T({__name:"PresetFormModal",props:{show:Boolean,editMode:Boolean,initialData:{type:Object,default:()=>({})},preProcessorOptions:{type:Array,default:()=>[]},postProcessorOptions:{type:Array,default:()=>[]},toolsOptions:{type:Array,default:()=>[]}},emits:["update:show","submit"],setup(p,{emit:x}){const d=p,h=x,w=C(),m=P({get:()=>d.show,set:i=>h("update:show",i)}),U=[{label:"高",value:"high"},{label:"中",value:"medium"},{label:"低",value:"low"}],I=[{label:"无",value:"none"},{label:"任意",value:"any"},{label:"自动",value:"auto"},{label:"指定",value:"specified"}],R={name:{required:!0,trigger:["blur","input"],message:"请输入预设名称"},description:{required:!0,trigger:["blur","change"],message:"请选择客户端类型"},prefix:{required:!0,trigger:["blur","input"],message:"请输入基础URL"},"sendMessageOption.model":{required:!0,trigger:["blur","input"],message:"请输入模型"}},l=C({modelType:"settings",name:"",embedded:!1,description:"",sendMessageOption:{systemOverride:"",temperature:.6,model:"",maxToken:4e3,disableHistoryRead:!1,disableHistorySave:!1,stream:!0,enableReasoning:!1,reasoningEffort:"medium",reasoningBudgetTokens:2e3,toolChoice:{type:"auto",tools:[]},toolGroupId:["default_local"]},prefix:"",local:!0});c(()=>d.initialData,i=>{if(d.editMode&&i){const e={...i};e.sendMessageOption||(e.sendMessageOption={}),e.sendMessageOption.toolChoice||(e.sendMessageOption.toolChoice={type:"auto",tools:[]}),l.value=e}},{immediate:!0});function B(){w.value?.validate().then(i=>{if(Array.isArray(i)){console.error(i);return}h("submit",l.value),m.value=!1})}return c(m,i=>{!i&&!d.editMode&&(l.value={modelType:"settings",name:"",embedded:!1,description:"",sendMessageOption:{systemOverride:"",temperature:.6,model:"",maxToken:4e3,disableHistoryRead:!1,disableHistorySave:!1,stream:!0,enableReasoning:!1,reasoningEffort:"medium",reasoningBudgetTokens:2e3,toolChoice:{type:"auto",tools:[]},toolGroupId:["default_local"]},prefix:"",local:!0})}),(i,e)=>(N(),_("div",null,[s(t(E),{show:m.value,"onUpdate:show":e[17]||(e[17]=o=>m.value=o),preset:"card",style:{width:"700px","max-width":"90vw"}},{default:a(()=>[s(t(H),{title:p.editMode?"编辑预设":"添加预设"},{default:a(()=>[s(t(G),{ref_key:"formRef",ref:w,rules:R,model:l.value},{default:a(()=>[s(t(O),{cols:24,"x-gap":12,"y-gap":16,responsive:"self","item-responsive":""},{default:a(()=>[s(t(n),{span:"12 s:8 m:8",label:"名称",path:"name"},{default:a(()=>[s(t(v),{value:l.value.name,"onUpdate:value":e[0]||(e[0]=o=>l.value.name=o),placeholder:"请输入预设名称"},null,8,["value"])]),_:1}),s(t(n),{span:"12 s:8 m:8",label:"前缀",path:"prefix"},{default:a(()=>[s(t(v),{value:l.value.prefix,"onUpdate:value":e[1]||(e[1]=o=>l.value.prefix=o),placeholder:"请输入前缀"},null,8,["value"])]),_:1}),s(t(n),{span:"12 s:8 m:8",label:"模型",path:"sendMessageOption.model"},{default:a(()=>[s(t(v),{value:l.value.sendMessageOption.model,"onUpdate:value":e[2]||(e[2]=o=>l.value.sendMessageOption.model=o),placeholder:"请输入模型"},null,8,["value"])]),_:1}),s(t(n),{span:"12 s:8 m:8",label:"温度",path:"sendMessageOption.temperature"},{default:a(()=>[s(t(k),{value:l.value.sendMessageOption.temperature,"onUpdate:value":e[3]||(e[3]=o=>l.value.sendMessageOption.temperature=o),placeholder:"请输入温度"},null,8,["value"])]),_:1}),s(t(n),{span:"12 s:8 m:8",label:"最大Token",path:"sendMessageOption.maxToken"},{default:a(()=>[s(t(k),{value:l.value.sendMessageOption.maxToken,"onUpdate:value":e[4]||(e[4]=o=>l.value.sendMessageOption.maxToken=o),placeholder:"请输入最大Token数"},null,8,["value"])]),_:1}),s(t(n),{span:"24",label:"系统提示词",path:"sendMessageOption.systemOverride"},{default:a(()=>[s(t(v),{value:l.value.sendMessageOption.systemOverride,"onUpdate:value":e[5]||(e[5]=o=>l.value.sendMessageOption.systemOverride=o),type:"textarea",placeholder:"请输入提示词"},null,8,["value"])]),_:1})]),_:1}),s(t(q),{class:"mt-4"},{default:a(()=>[s(t($),{title:"高级设置",name:"advanced"},{default:a(()=>[s(t(O),{cols:24,"x-gap":12,"y-gap":16,responsive:"screen","item-responsive":""},{default:a(()=>[s(t(n),{span:"24 s:12 m:12",label:"历史记录设置",path:"historySettings"},{default:a(()=>[s(t(b),{align:"center"},{default:a(()=>[s(t(M),{checked:l.value.sendMessageOption.disableHistoryRead,"onUpdate:checked":e[6]||(e[6]=o=>l.value.sendMessageOption.disableHistoryRead=o)},{default:a(()=>e[18]||(e[18]=[r(" 禁用历史记录读取 ")])),_:1},8,["checked"]),s(t(M),{checked:l.value.sendMessageOption.disableHistorySave,"onUpdate:checked":e[7]||(e[7]=o=>l.value.sendMessageOption.disableHistorySave=o)},{default:a(()=>e[19]||(e[19]=[r(" 禁用历史记录保存 ")])),_:1},8,["checked"])]),_:1})]),_:1}),s(t(n),{span:"12 s:12 m:6",label:"流模式",path:"sendMessageOption.stream"},{default:a(()=>[s(t(M),{checked:l.value.sendMessageOption.stream,"onUpdate:checked":e[8]||(e[8]=o=>l.value.sendMessageOption.stream=o)},{default:a(()=>e[20]||(e[20]=[r(" 启用流模式 ")])),_:1},8,["checked"])]),_:1}),s(t(n),{span:"24",label:"推理设置",path:"reasoningSettings"},{default:a(()=>[s(t(O),{cols:24,"x-gap":12,"y-gap":16},{default:a(()=>[s(t(n),{span:"8",label:"启用推理",path:"sendMessageOption.enableReasoning"},{default:a(()=>[s(t(M),{checked:l.value.sendMessageOption.enableReasoning,"onUpdate:checked":e[9]||(e[9]=o=>l.value.sendMessageOption.enableReasoning=o)},{default:a(()=>e[21]||(e[21]=[r(" 启用推理 ")])),_:1},8,["checked"])]),_:1}),s(t(n),{span:"8",label:"推理强度",path:"sendMessageOption.reasoningEffort"},{default:a(()=>[s(t(g),{value:l.value.sendMessageOption.reasoningEffort,"onUpdate:value":e[10]||(e[10]=o=>l.value.sendMessageOption.reasoningEffort=o),options:U,placeholder:"请选择推理强度"},null,8,["value"])]),_:1}),s(t(n),{span:"8",label:"推理Token预算",path:"sendMessageOption.reasoningBudgetTokens"},{default:a(()=>[s(t(k),{value:l.value.sendMessageOption.reasoningBudgetTokens,"onUpdate:value":e[11]||(e[11]=o=>l.value.sendMessageOption.reasoningBudgetTokens=o),placeholder:"推理Token预算"},null,8,["value"])]),_:1})]),_:1})]),_:1}),s(t(n),{span:"24",label:"工具选择",path:"sendMessageOption.toolChoice"},{default:a(()=>[s(t(O),{cols:24,"x-gap":12,"y-gap":16},{default:a(()=>[s(t(n),{span:"24",label:"",path:"sendMessageOption.toolChoice.type"},{default:a(()=>[u("div",F,[s(t(g),{value:l.value.sendMessageOption.toolChoice.type,"onUpdate:value":e[12]||(e[12]=o=>l.value.sendMessageOption.toolChoice.type=o),options:I,placeholder:"请选择工具选择类型",style:{flex:"1"}},null,8,["value"]),s(t(S),{placement:"top",trigger:"hover"},{trigger:a(()=>[s(t(z),{size:"18",class:"ml-2",style:{"margin-left":"8px",cursor:"pointer"}},{default:a(()=>[s(t(D))]),_:1})]),default:a(()=>[e[22]||(e[22]=u("span",null,'注意：如果选择了"任意"，则toolcall的下一轮assistant消息会自动变回"自动"模式，否则会无限使用工具。',-1))]),_:1})])]),_:1})]),_:1})]),_:1}),s(t(n),{span:"24 s:12 m:12",label:"处理器",path:"processors"},{default:a(()=>[s(t(b),null,{default:a(()=>[s(t(y),{trigger:"hover",placement:"bottom",width:260},{trigger:a(()=>[s(t(f),{size:"small"},{default:a(()=>e[23]||(e[23]=[r(" 前处理器 ")])),_:1})]),default:a(()=>[s(t(g),{value:l.value.sendMessageOption.preProcessorIds,"onUpdate:value":e[13]||(e[13]=o=>l.value.sendMessageOption.preProcessorIds=o),multiple:"",placeholder:"请选择前处理器",options:p.preProcessorOptions},null,8,["value","options"])]),_:1}),s(t(y),{trigger:"hover",placement:"bottom",width:260},{trigger:a(()=>[s(t(f),{size:"small"},{default:a(()=>e[24]||(e[24]=[r(" 后处理器 ")])),_:1})]),default:a(()=>[s(t(g),{value:l.value.sendMessageOption.postProcessorIds,"onUpdate:value":e[14]||(e[14]=o=>l.value.sendMessageOption.postProcessorIds=o),multiple:"",placeholder:"请选择后处理器",options:p.postProcessorOptions},null,8,["value","options"])]),_:1})]),_:1})]),_:1}),s(t(n),{span:"24 s:12 m:12",label:"工具",path:"tools"},{default:a(()=>[s(t(y),{trigger:"hover",placement:"bottom",width:260},{trigger:a(()=>[s(t(f),{size:"small"},{default:a(()=>e[25]||(e[25]=[r(" 工具组 ")])),_:1})]),default:a(()=>[s(t(g),{value:l.value.sendMessageOption.toolGroupId,"onUpdate:value":e[15]||(e[15]=o=>l.value.sendMessageOption.toolGroupId=o),multiple:"",placeholder:"请选择工具组",options:p.toolsOptions},null,8,["value","options"])]),_:1})]),_:1})]),_:1})]),_:1})]),_:1}),u("div",V,[s(t(b),null,{default:a(()=>[s(t(f),{onClick:e[16]||(e[16]=o=>m.value=!1)},{default:a(()=>e[26]||(e[26]=[r(" 取消 ")])),_:1}),s(t(f),{type:"primary",onClick:B},{default:a(()=>e[27]||(e[27]=[r(" 确定 ")])),_:1})]),_:1})])]),_:1},8,["model"])]),_:1},8,["title"])]),_:1},8,["show"])]))}}),ee=A(J,[["__scopeId","data-v-a18981a1"]]);export{ee as default};
