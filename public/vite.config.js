export default defineConfig({
    // ...
    build: {
      outDir: 'dist',
    },
    server: {
      historyApiFallback: true, // tells Vite dev server to fallback to index.html
    }
  })