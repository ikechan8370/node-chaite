/**
 * 测试用的 src/__dirname.ts 替身。
 *
 * 原文件用 import.meta.url 推导 __dirname，而 jest 跑在 CJS 下、
 * ts-jest 以 module=commonjs 编译，import.meta 在这种组合下无法编译
 * （TS1343）。CJS 里本来就有 __dirname，直接用即可。
 */
module.exports = { __dirname: __dirname }
