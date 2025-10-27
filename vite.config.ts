import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        xfwd: true,
        cookieDomainRewrite: {
          '*': ''
        },
        pathRewrite: {
          '^/api': '/api'
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Cookie', req.headers.cookie || '');
            console.log('Sending Request:', {
              method: req.method,
              url: req.url,
              cookies: req.headers.cookie
            });
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', {
              statusCode: proxyRes.statusCode,
              url: req.url,
              cookies: proxyRes.headers['set-cookie']
            });
          });
        }
      }
    }
  }
});
