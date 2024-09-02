/**
 * Return list of variables to filter chart questions
 */
export const ignoreVariables = (data) => {
  const pspChartMap = {
    epinio:                     'global.rbac.pspEnabled',
    longhorn:                   'enablePSP',
    'rancher-alerting-drivers': 'global.cattle.psp.enabled',
    neuvector:                  'global.cattle.psp.enabled',
    'prometheus-federator':     'global.rbac.pspEnabled',
  };
  const path = pspChartMap[data.chart.name];

  return [path];
};
