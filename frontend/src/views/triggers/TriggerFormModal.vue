<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { NButton, NCard, NForm, NFormItemGridItem, NGrid, NInput, NModal, NSelect, NSpace, NSwitch, useDialog } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import type { Shareable } from '@/typings/entities/shareable'
import CodeMirror from 'vue-codemirror6'
import type { LanguageSupport } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'

const props = defineProps({
  show: Boolean,
  editMode: Boolean,
  initialData: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:show', 'submit'])

const formRef = ref<FormInst | null>(null)
const lang: LanguageSupport = javascript()
const dialog = useDialog()

const showModal = computed({
  get: () => props.show,
  set: value => emit('update:show', value),
})

const triggerExampleCode = `// 触发器示例代码
export default {
  // 触发条件
  condition(ctx) {
    // 返回 true 表示触发，false 表示不触发
    return true
  },

  // 触发动作
  action(ctx) {
    // 在这里编写触发后的动作
    console.log('触发器已执行')
    return true
  }
}`

const formData = ref<Shareable.TriggerModel>({
  modelType: 'settings',
  name: '',
  code: triggerExampleCode,
  description: '',
  embedded: false,
  status: 'enabled',
  isOneTime: false,
})

const formTitle = computed(() => {
  return props.editMode ? '修改触发器' : '新建触发器'
})

const triggerRules = {
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入名称',
  },
  code: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入触发器代码',
  },
  status: {
    required: true,
    trigger: ['blur', 'change'],
    message: '请选择状态',
  },
}

function handleInsertExampleCode() {
  // If code field is empty, insert directly
  if (!formData.value.code || formData.value.code.trim() === '') {
    formData.value.code = triggerExampleCode
    return
  }

  // If code exists, show confirmation dialog
  dialog.warning({
    title: '确认覆盖',
    content: '当前编辑区已有代码，插入示例代码将覆盖现有内容，是否继续？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: () => {
      formData.value.code = triggerExampleCode
    },
  })
}

// Initialize form when props change
watch(() => props.initialData, (newVal) => {
  if (props.show && newVal) {
    formData.value = { ...newVal } as Shareable.TriggerModel
  }
}, { immediate: true })

function handleSubmit() {
  formRef.value?.validate().then((errors) => {
    if (Array.isArray(errors)) {
      console.error(errors)
      return
    }
    emit('submit', formData.value)
  })
}

// Reset form when modal is closed
watch(showModal, (val) => {
  if (!val && !props.editMode) {
    formData.value = {
      modelType: 'settings',
      name: '',
      code: triggerExampleCode,
      description: '',
      embedded: false,
      status: 'enabled',
      isOneTime: false,
    }
  }
})
</script>

<template>
  <NModal v-if="showModal" v-model:show="showModal" preset="card" style="width: 800px; max-width: 90vw">
    <NCard :title="formTitle">
      <NForm
        ref="formRef"
        :model="formData"
        :rules="triggerRules"
      >
        <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
          <!-- 触发器名称 -->
          <NFormItemGridItem span="24" label="名称" path="name">
            <NInput v-model:value="formData.name" placeholder="请输入触发器名称" />
          </NFormItemGridItem>

          <!-- 触发器描述 -->
          <NFormItemGridItem span="24" label="描述" path="description">
            <NInput
              v-model:value="formData.description"
              type="textarea"
              placeholder="请输入触发器描述"
            />
          </NFormItemGridItem>

          <!-- 触发器状态 -->
          <NFormItemGridItem span="12" label="状态" path="status">
            <NSelect
              v-model:value="formData.status"
              :options="[
                { label: '启用', value: 'enabled' },
                { label: '禁用', value: 'disabled' },
              ]"
            />
          </NFormItemGridItem>

          <!-- 一次性触发 -->
          <NFormItemGridItem span="12" label="一次性触发" path="isOneTime">
            <NSwitch v-model:value="formData.isOneTime">
              <template #checked>
                是
              </template>
              <template #unchecked>
                否
              </template>
            </NSwitch>
          </NFormItemGridItem>

          <!-- 代码编辑器 -->
          <NFormItemGridItem span="24" label="代码" path="code">
            <CodeMirror
              v-model="formData.code"
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
            <NButton type="primary" @click="handleSubmit">
              {{ props.editMode ? '保存修改' : '创建' }}
            </NButton>
          </NSpace>
        </div>
      </NForm>
    </NCard>
  </NModal>
</template>
