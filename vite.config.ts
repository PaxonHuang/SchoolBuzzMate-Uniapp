import { defineConfig, loadEnv } from 'vite'
import Uni from '@uni-helper/plugin-uni'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
import UniManifest from '@uni-helper/vite-plugin-uni-manifest'
import Components from '@uni-helper/vite-plugin-uni-components'
import { WotResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import unicloudInitPlugin from './vite-plugin-unicloud-init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, 'env'))

  return {
    envDir: './env',
    plugins: [
      UniLayouts(),
      UniManifest(),
      UniPages({
        exclude: ['**/components/**/**.*'],
        subPackages: ['src/pages-core'],
      }),
      Components({
        resolvers: [WotResolver()],
        extensions: ['vue'],
        deep: true,
      }),
      Uni(),
      UnoCSS(),
      AutoImport({
        imports: ['vue', 'uni-app'],
        dirs: ['src/hooks'],
        vueTemplate: true,
      }),
      unicloudInitPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 9420,
    },
    build: {
      sourcemap: false,
      target: 'es6',
    },
  }
})