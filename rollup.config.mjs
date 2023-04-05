import terser from '@rollup/plugin-terser';

export default [
  {
    input: 'src/baton.js', 
    output: {
      file: 'asset/baton.umd.js', 
      format: 'umd', 
      name: "batonjs", 
      sourcemap: true
    }, 
  }, 
  {
    input: 'src/baton.js', 
    output: {
      file: 'asset/baton.umd.min.js', 
      format: 'umd', 
      name: "batonjs", 
      sourcemap: true, 
      plugins: [terser()]
    }, 
  }, 
  {
    input: 'src/baton.js', 
    output: {
      file: 'asset/baton.esm.js', 
      format: 'es', 
      sourcemap: true
    }
  }, 
  {
    input: 'src/baton.js', 
    output: {
      file: 'asset/baton.esm.min.js', 
      format: 'es', 
      sourcemap: true, 
      plugins: [terser()]
    }
  }, 
  {
    input: 'src/baton.js', 
    output: {
      file: 'asset/baton.cjs.js', 
      format: 'cjs', 
      sourcemap: true
    }
  }, 
  {
    input: 'src/baton.js', 
    output: {
      file: 'asset/baton.cjs.min.js', 
      format: 'cjs', 
      sourcemap: true, 
      plugins: [terser()]
    }
  }
]