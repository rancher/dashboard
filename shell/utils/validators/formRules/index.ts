import { RBAC } from '@/shell/config/types';
import { HCI } from '@/shell/config/labels-annotations';
import isEmpty from 'lodash/isEmpty';
import has from 'lodash/has';
// import uniq from 'lodash/uniq';
import cronstrue from 'cronstrue';

export type Validator = (val: any, arg?: any) => undefined | string;

export type ValidatorFactory = (arg1: any, arg2?: any) => Validator

type Port = {
  name?: string,
  nodePort?: string,
  port?: string,
  targetPort?: string,
  idx: number
}

const httpsKeys = [
  'server-url'
];

const runValidators = (val: any, validators: Validator[]) => {
  for (const validator of validators) {
    const message = validator(val);

    if (message) {
      return message;
    }
  }
};

// "t" is the function name we use for getting a translated string
export default function(t: (key: string, options?: any) => string, opt: {displayKey?: string} = {}) {
  const { displayKey = 'Value' } = opt;

  // utility validators these validators only get used by other validators
  const startDot: ValidatorFactory = (label: string): Validator => (val: string) => val?.slice(0, 1) === '.' ? t(`validation.dns.${ label }.startDot`, { key: displayKey }) : undefined;

  // this one should technically be used for restricted hostnames but it doesn't look like the existing code will ever call validateHostName with restricted set to true.
  // const endDot = label => val => val?.slice(-1) === '.' ? t(`validation.dns.${ label }.endDot`, { key: displayKey }) : undefined;

  const startNumber: ValidatorFactory = (label: string): Validator => (val: string) => val?.slice(0, 1)?.match(/[0-9]/) ? t(`validation.dns.${ label }.startNumber`, { key: displayKey }) : undefined;

  const startHyphen: ValidatorFactory = (label: string): Validator => (val: string) => val?.slice(0, 1) === '-' ? t(`validation.dns.${ label }.startHyphen`, { key: displayKey }) : undefined;

  const endHyphen: ValidatorFactory = (label: string): Validator => (val: string) => val?.slice(-1) === '-' ? t(`validation.dns.${ label }.endHyphen`, { key: displayKey }) : undefined;

  const dnsChars: Validator = (val: string) => {
    const matchedChars = val?.match(/[^${ 'A-Za-z0-9-' }]/g);

    if (matchedChars) {
      return t('validation.chars', {
        key: displayKey, count: matchedChars.length, chars: matchedChars.join(' ')
      });
    }

    return undefined;
  };

  // the weird edge case here deals with internationalized domain names which are prepended with 'xn--'
  // https://datatracker.ietf.org/doc/html/rfc5891#section-4.2.3.1
  const dnsDoubleDash: Validator = (val: string) => (val?.substr(2, 2) === '--' && val?.substr(0, 2) !== 'xn') ? t(`validation.dns.doubleHyphen`, { key: displayKey }) : undefined;

  const dnsIanaServiceNameDoubleDash: Validator = (val: string) => (val?.substr(2, 2) === '--' && val?.substr(0, 2) !== 'xn') ? t(`validation.dns.doubleHyphen`, { key: displayKey }) : undefined;

  const dnsEmpty: ValidatorFactory = (label: string): Validator => (val = '') => val.length === 0 ? t(`validation.dns.${ label }.emptyLabel`, { key: displayKey, min: 1 }) : undefined;

  const dnsTooLong: ValidatorFactory = (label: string, length = 63): Validator => (val = '') => val.length > length ? t(`validation.dns.${ label }.tooLongLabel`, { key: displayKey, max: length }) : undefined;

  const hostnameEmpty: Validator = (val = '') => val.length === 0 ? t('validation.dns.hostname.empty', { key: displayKey }) : undefined;

  const hostnameTooLong: Validator = (val = '') => val.length > 253 ? t('validation.dns.hostname.tooLong', { key: displayKey, max: 253 }) : undefined;

  const required: Validator = (val: any) => !val && val !== false ? t('validation.required', { key: displayKey }) : undefined;

  const cronSchedule: Validator = (val: string) => {
    try {
      cronstrue.toString(val);
    } catch (e) {
      return t('validation.invalidCron');
    }
  };

  const isHttps: ValidatorFactory = (key: string) => {
    const isHttps: Validator = (val: string) => httpsKeys.includes(key) && !val.toLowerCase().startsWith('https://') ? t('validation.setting.serverUrl.https') : undefined;

    return isHttps;
  };

  const interval: Validator = (val: string) => !/^\d+[hms]$/.test(val) ? t('validation.monitoring.route.interval', { key: displayKey }) : undefined;

  const containerImage: Validator = (val: any) => !val?.image ? t('workload.validation.containerImage', { name: val.name }) : undefined;

  const containerImages: Validator = (val: any | [any]) => {
    const containers = val.jobTemplate ? val?.jobTemplate?.spec?.template?.spec?.containers : val?.template?.spec?.containers;

    if (!containers || !containers.length) {
      return t('validation.required', { key: t('workload.container.titles.containers') });
    }

    // making sure each container has an imagename
    return containers.map((container: any) => containerImage(container)).find((containerError: string) => containerError);
  };

  const dnsLabel: Validator = (val: string) => {
    const validators = [
      dnsChars,
      startHyphen('label'),
      endHyphen('label'),
      dnsDoubleDash,
      // dnsEmpty('label'), // questionable as to if this is needed if the field is also required...
      dnsTooLong('label')
    ];

    return runValidators(val, validators);
  };

  const dnsLabelIanaServiceName: Validator = (val: string) => {
    const validators = [
      dnsChars,
      startHyphen('label'),
      endHyphen('label'),
      dnsIanaServiceNameDoubleDash,
      dnsEmpty('label'), // questionable as to if this is needed if the field is also required...
      dnsTooLong('label', 15)
    ];

    return runValidators(val, validators);
  };

  const dnsLabelRestricted: Validator = (val: string) => {
    const validators = [
      dnsChars,
      startNumber('label'),
      startHyphen('label'),
      endHyphen('label'),
      dnsDoubleDash,
      dnsEmpty('label'), // questionable as to if this is needed if the field is also required...
      dnsTooLong('label')
    ];

    return runValidators(val, validators);
  };

  const hostname: Validator = (val: string) => {
    const validators = [
      startDot('hostname'),
      hostnameEmpty,
      hostnameTooLong
    ];

    const hostNameMessage = runValidators(val, validators);

    if (hostNameMessage) {
      return hostNameMessage;
    }

    const labels = val.split('.');
    const labelValidators = [
      dnsChars,
      startHyphen('hostname'),
      endHyphen('hostname'),
      dnsDoubleDash,
      dnsEmpty('hostname'),
      dnsTooLong('hostname')
    ];

    for ( let i = 0; i < labels.length; i++ ) {
      const labelMessage = runValidators(labels[i], labelValidators);

      if (labelMessage) {
        return labelMessage;
      }
    }
  };

  const externalName: Validator = (val: string) => {
    if (isEmpty(val)) {
      return t('validation.service.externalName.none');
    } else {
      return hostname(val);
    }
  };

  const testRule = (val: string | undefined) => {
    return 'This is an error returned by the testRule validator';
  };

  const ruleGroups: Validator = (val: {groups?: any}) => isEmpty(val?.groups) ? t('validation.prometheusRule.groups.required') : undefined;

  const clusterName: ValidatorFactory = (isRke2: boolean): Validator => (val: string | undefined) => isRke2 && (val || '')?.match(/^(c-.{5}|local)$/i) ? t('validation.cluster.name') : undefined;

  const servicePort = (val: Port) => {
    const {
      name,
      nodePort,
      port: pPort,
      targetPort,
      idx
    } = val;

    const nodePortIsInt = nodePort ? !isNaN(parseInt(nodePort, 10)) : false;
    const pPortIsInt = pPort ? !isNaN(parseInt(pPort, 10)) : false;
    const targetPortIsInt = targetPort || targetPort === '0' ? !isNaN(parseInt(targetPort, 10)) : false;

    if (isEmpty(name)) {
      return t('validation.service.ports.name.required', { position: idx + 1 });
    }

    if (nodePort && !nodePortIsInt) {
      return t('validation.service.ports.nodePort.requiredInt', { position: idx + 1 });
    }

    if (pPort) {
      if (!pPortIsInt) {
        return t('validation.service.ports.port.requiredInt', { position: idx + 1 });
      }
    } else {
      return t('validation.service.ports.port.required', { position: idx + 1 });
    }

    if (targetPort || targetPort === '0') {
      if (!targetPortIsInt) {
        const ianaServiceNameErrors = dnsLabelIanaServiceName(val.toString());

        if (ianaServiceNameErrors) {
          return ianaServiceNameErrors;
        }
      } else if (parseInt(targetPort, 10) < 1 || parseInt(targetPort, 10) > 65535) {
        return t('validation.service.ports.targetPort.between', { position: idx + 1 });
      }
    } else {
      return t('validation.service.ports.targetPort.required', { position: idx + 1 });
    }

    return undefined;
  };

  const groupIsValid: Validator = (val, readableIndex) => {
    let returnMessage: string | undefined;

    if (isEmpty(val?.name)) {
      return t('validation.prometheusRule.groups.valid.name', { index: readableIndex });
    }

    if (isEmpty(val.rules)) {
      return t('validation.prometheusRule.groups.valid.singleEntry', { index: readableIndex });
    } else {
      val.rules.forEach((rule: any, idx: number) => {
        const readableRuleIndex = idx + 1;

        if (has(rule, 'alert') && isEmpty(rule?.alert) && !returnMessage) {
          returnMessage = t('validation.prometheusRule.groups.valid.rule.alertName', { groupIndex: readableIndex, ruleIndex: readableRuleIndex });
        } else if (has(rule, 'record') && isEmpty(rule?.record)) {
          returnMessage = t('validation.prometheusRule.groups.valid.rule.recordName', { groupIndex: readableIndex, ruleIndex: readableRuleIndex });
        }

        if ((has(rule, 'expr') && isEmpty(rule.expr) && !returnMessage) || (!has(rule, 'expr') && !returnMessage)) {
          returnMessage = t('validation.prometheusRule.groups.valid.rule.expr', { groupIndex: readableIndex, ruleIndex: readableRuleIndex });
        }

        if (has(rule, 'alert')) {
          if (
            (has(rule, 'labels') && isEmpty(rule.labels) && !returnMessage) ||
            (!has(rule, 'labels') && !returnMessage)
          ) {
            returnMessage = t('validation.prometheusRule.groups.valid.rule.labels', { groupIndex: readableIndex, ruleIndex: readableRuleIndex });
          }
        }
      });
    }

    return returnMessage;
  };

  const groupsAreValid: Validator = (val) => {
    const groups = [...val]; // making a new array in the function because I'm gonna mutate it later...
    let message;

    groups.forEach((group, idx, arr) => {
      message = groupIsValid(group, idx + 1);
      if (!!message) {
        arr.length = idx + 1; // this is a tricksy way of breaking a forEach loop since we just want the first message
      }
    });

    return message;
  };

  const matching: Validator = (val) => {
    if (isEmpty(val?.match) && isEmpty(val?.['match_re'])) {
      return t('validation.monitoring.route.match');
    }
  };

  const roleTemplateRules: ValidatorFactory = (type): Validator => (val = []) => {
    if (val.some((rule: any) => isEmpty(rule.verbs))) {
      return t('validation.roleTemplate.roleTemplateRules.missingVerb');
    }

    if (type === RBAC.ROLE) {
      if (val.some((rule: any) => isEmpty(rule.resources))) {
        return t('validation.roleTemplate.roleTemplateRules.missingResource');
      }

      if (val.some((rule: any) => isEmpty(rule.apiGroups))) {
        return t('validation.roleTemplate.roleTemplateRules.missingApiGroup');
      }
    } else if (val.some((rule: any) => isEmpty(rule.resources) && isEmpty(rule.nonResourceURLs) && isEmpty(rule.apiGroups))) {
      return t('validation.roleTemplate.roleTemplateRules.missingOneResource');
    }

    return undefined;
  };

  // The existing validator for clusterIp never actually returns an error
  const clusterIp: Validator = val => undefined;

  const backupTarget: Validator = (val) => {
    const parseValue = JSON.parse(val);
    const type = parseValue.type;

    if (!type) {
      return t('validation.required', { key: 'Type' });
    }

    if (type === 's3') {
      if (!parseValue.accessKeyId) {
        return t('validation.required', { key: 'accessKeyId' });
      }

      if (!parseValue.secretAccessKey) {
        return t('validation.required', { key: 'secretAccessKey' });
      }

      if (!parseValue.bucketRegion) {
        return t('validation.required', { key: 'bucketRegion' });
      }

      if (!parseValue.bucketName) {
        return t('validation.required', { key: 'bucketName' });
      }
    }

    return undefined;
  };

  const imageUrl: Validator = (val) => {
    const VM_IMAGE_FILE_FORMAT = ['qcow', 'qcow2', 'raw', 'img', 'iso'];

    if (!val || val === '') {
      return undefined;
    }

    const urlSlug = val.split('/').pop();
    const fileExtension = urlSlug.split('.').pop().toLowerCase();

    if (!VM_IMAGE_FILE_FORMAT.includes(fileExtension)) {
      return t('harvester.validation.image.ruleTip');
    }

    return undefined;
  };

  const fileRequired: Validator = (val = {}) => {
    if (!val[HCI.IMAGE_NAME]) {
      return t('validation.required', { key: t('harvester.image.fileName') });
    }
  };

  return {
    required,
    cronSchedule,
    isHttps,
    interval,
    containerImage,
    containerImages,
    ruleGroups,
    groupsAreValid,
    matching,
    clusterName,
    roleTemplateRules,
    servicePort,
    clusterIp,
    externalName,
    backupTarget,
    imageUrl,
    fileRequired,
    dnsLabel,
    dnsLabelIanaServiceName,
    dnsLabelRestricted,
    hostname,
    testRule
  };
}
