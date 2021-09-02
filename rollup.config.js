import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import { uglify } from 'rollup-plugin-uglify';
import { terser } from 'rollup-plugin-terser';
import progress from 'rollup-plugin-progress';
import replace from 'rollup-plugin-replace';
import path from 'path';

var K_ENV = 'dev';
const K_ENV_DEV = 'dev';
const K_ENV_TEST = 'test';
const K_ENV_PROD = 'prod';

const outputMap = {
  'prod': {
    'js': 'build/dist/js/bundle.js',
    'css': 'build/dist/css/bundle.css'
  },
  'test': {
    'js': 'build/staging/js/bundle.js',
    'css': 'build/staging/css/bundle.css'
  },
  'dev': {
    'js': 'public/js/bundle.js',
    'css': 'public/css/bundle.css'
  },
}

if (process.env.K_ENV) {
  K_ENV = process.env.K_ENV;
}
const is_dev = (K_ENV == K_ENV_DEV);
const is_staging = (K_ENV == K_ENV_TEST);
const is_production = (K_ENV == K_ENV_PROD);

let _dir = outputMap[K_ENV].js.split('/');
_dir.pop();
const dir = _dir.join('/');

const pluginOpts = {
  progress: {
    clearLine: true
  },
  replace: {
    //exclude: 'node_modules/**',
    values: {
      _FILE_(id) {
        var parts = id.split(path.sep);
        return parts.pop();
      },
      _COMPONENT_(id) {
        var parts = id.split(path.sep);
        return parts.pop().split('.').shift();
      },
      'process.env.NODE_ENV': JSON.stringify('production') //for tippy.js
    }
  },
  svelte: {
    css: css => {
      css.write(outputMap[K_ENV].css, !is_production);
    },
    cascade: false,
    store: true,
    dev: is_dev
  },
  resolve: {
    browser: true,
    preferBuiltins: false
  },
  commonjs: {},
  buble: {},
  terser: {},
  uglify: {}
}


export default [
  {
    input: { bundle: 'src/main.js' },
    output: {
      sourcemap: is_production,
      format: 'esm',
      dir: dir,
      intro: "var K_ENV = '" + K_ENV + "',\nK_ENV_DEV = 'dev',\nK_ENV_TEST = 'test',\nK_ENV_PROD = 'prod';"
    },
    experimentalCodeSplitting: true,
    plugins: [
      progress(pluginOpts['progress']),
      replace(pluginOpts['replace']),
      svelte(pluginOpts['svelte']),
      resolve(pluginOpts['resolve']),
      commonjs(pluginOpts['commonjs']),
      terser(pluginOpts['terser'])
    ]
  },
];