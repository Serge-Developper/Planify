import { globalIgnores } from 'eslint/config'
import { vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),
  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    ...pluginVue.configs['flat/essential'],
    ...vueTsConfigs.recommended,
  },
  {
    files: ['src/**/__tests__/*'],
    ...pluginVitest.configs.recommended,
  },
  skipFormatting,
]
