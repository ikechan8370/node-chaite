/**
 * 测试用的 @karinjs/node-schedule 替身。
 *
 * 那个包只发 ESM（dist/index.mjs），而 jest 在 CJS 模式下无法加载 .mjs——
 * 不管 transform 怎么配都一样，因为 jest 是按扩展名决定模块系统的。
 * 真要修得用 --experimental-vm-modules 把整个测试套件切到 ESM，那是另一件事。
 *
 * types/trigger.ts 在模块顶层 import 了它，于是任何 import 到 types 桶文件的
 * 测试都会被牵连——包括完全用不到定时任务的存储层测试。这里给个最小替身，
 * 真正要测调度行为时再换成完整实现。
 */
class Job {
  constructor (name) {
    this.name = name
  }

  cancel () {
    return true
  }
}

module.exports = {
  __esModule: true,
  default: {
    scheduleJob: () => new Job('stub'),
    cancelJob: () => true,
    gracefulShutdown: async () => {},
  },
  Job,
  scheduleJob: () => new Job('stub'),
  cancelJob: () => true,
  gracefulShutdown: async () => {},
}
