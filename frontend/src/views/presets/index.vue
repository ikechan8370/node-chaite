<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import { NButton, NFlex, NGrid, NPopover, NSpace, useMessage } from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'
import IconLinkCloudSuccess from '~icons/icon-park-outline/cloudy'
import type { ListPresets } from '@/service/api/presets'
import { createPreset, deletePreset, fetchAllPresetList, updatePreset } from '@/service/api/presets'
import PresetFormModal from './PresetFormModal.vue'
import PresetModel = Shareable.PresetModel
import { fetchAllProcessorList } from '@/service/api/processors'
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import { fetchAllToolGroupList } from '@/service/api/toolGroup'
import { fetchConfig, saveConfig } from '@/service/api/config'
import { fetchChannelModels } from '@/service/api/channels'

function createColumns({
  edit,
  clone,
  useForBym,
  remove,
}: {
  edit: (row: PresetModel) => void
  clone: (row: PresetModel) => void
  useForBym: (row: PresetModel) => void
  remove: (row: PresetModel) => void
}): DataTableColumns<PresetModel> {
  return [
    {
      title: 'ID',
      key: 'id',
    },
    {
      title: '名称',
      key: 'name',
      render(row: PresetModel) {
        const children = [row.name] as any[]
        if (row.uploader) {
          children.push(h(NPopover, { trigger: 'hover' }, { trigger: () => h(IconLinkCloudSuccess, { style: { color: 'green' } }), default: () => '云端预设' }))
        }
        return h(NFlex, { align: 'center' }, { default: () => children })
      },
    },
    {
      title: '前缀',
      key: 'prefix',
    },
    // {
    //   title: 'namespace',
    //   key: 'namespace',
    // },
    // {
    //   title: '系统提示词',
    //   key: 'sendMessageOption.systemOverride',
    // },
    {
      title: '温度',
      key: 'sendMessageOption.temperature',
    },
    {
      title: '上传者',
      key: 'uploader',
      render(row: PresetModel) {
        return h(NFlex, { align: 'center' }, { default: () => [row.uploader ? (row.uploader?.username || `id (${row.uploader?.user_id})`) : 'N/A'] })
      },
    },
    {
      title: '更新日期',
      key: 'updatedAt',
    },
    {
      title: '创建日期',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'actions',
      render(row: PresetModel) {
        return [
          h(
            NButton,
            {
              type: 'info',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => edit(row),
            },
              { default: () => '修改' },
          ),
          h(NButton, { strong: true, tertiary: true, size: 'small', onClick: () => clone(row) }, { default: () => '复制' }),
          h(NButton, { strong: true, tertiary: true, size: 'small', type: 'success', onClick: () => useForBym(row) }, { default: () => '用于伪人' }),
          h(
            NButton,
            {
              type: 'error',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => remove(row),
            },
            { default: () => '删除' },
          ),
        ]
      },
    },
  ]
}

const message = useMessage()
const data = reactive({ value: [] as PresetModel[] })
const filter = reactive({ value: {} as ListPresets })
const loading = ref(false)
const showModal = ref(false)
const editMode = ref(false)
const defaultPreset = {
  modelType: 'settings',
  name: '',
  embedded: false,
  description: '',
  sendMessageOption: {
    systemOverride: '',
    temperature: 0.6,
    model: '',
  },
  prefix: '',
  channelId: '',
  local: true,
} as PresetModel
const currentPreset = ref<PresetModel>(JSON.parse(JSON.stringify(defaultPreset)) as PresetModel)

// 处理器选项 - 这里用空数据，后续会通过API获取
const preProcessorOptions = ref([] as SelectMixedOption[])
const postProcessorOptions = ref([] as SelectMixedOption[])
const toolsOptions = ref([] as SelectMixedOption[])
const modelOptions = ref([] as SelectMixedOption[])

// 搜索相关
const searchModel = reactive({
  name: undefined,
  prompt: '',
} as ListPresets)

function fetchPresets(filter: ListPresets) {
  loading.value = true
  fetchAllPresetList(filter).then((items) => {
    data.value = items
    loading.value = false
  }).catch((err) => {
    console.error(err)
    loading.value = false
  })
}

function handleResetSearch() {
  searchModel.name = undefined
  searchModel.prompt = ''
  fetchPresets(searchModel)
}

function handleAddPreset() {
  editMode.value = false
  currentPreset.value = JSON.parse(JSON.stringify(defaultPreset)) as PresetModel
  showModal.value = true
}

function handleEditPreset(row: PresetModel) {
  editMode.value = true
  console.error(row)
  currentPreset.value = { ...row }
  showModal.value = true
}

function handleClonePreset(row: PresetModel) {
  editMode.value = false
  const copy = JSON.parse(JSON.stringify(row)) as PresetModel
  delete copy.id
  copy.name = `${row.name} 副本`
  currentPreset.value = copy
  showModal.value = true
}

async function handleUseForBym(row: PresetModel) {
  const rsp = await fetchConfig()
  if (rsp.code !== 0) { message.error(rsp.message || '配置读取失败'); return }
  const config: any = rsp.data
  config.bym = { ...(config.bym || {}), enable: true, defaultPreset: row.id }
  const saved = await saveConfig(config)
  if (saved.code === 0) message.success(`已启用伪人模式并使用“${row.name}”`)
  else message.error(saved.message || '配置保存失败')
}

function handleRemovePreset(row: PresetModel) {
  window.$dialog.warning({
    title: '确认删除',
    content: `确定要删除预设 "${row.name}" 吗？此操作不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: () => {
      loading.value = true
      // 假设这里是后端 API 调用，需要实际添加 API 函数
      deletePreset(row.id as string)
        .then((res) => {
          if (res.code === 0) {
            message.success('删除成功')
            fetchPresets(searchModel) // 刷新列表
          }
          else {
            message.error(res.message || '删除失败')
          }
        })
        .catch((err) => {
          message.error(err.message || '删除操作发生错误')
        })
        .finally(() => {
          loading.value = false
        })
    },
  })
}

function handleSubmitPreset(presetData: Partial<Shareable.PresetModel>) {
  loading.value = true
  const action = editMode.value && presetData.id
    ? updatePreset(presetData.id, presetData)
    : createPreset(presetData as PresetModel)
  action.then((res) => {
    if (res.code === 0) {
      message.success(editMode.value ? '更新成功' : '创建成功')
      fetchPresets(searchModel)
    }
    else {
      message.error(res.message || '操作失败')
    }
    loading.value = false
    showModal.value = false
  }).catch((err) => {
    message.error(err.message || '操作失败')
    loading.value = false
  })
}

const columns = createColumns({
  edit(row) {
    handleEditPreset(row)
  },
  clone(row) {
    handleClonePreset(row)
  },
  useForBym(row) {
    handleUseForBym(row)
  },
  remove(row) {
    handleRemovePreset(row)
  },
})

async function getProcessors() {
  try {
    const processors = await fetchAllProcessorList()
    preProcessorOptions.value = processors.filter(p => p.type === 'pre').map((pre) => {
      return {
        label: pre.name,
        value: pre.id,
      }
    })
    postProcessorOptions.value = processors.filter(p => p.type === 'post').map((post) => {
      return {
        label: post.name,
        value: post.id,
      }
    })
  }
  catch (err) {
    console.error(err)
  }
}

// async function getTools() {
//   try {
//     const res = await fetchToolList({})
//     toolsOptions.value = res.data.map((tool) => {
//       return {
//         label: tool.name,
//         value: tool.id,
//       }
//     })
//   }
//   catch (err) {
//     console.error(err)
//   }
// }

function fetchToolGroups(filter?: any) {
  fetchAllToolGroupList(filter).then((items) => {
    toolsOptions.value = items.map((tool) => {
      return {
        label: tool.name,
        value: tool.id,
      }
    })
  })
}

async function getChannelModels() {
  try {
    const res = await fetchChannelModels()
    modelOptions.value = res.data.map(model => ({
      value: model.name,
      label: `${model.name}（${model.channelCount} 个渠道）`,
    }))
  }
  catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  fetchPresets(filter.value)
  getProcessors()
  // getTools()
  fetchToolGroups()
  getChannelModels()
})
</script>

<template>
  <div class="chaite-page">
    <header class="chaite-page-header" data-tour="presets">
      <div><h1>预设库</h1><p>搜索、整理和维护群聊角色与对话行为。</p></div>
      <NButton type="primary" size="large" @click="handleAddPreset"><template #icon><icon-park-outline-add-one /></template>创建预设</NButton>
    </header>
    <NSpace vertical size="large">
      <n-card class="chaite-panel" :bordered="false">
        <n-form ref="formRef" :model="searchModel" label-placement="left" inline :show-feedback="false">
          <NGrid cols="1 s:2 m:3 l:4" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
            <NFormItemGridItem span="1" label="名称" path="name">
              <n-input v-model:value="searchModel.name" placeholder="请输入要搜索的名称关键词" />
            </NFormItemGridItem>
            <NFormItemGridItem span="1" label="模型" path="model">
              <n-input v-model:value="searchModel.prompt" placeholder="请输入要搜索的设定内容" />
            </NFormItemGridItem>
            <NGridItem span="1">
              <NFlex class="ml-auto">
                <NButton type="primary" @click="fetchPresets(searchModel)">
                  <template #icon>
                    <icon-park-outline-search />
                  </template>
                  搜索
                </NButton>
                <NButton strong secondary @click="handleResetSearch">
                  <template #icon>
                    <icon-park-outline-redo />
                  </template>
                  重置
                </NButton>
              </NFlex>
            </NGridItem>
          </NGrid>
        </n-form>
      </n-card>
      <n-card class="chaite-panel" :bordered="false">
        <NSpace vertical size="large">
          <div class="flex gap-4">
            <NButton type="primary" @click="handleAddPreset">
              <template #icon>
                <icon-park-outline-add-one />
              </template>
              新建预设
            </NButton>
          </div>
          <n-data-table :columns="columns" :data="data.value" :loading="loading" :pagination="{ pageSize: 20, showSizePicker: true, pageSizes: [20, 50, 100] }" />
        </NSpace>
      </n-card>
    </NSpace>

    <!-- Use the extracted PresetFormModal component -->
    <PresetFormModal
      v-model:show="showModal"
      :edit-mode="editMode"
      :initial-data="currentPreset"
      :pre-processor-options="preProcessorOptions"
      :post-processor-options="postProcessorOptions"
      :tools-options="toolsOptions"
      :model-options="modelOptions"
      @submit="handleSubmitPreset"
    />
  </div>
</template>

<style scoped>
.ml-auto {
  margin-left: auto;
}
.flex {
  display: flex;
}
.gap-4 {
  gap: 1rem;
}
</style>
