import { createViteConfig } from 'vite-config-factory'

const entries = {
    'js/app.js': './source/ts/app.ts',
    'css/app': './source/sass/app.scss',
}

export default createViteConfig(entries, {
    outDir: 'dist',
    manifestFile: 'manifest.json',
})