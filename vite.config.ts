import path from 'path';
import { fileURLToPath } from 'url';

import config from './shell/vite.config';

// Excludes the following plugins if there's no .env file (mirrors vue.config.js)
let defaultExcludes = 'rancher-components, harvester';

if (process.env.RANCHER_ENV === 'harvester') {
  defaultExcludes = defaultExcludes.replace(', harvester', '');
}
const excludes = process.env.EXCLUDES_PKG || defaultExcludes;

export default config(path.dirname(fileURLToPath(import.meta.url)), { excludes: excludes.replace(/\s/g, '').split(',') });
