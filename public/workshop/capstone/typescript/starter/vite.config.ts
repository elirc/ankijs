import {defineConfig} from 'vite';
export default defineConfig({server:{proxy:{'/notes':'http://127.0.0.1:4000'}}});
