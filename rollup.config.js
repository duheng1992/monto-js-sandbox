import typescript from 'rollup-plugin-typescript2'; // 处理typescript
import babel from '@rollup/plugin-babel';

const config = [
  {
    input: 'src/index.ts',
    plugins: [
      typescript(), // typescript 转义
      babel({
        babelrc: false,
        presets: [['@babel/preset-env', { modules: false, loose: true }]],
        plugins: [['@babel/plugin-proposal-class-properties', { loose: true }]],
        exclude: 'node_modules/**',
      })
    ],
    output: [
      { file: 'dist/index.js', format: 'cjs' },
      { file: 'dist/index.esm.js', format: 'es' }
    ]
  }
];

const env = process.env.NODE_ENV // umd 模式的编译结果文件输出的全局变量名称
// 若打包正式环境，压缩代码 
if (env === 'production') {
  // config.plugins.push(terser({
  //   compress: {
  //     pure_getters: true,
  //     unsafe: true,
  //     unsafe_comps: true,
  //     warnings: false
  //   }
  // }))
}

export default config
