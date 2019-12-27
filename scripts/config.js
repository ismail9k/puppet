const path = require('path');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const builtins = require('rollup-plugin-node-builtins');
const version = process.env.VERSION || require('../package.json').version;

const paths = {
  src: path.join(__dirname, '../src'),
  dist: path.join(__dirname, '../dist'),
  outputFolder: path.join(__dirname, '../dist')
};

const common = {
  name: 'puppet.svg',
  input: path.join(paths.src, 'js/index.js'),
  uglifyOptions: {
    toplevel: true,
    compress: true,
    mangle: true
  },
  banner: `/**
  * Puppet SVG ${version}
  * (c) ${new Date().getFullYear()}
    * @license MIT
    */`,
  plugins: [babel(), commonjs(), nodeResolve(), builtins()]
};
const builds = {
  esm: {
    format: 'es',
    ext: '.esm'
  }
};

function getConfig(key) {
  const build = builds[key];
  const config = {
    ...build,
    input: {
      input: build.input || common.input,
      plugins: build.plugins || common.plugins,
    },
    output: {
      name: build.name || common.name,
      banner: common.banner,
      format: build.format,
      exports: 'named'
    }
  };
  return config;
}

const configs = Object.keys(builds).reduce((acc, build) => {
  acc[build] = getConfig(build);
  return acc;
}, {});

module.exports = {
  paths,
  configs,
  common
};
