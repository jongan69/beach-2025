import restart from 'vite-plugin-restart'
import glsl from 'vite-plugin-glsl'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Vite automatically exposes variables prefixed with VITE_ to import.meta.env
    const env = loadEnv(mode, process.cwd(), '')
    
    return {
        root: 'src/', // Sources files (typically where index.html is)
        publicDir: '../static/', // Path from "root" to static assets (files that are served as they are)
        server:
        {
            host: true, // Open to local network and display URL
            open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env) // Open if it's not a CodeSandbox
        },
        build:
        {
            outDir: '../dist', // Output in the dist/ folder
            emptyOutDir: true, // Empty the folder first
            sourcemap: true // Add sourcemap
        },
        plugins:
        [
            glsl(), // Support GLSL files
            restart({ restart: [ '../static/**', ] }) // Restart server on static file change
        ],
        // Expose environment variables
        // Vite automatically exposes variables prefixed with VITE_ to import.meta.env
        // For GEMINI_API_KEY (without VITE_ prefix), we need to use define
        define: {
            'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
        }
    }
})