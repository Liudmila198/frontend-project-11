import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';

export default [
  js.configs.recommended,
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/indent': ['error', 2], 
      '@stylistic/brace-style': ['error', '1tbs'],
    },
    languageOptions: {
      globals: {
      ...globals.browser,
        ...globals.node,
      }
    },
  }
];
