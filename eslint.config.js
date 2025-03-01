import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**', 'node_modules/**']  // 忽略dist和node_modules目录下的所有文件
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
];
