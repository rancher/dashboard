import { flowOutput } from '@/utils/validators/flow-output';
import { clusterIp, externalName, servicePort } from '@/utils/validators/service';
import { ruleGroups, groupsAreValid } from '@/utils/validators/prometheusrule';
import { interval, matching } from '@/utils/validators/monitoring-route';

/**
* Custom validation functions beyond normal scalr types
* Validator must export a function name should match the validator name on the customValidationRules rule
* Exported function is used as a lookup key in resource-instance:validationErrors:customValidationRules loop
*/
export default {
  clusterIp,
  externalName,
  flowOutput,
  groupsAreValid,
  ruleGroups,
  interval,
  servicePort,
  matching
};
