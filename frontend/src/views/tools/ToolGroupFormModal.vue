<!-- ToolGroupFormModal.vue -->
<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { type FormInst, NForm, NFormItem, NInput, NTransfer } from 'naive-ui'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  editMode: {
    type: Boolean,
    default: false,
  },
  initialData: {
    type: Object,
    required: true,
  },
  availableTools: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:show', 'submit'])

const formRef: Ref<FormInst | null> = ref(null)
const formData = ref({} as Shareable.ToolsGroupModel)

// Transfer options
const transferOptions = computed(() => {
  return props.availableTools.map(tool => ({
    // tool = tool as Shareable.ToolModel,
    label: tool.name,
    value: tool.id,
    disabled: false,
    description: tool.description,
  }))
})

watch(
  () => props.initialData,
  (val) => {
    formData.value = JSON.parse(JSON.stringify(val))
  },
  { immediate: true, deep: true },
)

watch(
  () => props.show,
  (val) => {
    if (!val) {
      formData.value = JSON.parse(JSON.stringify(props.initialData))
    }
  },
)

function handleSubmit() {
  formRef.value?.validate((errors: any) => {
    if (!errors) {
      emit('submit', formData.value)
    }
  })
}
const showModal = computed({
  get: () => props.show,
  set: value => emit('update:show', value),
})
function handleClose() {
  emit('update:show', false)
}
</script>

<template>
  <n-modal
    v-if="showModal"
    v-model:show="showModal"
    :title="editMode ? '编辑工具组' : '新建工具组'"
    preset="card"
    :style="{ width: '60vw' }"
    :mask-closable="false"
  >
    <NForm
      ref="formRef"
      :model="formData"
      label-placement="left"
      label-width="80"
      require-mark-placement="right-hanging"
    >
      <NFormItem label="组名称" path="name" :rule="{ required: true, message: '请输入工具组名称' }">
        <NInput v-model:value="formData.name" placeholder="请输入工具组名称" />
      </NFormItem>

      <NFormItem label="描述" path="description">
        <NInput
          v-model:value="formData.description"
          type="textarea"
          placeholder="请输入工具组描述"
          :autosize="{ minRows: 3, maxRows: 5 }"
        />
      </NFormItem>

      <NFormItem label="关联工具" path="toolIds">
        <NTransfer
          v-model:value="formData.toolIds"
          :options="transferOptions"
          filterable
          source-title="可选工具"
          target-title="已选工具"
          size="large"
        />
      </NFormItem>

      <div class="flex justify-end mt-4 gap-2">
        <n-button @click="handleClose">
          取消
        </n-button>
        <n-button type="primary" @click="handleSubmit">
          {{ editMode ? '保存修改' : '创建工具组' }}
        </n-button>
      </div>
    </NForm>
  </n-modal>
</template>
