import { defineConfig } from 'vite'
import pkg from './package.json'

export default defineConfig({
    base: process.env.NODE_ENV !== 'production' ? '/' : '/' + pkg.name + '/',
    resolve: {
        alias: {
            
        }
    }
})