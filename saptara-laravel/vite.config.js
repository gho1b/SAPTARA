import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/main.tsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    server: {
        ...(process.env.LARAVEL_SAIL ? {
            host: '0.0.0.0',
            port: Number(process.env.VITE_PORT || 5173),
            strictPort: true,
            hmr: {
                host: 'localhost',
            },
        } : {}),
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
