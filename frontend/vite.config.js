import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
  const qrHttpsMode = mode === 'qr-https'

  return {
    plugins: [react(), ...(qrHttpsMode ? [basicSsl()] : [])],
    server: {
      port: 5173,
      https: qrHttpsMode,
      proxy: {
        '/api': 'http://localhost:8080',
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: `${projectRoot}index.html`,
          qrPoc: `${projectRoot}qr-poc.html`,
        },
      },
    },
  }
})
