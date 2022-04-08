import { flowOutput } from '@/utils/validators/flow-output';
import { logdna } from '@/utils/validators/logging-outputs';
import { clusterIp, externalName, servicePort } from '@/utils/validators/service';
import { ruleGroups, groupsAreValid } from '@/utils/validators/prometheusrule';
import { interval, matching } from '@/utils/validators/monitoring-route';
import { containerImages } from '@/utils/validators/container-images';
import { cronSchedule } from '@/utils/validators/cron-schedule';
import { podAffinity } from '@/utils/validators/pod-affinity';
import { roleTemplateRules } from '@/utils/validators/role-template';
import { clusterName } from '@/utils/validators/cluster-name';
import { isHttps, backupTarget } from '@/utils/validators/setting';

import { imageUrl, fileRequired, labelsRequired } from '@/utils/validators/vm-image';

import { vmNetworks, vmDisks } from '@/utils/validators/vm';
import { dataVolumeSize } from '@/utils/validators/vm-datavolumes';

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
  imageUrl,
  dataVolumeSize,
  vmNetworks,
  vmDisks,
  fileRequired,
  labelsRequired
};
