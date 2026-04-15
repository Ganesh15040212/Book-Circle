import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// The parent project root (where node_modules lives)
const repoRoot = path.resolve(__dirname, '..')

export default defineConfig({
    root: path.resolve(__dirname),
    publicDir: path.resolve(__dirname, 'public'),
    plugins: [
        react(),
        tailwindcss(),
    ],
    resolve: {
        // Force a single copy of React — prevents "Invalid hook call" / duplicate React error
        dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
        alias: {
            '@': path.resolve(__dirname, './src'),
            // Always resolve React from the shared parent node_modules
            'react': path.resolve(repoRoot, 'node_modules/react'),
            'react-dom': path.resolve(repoRoot, 'node_modules/react-dom'),
            'react/jsx-runtime': path.resolve(repoRoot, 'node_modules/react/jsx-runtime'),
        },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
    server: {
        port: 5174,
        proxy: {
            '/api': {
                target: 'https://bookcircle-api.lovestoblog.com',
                changeOrigin: true,
                rewrite: (p) => p.replace(/^\/api/, '/bookcircle-api'),
            },
        },
    },
    build: {
        outDir: path.resolve(__dirname, '../dist-admin'),
        emptyOutDir: true,
    },
    optimizeDeps: {
        // Force pre-bundle from the correct (single) location
        include: ['react', 'react-dom', 'react/jsx-runtime'],
    },
})
