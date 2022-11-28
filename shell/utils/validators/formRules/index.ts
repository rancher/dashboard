import { RBAC } from '@shell/config/types';
import { HCI } from '@shell/config/labels-annotations';
import isEmpty from 'lodash/isEmpty';
import has from 'lodash/has';
// import uniq from 'lodash/uniq';
import cronstrue from 'cronstrue';
import { Translation } from '@shell/types/t';

// import uniq from 'lodash/uniq';
export type Validator = (val: any, arg?: any) => undefined | string;

export type ValidatorFactory = (arg1: any, arg2?: any) => Validator

type ServicePort = {
  name?: string,
  nodePort?: string | number,
  port?: string | number,
  targetPort?: string | number,
  idx: number
}

export class Port {
  empty: boolean;
  int: number;
  string: string;
  isNumber: boolean;
  isInt: boolean;
  constructor(port: number | string | undefined) {
    this.string = String(port);
    this.int = parseInt(this.string, 10);
    this.empty = (!port && this.int !== 0);
    this.isNumber = !isNaN(this.int) && !this.string.includes('e'); // leaving out the exponent edge case to keep the logic simple and because port numbers aren't that big...
    this.isInt = this.isNumber && !this.string.includes('.');
  }
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

export interface ValidationOptions {
  key?: string,
}

// "t" is the function name we use for getting a translated string
export default function(t: Translation, { key = 'Value' }: ValidationOptions) {
  // utility validators these validators only get used by other validators
  const startDot: ValidatorFactory = (label: string): Validator => (val: string) => val?.slice(0, 1) === '.' ? t(`validation.dns.${ label }.startDot`, { key }) : undefined;

  const endDot = (label: string): Validator => (val: string) => val?.slice(-1) === '.' ? t(`validation.dns.${ label }.endDot`, { key }) : undefined;

  const startNumber: ValidatorFactory = (label: string): Validator => (val: string) => val?.slice(0, 1)?.match(/[0-9]/) ? t(`validation.dns.${ label }.startNumber`, { key }) : undefined;

  const startHyphen: ValidatorFactory = (label: string): Validator => (val: string) => val?.slice(0, 1) === '-' ? t(`validation.dns.${ label }.startHyphen`, { key }) : undefined;

  const endHyphen: ValidatorFactory = (label: string): Validator => (val: string) => val?.slice(-1) === '-' ? t(`validation.dns.${ label }.endHyphen`, { key }) : undefined;

  const minValue: ValidatorFactory = (min: string) => (val: string | number) => Number(val) < Number(min) ? t('validation.minValue', { key, min }) : undefined;

  const maxValue: ValidatorFactory = (max: string) => (val: string | number) => Number(val) > Number(max) ? t('validation.maxValue', { key, max }) : undefined;

  const betweenValues: ValidatorFactory = ([min, max]: string[]) => (val: string | number) => minValue(min)(val) || maxValue(max)(val) ? t('validation.betweenValues', {
    key, min, max
  }) : undefined;

  const minLength: ValidatorFactory = (min: string) => (val: string) => val.length < Number(min) ? t('validation.minLength', { key, min }) : undefined;

  const maxLength: ValidatorFactory = (max: string) => (val: string) => val.length > Number(max) ? t('validation.maxLength', { key, max }) : undefined;

  const betweenLengths: ValidatorFactory = ([min, max]: string[]) => (val: string) => minLength(min)(val) || maxLength(max)(val) ? t('validation.betweenLengths', {
    key, min, max
  }) : undefined;

  const requiredInt: Validator = (val: string) => isNaN(parseInt(val, 10)) ? t('validation.number.requiredInt', { key }) : undefined;

  const portNumber: Validator = (val: string) => parseInt(val, 10) < 1 || parseInt(val, 10) > 65535 ? t('validation.number.between', {
    key, min: '1', max: '65535'
  }) : undefined;

  const dnsChars: Validator = (val: string) => {
    const matchedChars = val?.match(/[^${'A-Za-z0-9-'}]/g);

    if (matchedChars) {
      return t('validation.chars', {
        key, count: matchedChars.length, chars: matchedChars.map(char => char === ' ' ? 'Space' : `"${ char }"`).join(', ')
      });
    }

    return undefined;
  };

  // the weird edge case here deals with internationalized domain names which are prepended with 'xn--'
  // https://datatracker.ietf.org/doc/html/rfc5891#section-4.2.3.1
  const dnsDoubleDash: Validator = (val: string) => (val?.substr(2, 2) === '--' && val?.substr(0, 2) !== 'xn') ? t(`validation.dns.doubleHyphen`, { key }) : undefined;

  const dnsIanaServiceNameDoubleDash: Validator = (val: string) => (val?.substr(2, 2) === '--' && val?.substr(0, 2) !== 'xn') ? t(`validation.dns.doubleHyphen`, { key }) : undefined;

  const dnsEmpty: ValidatorFactory = (label: string): Validator => (val = '') => val.length === 0 ? t(`validation.dns.${ label }.emptyLabel`, { key, min: 1 }) : undefined;

  const dnsTooLong: ValidatorFactory = (label: string, length = 63): Validator => (val = '') => val.length > length ? t(`validation.dns.${ label }.tooLongLabel`, { key, max: length }) : undefined;

  // eslint-disable-next-line no-unused-vars
  const hostnameEmpty: Validator = (val = '') => val.length === 0 ? t('validation.dns.hostname.empty', { key }) : undefined;

  const hostnameTooLong: Validator = (val = '') => val.length > 253 ? t('validation.dns.hostname.tooLong', { key, max: 253 }) : undefined;

  const absolutePath: Validator = (val = '') => val[0] !== '/' && val.length > 0 ? t('validation.path', { key }) : undefined;

  const required: Validator = (val: any) => !val && val !== false ? t('validation.required', { key }) : undefined;

  const noUpperCase: Validator = (val = '') => val.toLowerCase() !== val ? t('validation.noUpperCase', { key }) : undefined;

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

  const interval: Validator = (val: string) => !/^\d+[hms]$/.test(val) ? t('validation.monitoring.route.interval', { key }) : undefined;

  const containerImage: Validator = (val: any) => !val?.image ? t('workload.validation.containerImage', { name: val.name }) : undefined;

  const containerImages: Validator = (val: any | [any]) => {
    const containers = val.jobTemplate ? val?.jobTemplate?.spec?.template?.spec?.containers : val?.template?.spec?.containers;

    if (!containers || !containers.length) {
      return t('validation.required', { key: t('workload.container.titles.containers') });
    }

    // making sure each container has an image name
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
    if (val) {
      const validators = [
        startDot('hostname'),
        hostnameTooLong,
        endDot('hostname')
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
    }
  };

  const wildcardHostname: Validator = (val: string) => {
    // allow wildcard in first part of hostname
    val = val ? val.replace(/^\*\./, '') : val;

    return hostname(val);
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

  const servicePort = (val: ServicePort) => {
    const {
      name,
      idx
    } = val;

    const nodePort = new Port(val.nodePort);
    const listeningPort = new Port(val.port);
    const targetPort = new Port(val.targetPort);

    if (isEmpty(name)) {
      return t('validation.service.ports.name.required', { position: idx + 1 });
    }

    if (!nodePort.empty) {
      if (!nodePort.isInt) {
        return t('validation.service.ports.nodePort.requiredInt', { position: idx + 1 });
      } else if (nodePort.int < 1 || nodePort.int > 65535) {
        return t('validation.service.ports.nodePort.between', { position: idx + 1 });
      }
    }

    if (!listeningPort.empty) {
      if (!listeningPort.isInt) {
        return t('validation.service.ports.port.requiredInt', { position: idx + 1 });
      } else if (listeningPort.int < 1 || listeningPort.int > 65535) {
        return t('validation.service.ports.port.between', { position: idx + 1 });
      } else if (listeningPort.string?.includes('.')) {
        return listeningPort;
      }
    } else {
      return t('validation.service.ports.port.required', { position: idx + 1 });
    }

    if (!targetPort.empty) {
      if (!targetPort.isInt) {
        const ianaServiceNameErrors = dnsLabelIanaServiceName(targetPort.string);

        if (ianaServiceNameErrors) {
          return ianaServiceNameErrors;
        }
      } else if (targetPort.int < 1 || targetPort.int > 65535) {
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

  const subDomain: Validator = (val) => {
    const matchedChars = val?.match(/[^a-z0-9.-]/g);

    if (matchedChars) {
      return t('validation.chars', {
        key, count: matchedChars.length, chars: matchedChars.map((char: string) => char === ' ' ? 'Space' : `"${ char }"`).join(', ')
      });
    }

    return runValidators(val, [startHyphen('label'), endHyphen('label'), startDot('label'), endDot('label'), required]);
  };

  return {
    absolutePath,
    backupTarget,
    betweenLengths,
    betweenValues,
    clusterIp,
    clusterName,
    containerImage,
    containerImages,
    cronSchedule,
    dnsLabel,
    dnsLabelIanaServiceName,
    dnsLabelRestricted,
    externalName,
    fileRequired,
    groupsAreValid,
    hostname,
    imageUrl,
    interval,
    isHttps,
    matching,
    maxLength,
    maxValue,
    minLength,
    minValue,
    noUpperCase,
    portNumber,
    required,
    requiredInt,
    roleTemplateRules,
    ruleGroups,
    servicePort,
    subDomain,
    testRule,
    wildcardHostname,
  };
}
