<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NCard, NForm, NFormItemGridItem, NGrid, NInput, NModal, NSpace, useDialog } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import CodeMirror from 'vue-codemirror6'
import type { LanguageSupport } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'

const props = defineProps({
  show: Boolean,
  editMode: Boolean,
  initialData: {
    type: Object,
    default: () => ({
      description: '',
      // eslint-disable-next-line ts/no-use-before-define
      code: postProcessorExampleCode,
      modelType: 'executable',
      type: 'post',
    }),
  },
})

const emit = defineEmits(['update:show', 'submit'])

const preProcessorExampleCode = 'import { asyncLocalStorage, PreProcessor } from \'chaite\'\n'
  + '\n'
  + 'export class ExamplePreProcessor extends PreProcessor {\n'
  + '  name = \'example\'\n'
  + '\n'
  + '  /**\n'
  + '   * 处理逻辑\n'
  + '   * 可以通过`asyncLocalStorage.getStore().getEvent()`获取e实例\n'
  + '   * @param {import(\'chaite\').UserMessage} message\n'
  + '   * @returns {Promise<import(\'chaite\').UserMessage>}\n'
  + '   */\n'
  + '  async process (message) {\n'
  + '    const context = (/** @type {AsyncLocalStorage<import(\'chaite\').ChaiteContext>} **/asyncLocalStorage).getStore()\n'
  + '    const e = context.getEvent()\n'
  + '    await e.reply(\'处理一下\' + e.sender.nickname + \'的问题\')\n'
  + '    message.content.forEach((item) => {\n'
  + '      item.text = item.text.replace(/<|>/g, \'\')\n'
  + '    })\n'
  + '    return message\n'
  + '  }\n'
  + '}\n'

const postProcessorExampleCode = 'import { asyncLocalStorage, PostProcessor } from \'chaite\'\n'
  + '\n'
  + 'export class ExamplePostProcessor extends PostProcessor {\n'
  + '  name = \'example\'\n'
  + '\n'
  + '  /**\n'
  + '   * 处理逻辑\n'
  + '   * 可以通过`asyncLocalStorage.getStore().getEvent()`获取e实例\n'
  + '   * @param {import(\'chaite\').AssistantMessage} message\n'
  + '   * @returns {Promise<import(\'chaite\').AssistantMessage>}\n'
  + '   */\n'
  + '  async process (message) {\n'
  + '    const context = (/** @type {AsyncLocalStorage<import(\'chaite\').ChaiteContext>} **/asyncLocalStorage).getStore()\n'
  + '    const e = context.getEvent()\n'
  + '    await e.reply(\'处理一下AI对\' + e.sender.nickname + \'的回复\')\n'
  + '    const rawResponse = message.content[0].text\n'
  + '    message.content[0].text = rawResponse.replace(/<|>/g, \'\')\n'
  + '    return message\n'
  + '  }\n'
  + '}\n'

const dialog = useDialog()

const formRef = ref<FormInst | null>()

const showModal = computed({
  get: () => props.show,
  set: value => emit('update:show', value),
})

const toolRules = {
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入处理器名称',
  },
  description: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入处理器描述',
  },
  code: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入处理器代码',
  },
}

// Form data
const addTool = ref<Partial<Shareable.ProcessorModel>>({
  description: '',
  code: postProcessorExampleCode,
  modelType: 'executable',
  type: 'post',
})

function handleInsertExampleCode() {
  const exampleCode = addTool.value.type === 'pre' ? preProcessorExampleCode : postProcessorExampleCode

  // If code field is empty, insert directly
  if (!addTool.value.code || addTool.value.code.trim() === '') {
    addTool.value.code = exampleCode
    return
  }

  // If code exists, show confirmation dialog
  dialog.warning({
    title: '确认覆盖',
    content: '当前编辑区已有代码，插入示例代码将覆盖现有内容，是否继续？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: () => {
      addTool.value.code = exampleCode
    },
  })
}

// Initialize form when in edit mode
watch(() => props.initialData, (newVal) => {
  if (props.editMode && newVal) {
    addTool.value = { ...newVal }
  }
}, { immediate: true })

// Methods
function handleAddChannel() {
  formRef.value?.validate().then((errors) => {
    if (Array.isArray(errors)) {
      console.error(errors)
      return
    }
    emit('submit', addTool.value)
    showModal.value = false
  })
}
const lang: LanguageSupport = javascript()

// Reset form when modal is closed
watch(showModal, (val) => {
  if (!val && !props.editMode) {
    addTool.value = {
      name: '',
      description: '',
      code: postProcessorExampleCode,
    }
  }
})
</script>

<template>
  <div>
    <NModal v-if="showModal" v-model:show="showModal" preset="card" style="width: 700px; max-width: 90vw">
      <NCard :title="editMode ? '编辑处理器' : '添加处理器'">
        <NForm ref="formRef" :rules="toolRules" :model="addTool">
          <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
            <!-- 处理器名称 -->
            <NFormItemGridItem span="24" label="名称" path="name">
              <NInput v-model:value="addTool.name" placeholder="请输入处理器名称" />
            </NFormItemGridItem>
            <!-- 处理器描述 -->
            <NFormItemGridItem span="24" label="描述" path="description">
              <NInput v-model:value="addTool.description" type="textarea" placeholder="请输入处理器描述" />
            </NFormItemGridItem>
            <!-- 处理器类型 -->
            <NFormItemGridItem span="24" label="类型" path="type">
              <NSelect v-model:value="addTool.type" :options="[{ value: 'post', label: '后置' }, { value: 'pre', label: '前置' }]" placeholder="请输入处理器描述" />
            </NFormItemGridItem>

            <!-- 代码编辑器 -->
            <NFormItemGridItem span="24" label="代码" path="code">
              <CodeMirror
                v-model="addTool.code"
                style="width: 100%"
                :lang="lang"
                basic
              />
              <template #label>
                代码
                <NButton quaternary type="warning" style="font-size: 12px" @click="handleInsertExampleCode">
                  点击插入示例代码
                </NButton>
              </template>
            </NFormItemGridItem>
          </NGrid>

          <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
            <NSpace>
              <NButton @click="showModal = false">
                取消
              </NButton>
              <NButton type="primary" @click="handleAddChannel">
                确定
              </NButton>
            </NSpace>
          </div>
        </NForm>
      </NCard>
    </NModal>
  </div>
</template>

<style scoped>

</style>
