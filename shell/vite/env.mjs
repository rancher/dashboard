import fs from 'node:fs';
import path from 'node:path';

/**
 * Importing this module loads the `.env` file in the directory the build runs in into `process.env`, without replacing
 * variables that are already set, so import it before anything that reads the environment
 */
const envFile = path.join(process.cwd(), '.env');

if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}
