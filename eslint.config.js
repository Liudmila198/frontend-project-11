import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';

export default [
  js.configs.recommended,
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      // ваши правила
    },
    languageOptions: {
      globals: {
        // Браузерные глобальные переменные
        document: 'readonly',
        window: 'readonly',
        DOMParser: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        
        // Node.js глобальные переменные
        process: 'readonly',
        console: 'readonly',
      }
    },
    env: {
      browser: true,    // Добавляет все браузерные глобальные переменные
      node: true,       // Добавляет все Node.js глобальные переменные
    }
  }
];
