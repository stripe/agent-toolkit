import type {Config} from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePaths: ['<rootDir>/node_modules'],
  collectCoverageFrom: [
    '<rootDir>/*.ts',
    '!<rootDir>/*.d.ts',
    '!<rootDir>/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  verbose: true,
  rootDir: '.',
};

export default config;

