import { RBAC } from '@/config/types';
import { HCI } from '@/config/labels-annotations';
import isEmpty from 'lodash/isEmpty';
import has from 'lodash/has';
// import uniq from 'lodash/uniq';
import cronstrue from 'cronstrue';

const httpsKeys = [
  'server-url'
];

const runValidators = (val, validators) => {
  for (const validator of validators) {
    const message = validator(val);

    if (message) {
      return message;
    }
  }
};

// "t" is the function name we use for getting a translated string
export default function(t, opt = {}) {
  const { displayKey = 'Value' } = opt;

  // utility validators these validators only get used by other validators
  const startDot = label => val => val?.slice(0, 1) === '.' ? t(`validation.dns.${ label }.startDot`, { key: displayKey }) : undefined;

  // this one should technically be used for restricted hostnames but it doesn't look like the existing code will ever call validateHostName with restricted set to true.
  // const endDot = label => val => val?.slice(-1) === '.' ? t(`validation.dns.${ label }.endDot`, { key: displayKey }) : undefined;

  const startNumber = label => val => val?.slice(0, 1)?.match(/[0-9]/) ? t(`validation.dns.${ label }.startNumber`, { key: displayKey }) : undefined;

  const startHyphen = label => val => val?.slice(0, 1) === '-' ? t(`validation.dns.${ label }.startHyphen`, { key: displayKey }) : undefined;

  const endHyphen = label => val => val?.slice(-1) === '-' ? t(`validation.dns.${ label }.startHyphen`, { key: displayKey }) : undefined;

  const dnsChars = (val) => {
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
  const dnsDoubleDash = val => (val?.substr(2, 2) === '--' && val?.substr(0, 2) !== 'xn') ? t(`validation.dns.doubleHyphen`, { key: displayKey }) : undefined;

  const dnsIanaServiceNameDoubleDash = val => (val?.substr(2, 2) === '--' && val?.substr(0, 2) !== 'xn') ? t(`validation.dns.doubleHyphen`, { key: displayKey }) : undefined;

  const dnsEmpty = label => (val = '') => val.length === 0 ? t(`validation.dns.${ label }.emptyLabel`, { key: displayKey, min: 1 }) : undefined;

  const dnsTooLong = label => (val = '', length = 63) => val.length > length ? t(`validation.dns.${ label }.tooLongLabel`, { key: displayKey, max: 63 }) : undefined;

  const hostnameEmpty = (val = '') => val.length === 0 ? t('validation.dns.hostname.empty', { key: displayKey }) : undefined;

  const hostnameTooLong = (val = '') => val.length === 0 ? t('validation.dns.hostname.tooLong', { key: displayKey, max: 253 }) : undefined;

  const required = val => !val && val !== false ? t('validation.required', { key: displayKey }) : undefined;

  const cronSchedule = (val) => {
    try {
      cronstrue.toString(val);
    } catch (e) {
      return t('validation.invalidCron');
    }
  };

  const isHttps = (key) => {
    const isHttps = val => httpsKeys.includes(key) && !val.toLowerCase().startsWith('https://') ? t('validation.setting.serverUrl.https') : undefined;

    return isHttps;
  };

  const interval = val => !/^\d+[hms]$/.test(val) ? t('validation.monitoring.route.interval', { key: displayKey }) : undefined;

  const containerImage = val => !val?.image ? t('workload.validation.containerImage', { name: val.name }) : undefined;

  const containerImages = (val) => {
    const containers = val.jobTemplate ? val?.jobTemplate?.spec?.template?.spec?.containers : val?.template?.spec?.containers;

    if (!containers || !containers.length) {
      return t('validation.required', { key: t('workload.container.titles.containers') });
    }

    // making sure each container has an imagename
    return containers.map(container => containerImage(container)).find(container => container);
  };

  const dnsLabel = (val) => {
    const validators = [
      dnsChars,
      startHyphen('label'),
      endHyphen('label'),
      dnsDoubleDash,
      dnsEmpty('label'),
      dnsTooLong('label')
    ];

    return runValidators(val, validators);
  };

  const dnsLabelIanaServiceName = (val) => {
    const validators = [
      dnsChars,
      startHyphen('label'),
      endHyphen('label'),
      dnsIanaServiceNameDoubleDash,
      dnsEmpty('label'),
      dnsTooLong('label', 15)
    ];

    return runValidators(val, validators);
  };

  const dnsLabelRestricted = (val) => {
    const validators = [
      dnsChars,
      startNumber('label'),
      startHyphen('label'),
      endHyphen('label'),
      dnsDoubleDash,
      dnsEmpty('label'),
      dnsTooLong('label')
    ];

    return runValidators(val, validators);
  };

  const hostname = (val) => {
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

  const externalName = (val) => {
    if (isEmpty(val)) {
      return t('validation.service.externalName.none');
    } else {
      return hostname(val);
    }
  };

  const testRule = (val) => {
    return 'This is an error returned by the testRule validator';
  };

  const ruleGroups = val => isEmpty(val?.groups) ? t('validation.prometheusRule.groups.required') : undefined;

  const clusterName = isRke2 => val => isRke2 && (val || '')?.match(/^(c-.{5}|local)$/i) ? t('validation.cluster.name') : undefined;

  const servicePort = (val) => {
    const {
      name,
      nodePort,
      port: pPort,
      targetPort,
      idx
    } = val;

    const nodePortIsInt = nodePort ? !isNaN(parseInt(nodePort, 10)) : false;
    const pPortIsInt = pPort ? !isNaN(parseInt(pPort, 10)) : false;
    const targetPortIsInt = targetPort || targetPort === 0 ? !isNaN(parseInt(targetPort, 10)) : false;

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

    if (targetPort || targetPort === 0) {
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

  const groupIsValid = (val, readableIndex) => {
    if (isEmpty(val?.name)) {
      return t('validation.prometheusRule.groups.valid.name', { index: readableIndex });
    }

    if (isEmpty(val.rules)) {
      return t('validation.prometheusRule.groups.valid.singleEntry', { index: readableIndex });
    } else {
      val.rules.forEach((rule, idx) => {
        const readableRuleIndex = idx + 1;

        if (has(rule, 'alert') && isEmpty(rule?.alert)) {
          return t('validation.prometheusRule.groups.valid.rule.alertName', { groupIndex: readableIndex, ruleIndex: readableRuleIndex });
        } else if (has(rule, 'record') && isEmpty(rule?.record)) {
          return t('validation.prometheusRule.groups.valid.rule.recordName', { groupIndex: readableIndex, ruleIndex: readableRuleIndex });
        }

        if ((has(rule, 'expr') && isEmpty(rule.expr)) || !has(rule, 'expr')) {
          return t('validation.prometheusRule.groups.valid.rule.expr', { groupIndex: readableIndex, ruleIndex: readableRuleIndex });
        }

        if (has(rule, 'alert')) {
          if (
            (has(rule, 'labels') && isEmpty(rule.labels)) ||
            !has(rule, 'labels')
          ) {
            return t('validation.prometheusRule.groups.valid.rule.labels', { groupIndex: readableIndex, ruleIndex: readableRuleIndex });
          }
        }
      });
    }

    return undefined;
  };

  const groupsAreValid = (val) => {
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

  const matching = (val) => {
    if (isEmpty(val?.match) && isEmpty(val?.['match_re'])) {
      return t('validation.monitoring.route.match');
    }
  };

  const roleTemplateRules = type => (val = []) => {
    if (val.some(rule => isEmpty(rule.verbs))) {
      return t('validation.roleTemplate.roleTemplateRules.missingVerb');
    }

    if (type === RBAC.ROLE) {
      if (val.some(rule => isEmpty(rule.resources))) {
        return t('validation.roleTemplate.roleTemplateRules.missingResource');
      }

      if (val.some(rule => isEmpty(rule.apiGroups))) {
        return t('validation.roleTemplate.roleTemplateRules.missingApiGroup');
      }
    } else if (val.some(rule => isEmpty(rule.resources) && isEmpty(rule.nonResourceURLs) && isEmpty(rule.apiGroups))) {
      return t('validation.roleTemplate.roleTemplateRules.missingOneResource');
    }

    return undefined;
  };

  // The existing validator for clusterIp never actually returns an error
  const clusterIp = val => undefined;

  const backupTarget = (val) => {
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

  const imageUrl = (val) => {
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

  const fileRequired = (val = {}) => {
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
