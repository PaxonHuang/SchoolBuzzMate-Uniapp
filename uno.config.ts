import { defineConfig, presetIcons } from 'unocss'
import { presetUni } from '@uni-helper/unocss-preset-uni'

export default defineConfig({
  presets: [
    presetUni(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  shortcuts: {
    'school-green': '#07c160',
    'price-orange': '#ff6b00',
    'bg-gray': '#f5f5f5',
  },
})