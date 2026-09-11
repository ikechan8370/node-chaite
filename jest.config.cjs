// jest.config.js
module.exports = {
    // 直接使用 ts-jest 的默认预设，它对大部分 TS 项目都适用
    preset: 'ts-jest',
    // 测试环境依然是 node
    testEnvironment: 'node',
    moduleNameMapper: {
        // 这条规则是关键，它使用了正则表达式
        // ^src/(.*)$         : 匹配所有以 'src/' 开头的导入路径
        // <rootDir>/src/$1   : 将它替换成一个完整的物理路径
        '^src/(.*)$': '<rootDir>/src/$1',

        // @karinjs/node-schedule 只发 ESM，jest 在 CJS 模式下加载不了 .mjs。
        // types/trigger.ts 在顶层 import 它，于是所有 import 到 types 桶文件的
        // 测试都会被连累。测试里换成最小替身，见该文件里的说明。
        '^@karinjs/node-schedule$': '<rootDir>/test/stubs/node-schedule.cjs',

        // src/__dirname.ts 用 import.meta.url 推导路径，在 CJS 下编译不了。
        // CJS 本身就有 __dirname，测试里换成等价实现。
        '^(.*)/__dirname$': '<rootDir>/test/stubs/dirname.cjs',
    },
    transformIgnorePatterns: [
        // 默认 Jest 会忽略掉所有 node_modules 里的文件
        // 我们需要修改这个默认行为，允许 Jest 转换 @karinjs/node-schedule
        //
        // 这里不能只写 (?!@karinjs/node-schedule/)：pnpm 的真实路径是
        // node_modules/.pnpm/@karinjs+node-schedule@x.y.z/node_modules/@karinjs/node-schedule/…，
        // 否定环视卡在第一个 node_modules/ 后面，看到的是 .pnpm/ 而不是包名，
        // 于是这个包又被排除掉了。改成匹配整条路径里是否出现过这个包名，
        // npm/yarn 的扁平布局和 pnpm 的嵌套布局都能覆盖。
        '/node_modules/(?!.*@karinjs[+/]node-schedule).+\\.(js|jsx|mjs|cjs|ts|tsx)$'
    ],
    transform: {
        // 遇到 .ts/.tsx 文件，使用 ts-jest 来转换
        '^.+\\.tsx?$': 'ts-jest',

        // .js/.jsx/.mjs 也交给 ts-jest：@karinjs/node-schedule 发的是 ESM。
        // 必须显式打开 allowJs，否则 ts-jest 会直接把这些文件原样放过去，
        // 结果就是在 CJS 环境里执行到 import 语句而报
        // "Cannot use import statement outside a module"。
        // 只在测试里开，不动 tsconfig.json，免得影响构建。
        // module 也要显式写成 commonjs：项目 tsconfig 是 ES2022，而 jest 这里
        // 跑的是 CJS，一旦传了内联 tsconfig，ts-jest 就不再自动改写 module 了。
        '^.+\\.(jsx?|mjs)$': ['ts-jest', { tsconfig: { allowJs: true, module: 'commonjs' } }],
    },
};
