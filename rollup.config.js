import typescript from 'rollup-plugin-typescript2';
import { uglify } from 'rollup-plugin-uglify';
import license from 'rollup-plugin-license';
import { name, version, license as LICENSE, author, buildParams } from './package.json';

const banner = `/*!
 * ${ name } ${version}
 * ${LICENSE} Licensed
 *
 * Copyright (C) ${author}
 */`;

const commonPlugins = [
  typescript(),
  license({
    banner: banner,
  })
];

export default [
  // umd
  {
    input: './src/index.ts',
    output: {
      name: buildParams.namespace,
      file: `dist/${buildParams.libName}.js`,
      format: 'umd',
      sourcemap: true,
    },
    plugins: commonPlugins,
  },

  // umd-min
  {
    input: './src/index.ts',
    output: {
      name: buildParams.namespace,
      file: `dist/${buildParams.libName}.min.js`,
      format: 'umd',
      sourcemap: true,
    },
    plugins: commonPlugins.concat([
      uglify(),
    ]),
  },

  // esm
  {
    input: './src/index.ts',
    output: {
      file: `dist/${buildParams.libName}.esm.js`,
      format: 'esm'
    },
    plugins: commonPlugins,
  },
];