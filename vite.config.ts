import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                dashboard: resolve(__dirname, 'YeDashBoard.html'),
                settings: resolve(__dirname, 'pages/Settings.html'),
                calendar: resolve(__dirname, 'pages/ye-calendar.html'),
                notes: resolve(__dirname, 'pages/ye-notes.html'),
                quiz: resolve(__dirname, 'pages/ye-quiz.html'),
            }
        }
    }
})