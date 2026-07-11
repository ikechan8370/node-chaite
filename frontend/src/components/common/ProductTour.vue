<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const TOUR_KEY = 'chaite-console-tour-v1-completed'
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const active = ref(false)
const index = ref(0)
const rect = ref<DOMRect | null>(null)
const viewport = ref({ width: 0, height: 0 })
const steps = [
  { route: '/dashboard', target: '[data-tour="dashboard"]', title: '欢迎来到 Chaite Console', body: '这里是驾驶台：先看渠道可用率、调用量和近期异常。' },
  { route: '/quick-setup', target: '[data-tour="quick-setup"]', title: '最快接入一个新模型', body: '拿到 API 地址、Key 和模型名后，在这里完成渠道创建、测试、预设创建，并可直接应用到默认对话或伪人。' },
  { route: '/channels', target: '[data-tour="channels"]', title: '管理渠道池', body: '渠道支持搜索、复制、批量测试和批量启停。渠道列表里的“创建预设”可继续完成配置。' },
  { route: '/chat-preset', target: '[data-tour="presets"]', title: '组织预设', body: '预设决定人格、模型参数、工具与上下文，也可以一键设为伪人默认预设。' },
  { route: '/tools', target: '[data-tour="tools"]', title: '测试工具与处理器', body: '工具和处理器都有真实运行时测试台。先验证，再交给群聊使用。' },
  { route: '/logs', target: '[data-tour="logs"]', title: '查看使用记录', body: '按群、用户、渠道、模型和预设检索调用、Token、工具与处理器执行情况。' },
]
function updateRect() { viewport.value = { width: window.innerWidth, height: window.innerHeight }; const target = document.querySelector(steps[index.value].target); rect.value = target instanceof HTMLElement ? target.getBoundingClientRect() : null }
async function goTo(next: number) { index.value = next; if (route.path !== steps[next].route) await router.push(steps[next].route); await nextTick(); window.setTimeout(updateRect, 80) }
async function start() { if (!auth.isLogin) return; active.value = true; await goTo(0) }
async function close(done = false) { if (done) { window.localStorage.setItem(TOUR_KEY, '1'); if (route.path !== '/dashboard') await router.push('/dashboard') }; active.value = false; rect.value = null }
function next() { if (index.value >= steps.length - 1) void close(true); else void goTo(index.value + 1) }
function previous() { if (index.value > 0) goTo(index.value - 1) }
function onRestart() { window.localStorage.removeItem(TOUR_KEY); start() }
onMounted(() => { updateRect(); window.addEventListener('resize', updateRect); window.addEventListener('scroll', updateRect, true); window.addEventListener('chaite:start-tour', onRestart); window.setTimeout(() => { if (auth.isLogin && !window.localStorage.getItem(TOUR_KEY)) start() }, 500) })
onBeforeUnmount(() => { window.removeEventListener('resize', updateRect); window.removeEventListener('scroll', updateRect, true); window.removeEventListener('chaite:start-tour', onRestart) })
watch(() => route.path, () => window.setTimeout(updateRect, 40))
</script>
<template>
  <Teleport to="body"><div v-if="active" class="tour-root" role="dialog" aria-modal="true"><div v-if="rect" class="tour-hole" :style="{ left: `${Math.max(8, rect.left - 8)}px`, top: `${Math.max(8, rect.top - 8)}px`, width: `${Math.min(viewport.width - 16, rect.width + 16)}px`, height: `${Math.min(viewport.height - 16, rect.height + 16)}px` }" /><div class="tour-card" :class="{ centered: !rect }" :style="rect ? { left: `${Math.min(Math.max(16, rect.left), viewport.width - 380)}px`, top: `${Math.min(Math.max(16, rect.bottom + 20), viewport.height - 245)}px` } : {}"><div class="tour-count">{{ index + 1 }} / {{ steps.length }}</div><h2>{{ steps[index].title }}</h2><p>{{ steps[index].body }}</p><a v-if="index === steps.length - 1" class="tour-docs" href="https://docs.chaite.cloud/" target="_blank" rel="noopener noreferrer">打开 Chaite 使用文档 ↗</a><div class="tour-actions"><button class="ghost" @click="close(true)">跳过引导</button><span /><button v-if="index > 0" class="ghost" @click="previous">上一步</button><button class="primary" @click="next">{{ index === steps.length - 1 ? '开始使用' : '下一步' }}</button></div></div></div></Teleport>
</template>
<style scoped>
.tour-root{position:fixed;inset:0;z-index:10000;pointer-events:none}.tour-root::before{content:'';position:fixed;inset:0;background:rgba(7,11,24,.62);pointer-events:auto}.tour-hole{position:fixed;border:2px solid #8b7dff;border-radius:14px;box-shadow:0 0 0 9999px rgba(7,11,24,.05),0 0 0 5px rgba(139,125,255,.22);pointer-events:none;transition:all .3s ease}.tour-card{position:fixed;z-index:1;width:min(360px,calc(100vw - 32px));padding:22px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:#171d31;color:#f7f8ff;box-shadow:0 22px 70px rgba(0,0,0,.38);pointer-events:auto}.tour-card.centered{left:50%;top:50%;transform:translate(-50%,-50%)}.tour-count{color:#a99fff;font-size:12px;font-weight:700}.tour-card h2{margin:9px 0;font-size:20px}.tour-card p{margin:0;color:#c6cbe0;line-height:1.65;font-size:14px}.tour-docs{display:inline-block;margin-top:12px;color:#b8b0ff;font-size:13px;text-decoration:none}.tour-docs:hover{text-decoration:underline}.tour-actions{display:flex;align-items:center;gap:8px;margin-top:20px}.tour-actions span{flex:1}.tour-actions button{border:0;border-radius:9px;padding:8px 11px;cursor:pointer}.ghost{color:#c6cbe0;background:transparent}.primary{color:white;background:#6d5dfc}@media(max-width:560px){.tour-card{left:16px!important;right:16px;width:auto;top:auto!important;bottom:16px;transform:none!important}}
</style>
