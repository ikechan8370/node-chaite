import{D as k}from"./monaco-editor-vue3-DsjxY-Sn.js";import{d as M,a_ as A,r as f,x as N,J as x,c as B,o as y,b as L,n as U,u as a,K as D,w as s,e as o,a as T,z as _,A as R,g as p,B as d,E as q,y as j}from"./index-DZraatOt.js";import{_ as z}from"./FormItem-CMLIekqh.js";import{N as V,_ as u}from"./Grid-DbT1yFGD.js";const I={style:{display:"flex","justify-content":"flex-end","margin-top":"24px"}},$=`import { asyncLocalStorage, PreProcessor } from 'chaite'

export class ExamplePreProcessor extends PreProcessor {
  name = 'example'

  /**
   * 处理逻辑
   * 可以通过\`asyncLocalStorage.getStore().getEvent()\`获取e实例
   * @param {import('chaite').UserMessage} message
   * @returns {Promise<import('chaite').UserMessage>}
   */
  async process (message) {
    const context = (/** @type {AsyncLocalStorage<import('chaite').ChaiteContext>} **/asyncLocalStorage).getStore()
    const e = context.getEvent()
    await e.reply('处理一下' + e.sender.nickname + '的问题')
    message.content.forEach((item) => {
      item.text = item.text.replace(/<|>/g, '')
    })
    return message
  }
}
`,c=`import { asyncLocalStorage, PostProcessor } from 'chaite'

export class ExamplePostProcessor extends PostProcessor {
  name = 'example'

  /**
   * 处理逻辑
   * 可以通过\`asyncLocalStorage.getStore().getEvent()\`获取e实例
   * @param {import('chaite').AssistantMessage} message
   * @returns {Promise<import('chaite').AssistantMessage>}
   */
  async process (message) {
    const context = (/** @type {AsyncLocalStorage<import('chaite').ChaiteContext>} **/asyncLocalStorage).getStore()
    const e = context.getEvent()
    await e.reply('处理一下AI对' + e.sender.nickname + '的回复')
    const rawResponse = message.content[0].text
    message.content[0].text = rawResponse.replace(/<|>/g, '')
    return message
  }
}
`,K=M({__name:"ProcessorFormModal",props:{show:Boolean,editMode:Boolean,initialData:{type:Object,default:()=>({description:"",code:c,modelType:"executable",type:"post"})}},emits:["update:show","submit"],setup(m,{emit:h}){const i=m,g=h,w=A(),v=f(),l=N({get:()=>i.show,set:n=>g("update:show",n)}),P={name:{required:!0,trigger:["blur","input"],message:"请输入处理器名称"},description:{required:!0,trigger:["blur","input"],message:"请输入处理器描述"},code:{required:!0,trigger:["blur","input"],message:"请输入处理器代码"}},t=f({description:"",code:c,modelType:"executable",type:"post"});function b(){const n=t.value.type==="pre"?$:c;if(!t.value.code||t.value.code.trim()===""){t.value.code=n;return}w.warning({title:"确认覆盖",content:"当前编辑区已有代码，插入示例代码将覆盖现有内容，是否继续？",positiveText:"确认",negativeText:"取消",onPositiveClick:()=>{t.value.code=n}})}x(()=>i.initialData,n=>{i.editMode&&n&&(t.value={...n})},{immediate:!0});function C(){v.value?.validate().then(n=>{if(Array.isArray(n)){console.error(n);return}g("submit",t.value),l.value=!1})}x(l,n=>{!n&&!i.editMode&&(t.value={name:"",description:"",code:c})});const S={colorDecorators:!0,lineHeight:24,tabSize:2};return(n,e)=>{const E=R;return y(),B("div",null,[l.value?(y(),L(a(D),{key:0,show:l.value,"onUpdate:show":e[5]||(e[5]=r=>l.value=r),preset:"card",style:{width:"700px","max-width":"90vw"}},{default:s(()=>[o(a(j),{title:m.editMode?"编辑处理器":"添加处理器"},{default:s(()=>[o(a(z),{ref_key:"formRef",ref:v,rules:P,model:t.value},{default:s(()=>[o(a(V),{cols:24,"x-gap":12,"y-gap":16,responsive:"screen","item-responsive":""},{default:s(()=>[o(a(u),{span:"24",label:"名称",path:"name"},{default:s(()=>[o(a(_),{value:t.value.name,"onUpdate:value":e[0]||(e[0]=r=>t.value.name=r),placeholder:"请输入处理器名称"},null,8,["value"])]),_:1}),o(a(u),{span:"24",label:"描述",path:"description"},{default:s(()=>[o(a(_),{value:t.value.description,"onUpdate:value":e[1]||(e[1]=r=>t.value.description=r),type:"textarea",placeholder:"请输入处理器描述"},null,8,["value"])]),_:1}),o(a(u),{span:"24",label:"类型",path:"type"},{default:s(()=>[o(E,{value:t.value.type,"onUpdate:value":e[2]||(e[2]=r=>t.value.type=r),options:[{value:"post",label:"后置"},{value:"pre",label:"前置"}],placeholder:"请输入处理器描述"},null,8,["value"])]),_:1}),o(a(u),{span:"24",label:"代码",path:"code"},{label:s(()=>[e[7]||(e[7]=p(" 代码 ")),o(a(d),{quaternary:"",type:"warning",style:{"font-size":"12px"},onClick:b},{default:s(()=>e[6]||(e[6]=[p(" 点击插入示例代码 ")])),_:1})]),default:s(()=>[o(a(k),{value:t.value.code,"onUpdate:value":e[3]||(e[3]=r=>t.value.code=r),theme:"vs",options:S,language:"javascript",width:"100%",height:"400"},null,8,["value"])]),_:1})]),_:1}),T("div",I,[o(a(q),null,{default:s(()=>[o(a(d),{onClick:e[4]||(e[4]=r=>l.value=!1)},{default:s(()=>e[8]||(e[8]=[p(" 取消 ")])),_:1}),o(a(d),{type:"primary",onClick:C},{default:s(()=>e[9]||(e[9]=[p(" 确定 ")])),_:1})]),_:1})])]),_:1},8,["model"])]),_:1},8,["title"])]),_:1},8,["show"])):U("",!0)])}}});export{K as _};
