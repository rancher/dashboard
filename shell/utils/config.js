export default (context, inject) => {
  // eslint-disable-next-line no-undef
  inject('config', { rancherEnv: process.env.rancherEnv, dashboardVersion: process.env.version });
};
