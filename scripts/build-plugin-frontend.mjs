import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pluginDir = path.resolve(
  process.argv[2] ||
  process.env.CHAITE_PLUGIN_DIR ||
  path.join(projectDir, '..', 'Yunzai', 'plugins', 'chatgpt-plugin'),
)
const manifestPath = path.join(pluginDir, 'package.json')
if (!fs.existsSync(manifestPath) || JSON.parse(fs.readFileSync(manifestPath, 'utf8')).name !== 'chatgpt-plugin') {
  console.error(`chatgpt-plugin not found at ${pluginDir}. Pass its path as the first argument or set CHAITE_PLUGIN_DIR.`)
  process.exit(1)
}

const frontendDir = path.join(projectDir, 'frontend')
const outDir = path.join(pluginDir, 'resources', 'admin')
const pnpmArgs = [
  '--dir', frontendDir,
  'exec', 'vite', 'build',
  '--mode', 'prod',
  '--outDir', outDir,
  '--emptyOutDir',
]
const pnpmCli = process.env.npm_execpath
const command = pnpmCli ? process.execPath : 'pnpm'
const args = pnpmCli ? [pnpmCli, ...pnpmArgs] : pnpmArgs
const result = spawnSync(command, args, { stdio: 'inherit' })

if (result.error) {
  console.error(result.error)
  process.exit(1)
}
process.exit(result.status ?? 1)
