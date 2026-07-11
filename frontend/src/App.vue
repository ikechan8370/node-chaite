<script setup lang="ts">
import { naiveI18nOptions } from '@/utils'
import { darkTheme } from 'naive-ui'
import { useAppStore } from './store'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import ProductTour from '@/components/common/ProductTour.vue'

const appStore = useAppStore()

const naiveLocale = computed(() => {
  return naiveI18nOptions[appStore.lang] ? naiveI18nOptions[appStore.lang] : naiveI18nOptions.enUS
},
)

hljs.registerLanguage('javascript', javascript)
// defineExpose({ hljs })
</script>

<template>
  <n-config-provider
    class="wh-full" inline-theme-disabled :theme="appStore.colorMode === 'dark' ? darkTheme : null" :hljs="hljs"
    :locale="naiveLocale.locale" :date-locale="naiveLocale.dateLocale" :theme-overrides="appStore.theme"
  >
    <naive-provider>
      <router-view />
      <Watermark :show-watermark="appStore.showWatermark" />
      <ProductTour />
    </naive-provider>
  </n-config-provider>
</template>
