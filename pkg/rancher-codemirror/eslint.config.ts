import { globalIgnores } from 'eslint/config';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import pluginVitest from '@vitest/eslint-plugin';
import pluginOxlint from 'eslint-plugin-oxlint';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}']
  },

  globalIgnores(['**/dist/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  stylistic.configs.customize({
    semi: true,
    quotes: 'single',
    indent: 2,
    commaDangle: 'never'
  }),

  {
    rules: {
      curly: ['error', 'all']
    }
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*']
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json')
);
