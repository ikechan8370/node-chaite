import path from 'node:path'
import { defineConfig } from 'tsdown/config'

const getPackageName = (filePath: string): string | null => {
  // 格式化为绝对路径
  const absPath = path.resolve(filePath).replace(/\\/g, '/')

  const idx = absPath.lastIndexOf('node_modules/')
  if (idx === -1) return null

  const suffix = absPath.slice(idx + 13)
  const parts = suffix.split('/').filter(Boolean)

  if (parts.length === 0) return null

  // 组织包 (@scope/package)
  if (parts[0].startsWith('@')) {
    return parts.length > 1 ? `${parts[0]}/${parts[1]}` : null
  }

  // 普通包
  return parts[0]
}

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/__dirname.ts'
  ],
  outExtensions: (context) => {
    if (context.format === 'es') {
      return {
        js: '.mjs',
        dts: '.d.ts',
      }
    }

    return { js: '.js', dts: '.d.ts' }
  },
  dts: true,
  format: ['esm'],
  shims: true,
  target: 'node20',
  platform: 'node',
  sourcemap: false,
  clean: true,
  treeshake: true,
  outputOptions (outputOptions) {
    outputOptions.advancedChunks = {
      groups: [
        {
          name (id: string) {
            if (id.includes('node_modules')) {
              return `chunks/${getPackageName(id)}/index.mjs`
            }
            // 返回 null 表示不干预该模块的分块决定
            return null
          },
        },
      ],
    }
    return outputOptions
  },
})
