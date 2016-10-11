import config from './rollup.dev'

import replace from 'rollup-plugin-replace'
import replacements from './rollup.replacements'

deleteDist();

config.dest = 'dist/natty-fetch.js';

config.plugins[1] = replace(Object.assign({}, replacements, {
  'process.env.NODE_ENV': '"production"'
}));

export default config;
