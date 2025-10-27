import {defineConfig} from 'tsup';

export default defineConfig({
  entry: {
    index: 'index.ts',
    'stripe-provider': 'stripe-provider.ts',
    'stripe-language-model': 'stripe-language-model.ts',
    utils: 'utils.ts',
    types: 'types.ts',
  },
  outDir: 'dist',
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['@ai-sdk/provider', '@ai-sdk/provider-utils', 'stripe', 'zod'],
  platform: 'node',
  target: 'es2022',
  tsconfig: 'tsconfig.build.json',
  outExtension({format}) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    };
  },
});

