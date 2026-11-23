import { defineConfig } from 'vite'
import { copyFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineConfig({
  base: '/t016/',
  plugins: [{
    name: 'static-site-routes',
    async closeBundle() {
      const output = resolve('dist')
      await copyFile(resolve(output, 'index.html'), resolve(output, '404.html'))
      for (const route of ['about', 'vase-u', 'checkout']) {
        const directory = resolve(output, route)
        await mkdir(directory, { recursive: true })
        await copyFile(resolve(output, 'index.html'), resolve(directory, 'index.html'))
      }
    },
  }],
})
