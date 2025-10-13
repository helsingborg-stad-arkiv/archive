import { createViteConfig } from 'vite-config-factory'

const entries = {
    'js/app': './source/ts/app.ts',
    'css/app': './source/sass/app.scss',
}

export default createViteConfig(entries, {
    outDir: 'archive/assets/dist',
    manifestFile: 'manifest.json',
})