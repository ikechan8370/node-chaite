import{D as T}from"./monaco-editor-vue3-DsjxY-Sn.js";import{d as C,r as c,x as B,J as f,c as N,o as x,b as k,n as M,u as t,K as E,w as l,e as n,a as j,z as v,E as q,B as g,g as _,y as D}from"./index-DZraatOt.js";import{_ as U}from"./FormItem-CMLIekqh.js";import{N as A,_ as p}from"./Grid-DbT1yFGD.js";const R={style:{display:"flex","justify-content":"flex-end","margin-top":"24px"}},G=C({__name:"ToolFormModal",props:{show:Boolean,editMode:Boolean,initialData:{type:Object,default:()=>({})}},emits:["update:show","submit"],setup(u,{emit:y}){const i=u,d=y,m=c(),s=B({get:()=>i.show,set:o=>d("update:show",o)}),w={name:{required:!0,trigger:["blur","input"],message:"请输入工具名称"},description:{required:!0,trigger:["blur","input"],message:"请输入工具描述"},code:{required:!0,trigger:["blur","input"],message:"请输入工具代码"}},a=c({description:"",code:`import { CustomTool } from 'chaite'

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
`,modelType:"executable"});f(()=>i.initialData,o=>{i.editMode&&o&&(a.value={...o})},{immediate:!0});function h(){m.value?.validate().then(o=>{if(Array.isArray(o)){console.error(o);return}d("submit",a.value),s.value=!1})}f(s,o=>{!o&&!i.editMode&&(a.value={name:"",description:"",code:`import { CustomTool } from 'chaite'

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
`})});const b={colorDecorators:!0,lineHeight:24,tabSize:2};return(o,e)=>(x(),N("div",null,[s.value?(x(),k(t(E),{key:0,show:s.value,"onUpdate:show":e[4]||(e[4]=r=>s.value=r),preset:"card",style:{width:"700px","max-width":"90vw"}},{default:l(()=>[n(t(D),{title:u.editMode?"编辑工具":"添加工具"},{default:l(()=>[n(t(U),{ref_key:"formRef",ref:m,rules:w,model:a.value},{default:l(()=>[n(t(A),{cols:24,"x-gap":12,"y-gap":16,responsive:"screen","item-responsive":""},{default:l(()=>[n(t(p),{span:"24",label:"名称",path:"name"},{default:l(()=>[n(t(v),{value:a.value.name,"onUpdate:value":e[0]||(e[0]=r=>a.value.name=r),placeholder:"请输入工具名称"},null,8,["value"])]),_:1}),n(t(p),{span:"24",label:"描述",path:"description"},{default:l(()=>[n(t(v),{value:a.value.description,"onUpdate:value":e[1]||(e[1]=r=>a.value.description=r),type:"textarea",placeholder:"请输入工具描述"},null,8,["value"])]),_:1}),n(t(p),{span:"24",label:"代码",path:"code"},{default:l(()=>[n(t(T),{value:a.value.code,"onUpdate:value":e[2]||(e[2]=r=>a.value.code=r),theme:"vs",options:b,language:"javascript",width:"100%",height:"400"},null,8,["value"])]),_:1})]),_:1}),j("div",R,[n(t(q),null,{default:l(()=>[n(t(g),{onClick:e[3]||(e[3]=r=>s.value=!1)},{default:l(()=>e[5]||(e[5]=[_(" 取消 ")])),_:1}),n(t(g),{type:"primary",onClick:h},{default:l(()=>e[6]||(e[6]=[_(" 确定 ")])),_:1})]),_:1})])]),_:1},8,["model"])]),_:1},8,["title"])]),_:1},8,["show"])):M("",!0)]))}});export{G as _};
