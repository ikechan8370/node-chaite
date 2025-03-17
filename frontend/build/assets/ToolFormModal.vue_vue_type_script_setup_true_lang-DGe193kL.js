import{j as h,o as C}from"./index-D2mwPElf.js";import{d as B,r as c,x as N,J as f,c as k,o as x,b as M,n as j,u as n,K as E,w as l,e as a,a as V,z as v,E as q,B as g,g as y,y as U}from"./index-DTsNwqi0.js";import{_ as A}from"./FormItem-DQq8ZGbK.js";import{N as R,_ as i}from"./Grid-5vP1pSlP.js";const D={style:{display:"flex","justify-content":"flex-end","margin-top":"24px"}},K=B({__name:"ToolFormModal",props:{show:Boolean,editMode:Boolean,initialData:{type:Object,default:()=>({})}},emits:["update:show","submit"],setup(u,{emit:_}){const p=u,d=_,m=c(),r=N({get:()=>p.show,set:o=>d("update:show",o)}),w={name:{required:!0,trigger:["blur","input"],message:"请输入工具名称"},description:{required:!0,trigger:["blur","input"],message:"请输入工具描述"},code:{required:!0,trigger:["blur","input"],message:"请输入工具代码"}},b=h(),t=c({description:"",code:`import { CustomTool } from 'chaite'

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
`,modelType:"executable"});f(()=>p.initialData,o=>{p.editMode&&o&&(t.value={...o})},{immediate:!0});function T(){m.value?.validate().then(o=>{if(Array.isArray(o)){console.error(o);return}d("submit",t.value),r.value=!1})}return f(r,o=>{!o&&!p.editMode&&(t.value={name:"",description:"",code:`import { CustomTool } from 'chaite'

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
`})}),(o,e)=>(x(),k("div",null,[r.value?(x(),M(n(E),{key:0,show:r.value,"onUpdate:show":e[4]||(e[4]=s=>r.value=s),preset:"card",style:{width:"700px","max-width":"90vw"}},{default:l(()=>[a(n(U),{title:u.editMode?"编辑工具":"添加工具"},{default:l(()=>[a(n(A),{ref_key:"formRef",ref:m,rules:w,model:t.value},{default:l(()=>[a(n(R),{cols:24,"x-gap":12,"y-gap":16,responsive:"screen","item-responsive":""},{default:l(()=>[a(n(i),{span:"24",label:"名称",path:"name"},{default:l(()=>[a(n(v),{value:t.value.name,"onUpdate:value":e[0]||(e[0]=s=>t.value.name=s),placeholder:"请输入工具名称"},null,8,["value"])]),_:1}),a(n(i),{span:"24",label:"描述",path:"description"},{default:l(()=>[a(n(v),{value:t.value.description,"onUpdate:value":e[1]||(e[1]=s=>t.value.description=s),type:"textarea",placeholder:"请输入工具描述"},null,8,["value"])]),_:1}),a(n(i),{span:"24",label:"代码",path:"code"},{default:l(()=>[a(n(C),{modelValue:t.value.code,"onUpdate:modelValue":e[2]||(e[2]=s=>t.value.code=s),style:{width:"100%"},lang:n(b),basic:""},null,8,["modelValue","lang"])]),_:1})]),_:1}),V("div",D,[a(n(q),null,{default:l(()=>[a(n(g),{onClick:e[3]||(e[3]=s=>r.value=!1)},{default:l(()=>e[5]||(e[5]=[y(" 取消 ")])),_:1}),a(n(g),{type:"primary",onClick:T},{default:l(()=>e[6]||(e[6]=[y(" 确定 ")])),_:1})]),_:1})])]),_:1},8,["model"])]),_:1},8,["title"])]),_:1},8,["show"])):j("",!0)]))}});export{K as _};
