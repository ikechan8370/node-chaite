import{j as k,o as M}from"./index-CW4fTNq8.js";import{d as A,a_ as N,r as f,x as B,J as y,c as L,o as x,b as U,n as T,u as a,K as V,w as s,e as o,a as R,z as _,A as j,g as p,B as c,E as q,y as D}from"./index-BdXsfUTR.js";import{_ as z}from"./FormItem-DVIqIk7E.js";import{N as I,_ as u}from"./Grid-BklvICAu.js";const $={style:{display:"flex","justify-content":"flex-end","margin-top":"24px"}},F=`import { asyncLocalStorage, PreProcessor } from 'chaite'

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
`,d=`import { asyncLocalStorage, PostProcessor } from 'chaite'

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
`,H=A({__name:"ProcessorFormModal",props:{show:Boolean,editMode:Boolean,initialData:{type:Object,default:()=>({description:"",code:d,modelType:"executable",type:"post"})}},emits:["update:show","submit"],setup(m,{emit:w}){const i=m,g=w,P=N(),v=f(),r=B({get:()=>i.show,set:n=>g("update:show",n)}),b={name:{required:!0,trigger:["blur","input"],message:"请输入处理器名称"},description:{required:!0,trigger:["blur","input"],message:"请输入处理器描述"},code:{required:!0,trigger:["blur","input"],message:"请输入处理器代码"}},t=f({description:"",code:d,modelType:"executable",type:"post"});function h(){const n=t.value.type==="pre"?F:d;if(!t.value.code||t.value.code.trim()===""){t.value.code=n;return}P.warning({title:"确认覆盖",content:"当前编辑区已有代码，插入示例代码将覆盖现有内容，是否继续？",positiveText:"确认",negativeText:"取消",onPositiveClick:()=>{t.value.code=n}})}y(()=>i.initialData,n=>{i.editMode&&n&&(t.value={...n})},{immediate:!0});function C(){v.value?.validate().then(n=>{if(Array.isArray(n)){console.error(n);return}g("submit",t.value),r.value=!1})}const S=k();return y(r,n=>{!n&&!i.editMode&&(t.value={name:"",description:"",code:d})}),(n,e)=>{const E=j;return x(),L("div",null,[r.value?(x(),U(a(V),{key:0,show:r.value,"onUpdate:show":e[5]||(e[5]=l=>r.value=l),preset:"card",style:{width:"700px","max-width":"90vw"}},{default:s(()=>[o(a(D),{title:m.editMode?"编辑处理器":"添加处理器"},{default:s(()=>[o(a(z),{ref_key:"formRef",ref:v,rules:b,model:t.value},{default:s(()=>[o(a(I),{cols:24,"x-gap":12,"y-gap":16,responsive:"screen","item-responsive":""},{default:s(()=>[o(a(u),{span:"24",label:"名称",path:"name"},{default:s(()=>[o(a(_),{value:t.value.name,"onUpdate:value":e[0]||(e[0]=l=>t.value.name=l),placeholder:"请输入处理器名称"},null,8,["value"])]),_:1}),o(a(u),{span:"24",label:"描述",path:"description"},{default:s(()=>[o(a(_),{value:t.value.description,"onUpdate:value":e[1]||(e[1]=l=>t.value.description=l),type:"textarea",placeholder:"请输入处理器描述"},null,8,["value"])]),_:1}),o(a(u),{span:"24",label:"类型",path:"type"},{default:s(()=>[o(E,{value:t.value.type,"onUpdate:value":e[2]||(e[2]=l=>t.value.type=l),options:[{value:"post",label:"后置"},{value:"pre",label:"前置"}],placeholder:"请输入处理器描述"},null,8,["value"])]),_:1}),o(a(u),{span:"24",label:"代码",path:"code"},{label:s(()=>[e[7]||(e[7]=p(" 代码 ")),o(a(c),{quaternary:"",type:"warning",style:{"font-size":"12px"},onClick:h},{default:s(()=>e[6]||(e[6]=[p(" 点击插入示例代码 ")])),_:1})]),default:s(()=>[o(a(M),{style:{width:"100%"},modelValue:t.value.code,"onUpdate:modelValue":e[3]||(e[3]=l=>t.value.code=l),lang:a(S),basic:""},null,8,["modelValue","lang"])]),_:1})]),_:1}),R("div",$,[o(a(q),null,{default:s(()=>[o(a(c),{onClick:e[4]||(e[4]=l=>r.value=!1)},{default:s(()=>e[8]||(e[8]=[p(" 取消 ")])),_:1}),o(a(c),{type:"primary",onClick:C},{default:s(()=>e[9]||(e[9]=[p(" 确定 ")])),_:1})]),_:1})])]),_:1},8,["model"])]),_:1},8,["title"])]),_:1},8,["show"])):T("",!0)])}}});export{H as _};
