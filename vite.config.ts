import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/fund': {
        target: 'http://fundgz.1234567.com.cn/js',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fund/, ''),
        headers: {
          'Referer': 'http://fund.eastmoney.com/',
          'Host': 'fundgz.1234567.com.cn'
        }
      },
      '/api/search': {
        target: 'https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/search/, ''),
        headers: {
          'Referer': 'http://fund.eastmoney.com/',
          'Host': 'fundsuggest.eastmoney.com'
        }
      }
    }
  }
})
