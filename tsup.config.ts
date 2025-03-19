import { defineConfig } from 'tsup'
import { builtinModules } from 'node:module'
import type { Options } from 'tsup'

/**
 * @description `tsup` configuration options
 */
export const options: Options = {
  entry: ['src/index.ts'], // 入口文件
  format: ['cjs'], // 输出格式
  target: 'node18', // 目标环境
  splitting: false, // 是否拆分文件
  sourcemap: false, // 是否生成 sourcemap
  clean: false, // 是否清理输出目录
  dts: {
    resolve: true,
    compilerOptions: {
      removeComments: false, // 是否删除注释
      noUnusedLocals: false, // 是否删除未使用的局部变量
      noUnusedParameters: false, // 是否删除未使用的参数
      preserveConstEnums: true, // 是否保留常量枚举
      stripInternal: false, // 是否删除内部注释
      skipLibCheck: true, // 是否跳过库检查
      preserveSymlinks: false, // 是否保留符号链接
    }
  }, // 是否生成 .d.ts 文件
  outDir: 'dist', // 输出目录
  treeshake: true, // 树摇优化
  minify: false, // 压缩代码
  ignoreWatch: [],
  shims: false,
  external: [...builtinModules, ...builtinModules.map((node) => `node:${node}`)],
}

export default defineConfig(options)
