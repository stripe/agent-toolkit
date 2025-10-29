import type {Config} from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/provider/tests', '<rootDir>/meter/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePaths: ['<rootDir>/node_modules'],
  collectCoverageFrom: [
    '<rootDir>/provider/**/*.ts',
    '<rootDir>/meter/**/*.ts',
    '!<rootDir>/**/*.d.ts',
    '!<rootDir>/node_modules/**',
    '!<rootDir>/**/tests/**',
    '!<rootDir>/**/examples/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  verbose: true,
  rootDir: '.',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};

export default config;

