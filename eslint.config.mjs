import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist', 'front', '__tests__', '*.config.{js,mjs,cjs,ts}'],
  },
  {
    rules: {
      indent: ['warn', 2],
      "no-console": "off",
      'no-unused-vars': 'warn',
      "no-debugger": "warn",
      "@typescript-eslint/no-explicit-any": ["warn"],
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "max-len": ["warn", { code: 120 }],  
    },
  },
];