import { setModelLoader } from '@shell/plugins/dashboard-store/model-loader-require';

const models = import.meta.glob(['../models/**/*.{js,ts}', '!**/__tests__/**', '!**/*.d.ts'], { eager: true });

const SUFFIXES = ['.js', '.ts', '/index.js', '/index.ts'];

/**
 * Make the dashboard's models available to the stores, looked up by the type each one is for
 */
export const installModels = () => {
  setModelLoader((type) => {
    const suffix = SUFFIXES.find((s) => `../models/${ type }${ s }` in models);

    return suffix ? models[`../models/${ type }${ suffix }`] : undefined;
  });
};
