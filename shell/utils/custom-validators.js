import { flowOutput } from '@shell/utils/validators/flow-output';
import { logdna } from '@shell/utils/validators/logging-outputs';
import { clusterIp, externalName, servicePort } from '@shell/utils/validators/service';
import { ruleGroups, groupsAreValid } from '@shell/utils/validators/prometheusrule';
import { interval, matching } from '@shell/utils/validators/monitoring-route';
import { containerImages } from '@shell/utils/validators/container-images';
import { cronSchedule } from '@shell/utils/validators/cron-schedule';
import { podAffinity } from '@shell/utils/validators/pod-affinity';
import { roleTemplateRules } from '@shell/utils/validators/role-template';
import { clusterName } from '@shell/utils/validators/cluster-name';
import { isHttps, backupTarget } from '@shell/utils/validators/setting';

// import { imageUrl, fileRequired } from '@shell/utils/validators/vm-image';
import { vmNetworks, vmDisks } from '@shell/utils/validators/vm';
import { dataVolumeSize } from '@shell/utils/validators/vm-datavolumes';

/**
* Custom validation functions beyond normal scalr types
* Validator must export a function name should match the validator name on the customValidationRules rule
* Exported function is used as a lookup key in resource-class:validationErrors:customValidationRules loop
*/
export default {
  clusterName,
  clusterIp,
  externalName,
  flowOutput,
  groupsAreValid,
  logdna,
  ruleGroups,
  interval,
  servicePort,
  matching,
  containerImages,
  cronSchedule,
  podAffinity,
  roleTemplateRules,
  isHttps,
  backupTarget,
  // imageUrl,
  dataVolumeSize,
  vmNetworks,
  vmDisks,
  // fileRequired,
};
