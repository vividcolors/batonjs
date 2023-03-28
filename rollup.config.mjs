import terser from '@rollup/plugin-terser';

export default [
  {
    input: 'src/baton.js', 
    output: {
      file: 'dist/baton.umd.js', 
      format: 'umd', 
      name: "batonjs", 
      sourcemap: true
    }, 
  }, 
  {
    input: 'src/baton.js', 
    output: {
      file: 'dist/baton.umd.min.js', 
      format: 'umd', 
      name: "batonjs", 
      sourcemap: true, 
      plugins: [terser()]
    }, 
  }, 
  {
    input: 'src/baton.js', 
    output: {
      file: 'dist/baton.esm.js', 
      format: 'es', 
      sourcemap: true
    }
  }, 
  {
    input: 'src/baton.js', 
    output: {
      file: 'dist/baton.esm.min.js', 
      format: 'es', 
      sourcemap: true, 
      plugins: [terser()]
    }
  }, 
  {
    input: 'src/baton.js', 
    output: {
      file: 'dist/baton.cjs.js', 
      format: 'cjs', 
      sourcempa: true
    }
  }, 
  {
    input: 'src/baton.js', 
    output: {
      file: 'dist/baton.cjs.min.js', 
      format: 'cjs', 
      sourcempa: true, 
      plugins: [terser()]
    }
  }
]