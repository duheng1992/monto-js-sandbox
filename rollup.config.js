import typescript from 'rollup-plugin-typescript2'; // 处理typescript
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

const isProd = process.env.NODE_ENV === 'production';

const plugins = [
  typescript({
    tsconfigOverride: { compilerOptions: { declaration: true } }
  }),
  babel({
    babelrc: false,
    presets: [['@babel/preset-env', { modules: false, loose: true, targets: '> 0.25%, not dead' }]],
    plugins: [['@babel/plugin-proposal-class-properties', { loose: true }]],
    exclude: 'node_modules/**',
    babelHelpers: 'bundled'
  })
];

if (isProd) {
  plugins.push(terser());
}

export default [
  {
    input: 'src/index.ts',
    plugins,
    output: [
      { file: 'dist/index.js', format: 'cjs', sourcemap: true },
      { file: 'dist/index.esm.js', format: 'es', sourcemap: true }
    ]
  }
];
