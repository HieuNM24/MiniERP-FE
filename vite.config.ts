import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true, // 👈 THÊM DÒNG NÀY: Tự động bật Chrome/Edge ngoài khi gõ npm run dev
  },
});