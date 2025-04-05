import{j as T,o as C}from"./index-CYcWqdD7.js";import{d as k,r as c,s as B,G as f,c as N,o as x,b as j,n as M,u as n,ak as V,w as l,e as a,a as q,ah as v,ad as E,B as g,g as _,ac as U}from"./index-BjEaegUP.js";import{_ as A}from"./FormItem-CbOKjIWi.js";import{N as R}from"./Grid-o2FxrQJs.js";import{_ as i}from"./FormItemGridItem-CSIse2iU.js";const D={style:{display:"flex","justify-content":"flex-end","margin-top":"24px"}},z=k({__name:"ToolFormModal",props:{show:Boolean,editMode:Boolean,initialData:{type:Object,default:()=>({})}},emits:["update:show","submit"],setup(u,{emit:y}){const p=u,d=y,m=c(),r=B({get:()=>p.show,set:o=>d("update:show",o)}),w={name:{required:!0,trigger:["blur","input"],message:"请输入工具名称"},description:{required:!0,trigger:["blur","input"],message:"请输入工具描述"},code:{required:!0,trigger:["blur","input"],message:"请输入工具代码"}},b=T(),t=c({description:"",code:`import { CustomTool } from 'chaite'

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
`,modelType:"executable"});f(()=>p.initialData,o=>{p.editMode&&o&&(t.value={...o})},{immediate:!0});function h(){m.value?.validate().then(o=>{if(Array.isArray(o)){console.error(o);return}d("submit",t.value),r.value=!1})}return f(r,o=>{!o&&!p.editMode&&(t.value={name:"",description:"",code:`import { CustomTool } from 'chaite'

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
`})}),(o,e)=>(x(),N("div",null,[r.value?(x(),j(n(V),{key:0,show:r.value,"onUpdate:show":e[4]||(e[4]=s=>r.value=s),preset:"card",style:{width:"700px","max-width":"90vw"}},{default:l(()=>[a(n(U),{title:u.editMode?"编辑工具":"添加工具"},{default:l(()=>[a(n(A),{ref_key:"formRef",ref:m,rules:w,model:t.value},{default:l(()=>[a(n(R),{cols:24,"x-gap":12,"y-gap":16,responsive:"screen","item-responsive":""},{default:l(()=>[a(n(i),{span:"24",label:"名称",path:"name"},{default:l(()=>[a(n(v),{value:t.value.name,"onUpdate:value":e[0]||(e[0]=s=>t.value.name=s),placeholder:"请输入工具名称"},null,8,["value"])]),_:1}),a(n(i),{span:"24",label:"描述",path:"description"},{default:l(()=>[a(n(v),{value:t.value.description,"onUpdate:value":e[1]||(e[1]=s=>t.value.description=s),type:"textarea",placeholder:"请输入工具描述"},null,8,["value"])]),_:1}),a(n(i),{span:"24",label:"代码",path:"code"},{default:l(()=>[a(n(C),{modelValue:t.value.code,"onUpdate:modelValue":e[2]||(e[2]=s=>t.value.code=s),style:{width:"100%"},lang:n(b),basic:""},null,8,["modelValue","lang"])]),_:1})]),_:1}),q("div",D,[a(n(E),null,{default:l(()=>[a(n(g),{onClick:e[3]||(e[3]=s=>r.value=!1)},{default:l(()=>e[5]||(e[5]=[_(" 取消 ")])),_:1}),a(n(g),{type:"primary",onClick:h},{default:l(()=>e[6]||(e[6]=[_(" 确定 ")])),_:1})]),_:1})])]),_:1},8,["model"])]),_:1},8,["title"])]),_:1},8,["show"])):M("",!0)]))}});export{z as _};
