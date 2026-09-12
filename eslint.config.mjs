import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: [
      'dist/**', 'node_modules/**', '**/*.test.ts', 'frontend/**/*', 'tsdown.config.ts',
      // 以下都不是 TS 源码：构建脚本、CJS 配置、测试替身，以及 prebuild 生成的
      // version.ts。它们跑的是 Node CJS/脚本环境，按 TS 源码的规则去检只会得到
      // 一堆和代码质量无关的 no-undef
      'scripts/**', '**/*.cjs', 'test/**', 'src/version.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      "no-unused-vars": 0,
      "@typescript-eslint/no-unused-vars": 0,
      // TS 编译器本身就会报未定义变量，而且它认得 lib/@types 里的全局声明。
      // eslint 的 no-undef 在 TS 上只会误报（console/process 之类），
      // typescript-eslint 官方也建议关掉。
      'no-undef': 0,
      // 控制大括号内容前后有空格
      'object-curly-spacing': ['error', 'always'],

      // 不使用分号≤
      'semi': ['error', 'never'],

      // 使用单引号
      'quotes': ['error', 'single'],

      // 其他常用规则
      'comma-dangle': ['error', 'always-multiline'], // 多行对象/数组最后一项加逗号
      'indent': ['error', 2], // 缩进2个空格
      'arrow-parens': ['error', 'as-needed'], // 箭头函数参数仅在必要时加括号
    },
  }
]
