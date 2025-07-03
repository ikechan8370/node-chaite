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
    },
    transformIgnorePatterns: [
        // 默认 Jest 会忽略掉所有 node_modules 里的文件
        // 我们需要修改这个默认行为，允许 Jest 转换 @karinjs/node-schedule
        '/node_modules/(?!@karinjs/node-schedule/).+\\.(js|jsx|mjs|cjs|ts|tsx)$'
    ],
    transform: {
        // 遇到 .ts/.tsx 文件，使用 ts-jest 来转换
        '^.+\\.tsx?$': 'ts-jest',

        // 遇到 .js/.jsx 文件，也使用 ts-jest 来转换
        // 这是解决您问题的关键，因为 @karinjs/node-schedule 是 .js 文件
        '^.+\\.jsx?$': 'ts-jest',

        // 有些 ESM 包可能使用 .mjs 后缀，以防万一也加上
        '^.+\\.mjs$': 'ts-jest',
    },
};
