// jest.config.mts
import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
    ...createDefaultEsmPreset({
        tsconfig: './tsconfig.json',
    }),
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    moduleDirectories: ['node_modules', 'src'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/']
}

export default jestConfig