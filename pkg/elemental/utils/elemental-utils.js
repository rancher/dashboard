import { KIND } from '@shell/config/elemental-types';

export function filterForElementalClusters(clusters) {
  return clusters.filter(cluster => cluster.spec?.rkeConfig?.machinePools?.length &&
  cluster.spec?.rkeConfig?.machinePools[0].machineConfigRef.kind === KIND.MACHINE_INV_SELECTOR_TEMPLATES);
}
