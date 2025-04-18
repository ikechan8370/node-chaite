import{j as h,o as C}from"./index-I2UkbkCY.js";import{d as B,r as c,s as N,x as f,c as k,o as x,b as j,n as E,u as n,J as M,w as l,e as t,a as V,E as v,z as q,B as g,g as y,y as U}from"./index-C3QmH4Bd.js";import{_ as A}from"./FormItem-B5ap4Yxk.js";import{N as R}from"./Grid-BwlSpxNL.js";import{_ as i}from"./FormItemGridItem-YxRe20Wu.js";const D={style:{display:"flex","justify-content":"flex-end","margin-top":"24px"}},O=B({__name:"ToolFormModal",props:{show:Boolean,editMode:Boolean,initialData:{type:Object,default:()=>({})}},emits:["update:show","submit"],setup(u,{emit:_}){const p=u,d=_,m=c(),r=N({get:()=>p.show,set:o=>d("update:show",o)}),w={name:{required:!0,trigger:["blur","input"],message:"请输入工具名称"},description:{required:!0,trigger:["blur","input"],message:"请输入工具描述"},code:{required:!0,trigger:["blur","input"],message:"请输入工具代码"}},b=h(),a=c({description:"",code:`import { CustomTool } from 'chaite'

export class ExampleTool extends CustomTool {
  name = 'example'
  function = {
    name: 'example',
    description: 'example',
    parameters: {
      type: 'object',
      properties: {
        example: {
          type: 'string',
          description: 'example'
        }
      },
      required: ['example']
    }
  }

  async run (args) {
    return args.example
  }
}

export default new ExampleTool()
`,modelType:"executable"});f(()=>p.initialData,o=>{p.editMode&&o&&(a.value={...o})},{immediate:!0});function T(){m.value?.validate().then(o=>{if(Array.isArray(o)){console.error(o);return}d("submit",a.value),r.value=!1})}return f(r,o=>{!o&&!p.editMode&&(a.value={name:"",description:"",code:`import { CustomTool } from 'chaite'

export class ExampleTool extends CustomTool {
  name = 'example'
  function = {
    name: 'example',
    description: 'example',
    parameters: {
      type: 'object',
      properties: {
        example: {
          type: 'string',
          description: 'example'
        }
      },
      required: ['example']
    }
  }

  async run (args) {
    return args.example
  }
}

export default new ExampleTool()
`})}),(o,e)=>(x(),k("div",null,[r.value?(x(),j(n(M),{key:0,show:r.value,"onUpdate:show":e[4]||(e[4]=s=>r.value=s),preset:"card",style:{width:"700px","max-width":"90vw"}},{default:l(()=>[t(n(U),{title:u.editMode?"编辑工具":"添加工具"},{default:l(()=>[t(n(A),{ref_key:"formRef",ref:m,rules:w,model:a.value},{default:l(()=>[t(n(R),{cols:24,"x-gap":12,"y-gap":16,responsive:"screen","item-responsive":""},{default:l(()=>[t(n(i),{span:"24",label:"名称",path:"name"},{default:l(()=>[t(n(v),{value:a.value.name,"onUpdate:value":e[0]||(e[0]=s=>a.value.name=s),placeholder:"请输入工具名称"},null,8,["value"])]),_:1}),t(n(i),{span:"24",label:"描述",path:"description"},{default:l(()=>[t(n(v),{value:a.value.description,"onUpdate:value":e[1]||(e[1]=s=>a.value.description=s),type:"textarea",placeholder:"请输入工具描述"},null,8,["value"])]),_:1}),t(n(i),{span:"24",label:"代码",path:"code"},{default:l(()=>[t(n(C),{modelValue:a.value.code,"onUpdate:modelValue":e[2]||(e[2]=s=>a.value.code=s),style:{width:"100%"},lang:n(b),basic:""},null,8,["modelValue","lang"])]),_:1})]),_:1}),V("div",D,[t(n(q),null,{default:l(()=>[t(n(g),{onClick:e[3]||(e[3]=s=>r.value=!1)},{default:l(()=>e[5]||(e[5]=[y(" 取消 ")])),_:1}),t(n(g),{type:"primary",onClick:T},{default:l(()=>e[6]||(e[6]=[y(" 确定 ")])),_:1})]),_:1})])]),_:1},8,["model"])]),_:1},8,["title"])]),_:1},8,["show"])):E("",!0)]))}});export{O as _};
