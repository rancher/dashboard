import formRulesGenerator from '@shell/utils/validators/formRules';

const mockT = (key: string, args: any) => {
  return JSON.stringify({
    message: key,
    ...args
  });
};

describe('formRules', () => {
  const formRules = formRulesGenerator(mockT, { key: 'testDisplayKey' });

  it('"required" : returns undefined when value supplied', () => {
    const testValue = 'foo';
    const formRuleResult = formRules.required(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"required" : returns the correct message when value undefined', () => {
    const formRuleResult = formRules.required(undefined);
    const expectedResult = JSON.stringify({
      message: 'validation.required',
      key:     'testDisplayKey'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"cronSchedule" : returns undefined when valid cron string value supplied', () => {
    const testValue = '0 * * * *';
    const formRuleResult = formRules.cronSchedule(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"cronSchedule" : returns the correct message when invalid cron string value supplied', () => {
    // specific logic of what constitutes a cron string is in the "cronstrue" function in an external library and not tested here
    const testValue = '0 * * **';
    const formRuleResult = formRules.cronSchedule(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.invalidCron' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"isHttps" : returns undefined when valid https url value is supplied', () => {
    const testValue = 'https://url.com';
    const formRuleResult = formRules.isHttps('server-url')(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"isHttps" : returns correct message when http url value is supplied', () => {
    const testValue = 'http://url.com';
    const formRuleResult = formRules.isHttps('server-url')(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.setting.serverUrl.https' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"interval" : returns undefined when valid hour interval value is supplied', () => {
    const testValue = '5h';
    const formRuleResult = formRules.interval(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"interval" : returns undefined when valid minute interval value is supplied', () => {
    const testValue = '5m';
    const formRuleResult = formRules.interval(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"interval" : returns undefined when valid second interval value is supplied', () => {
    const testValue = '5s';
    const formRuleResult = formRules.interval(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"interval" : returns correct message when interval unit is supplied but not integer', () => {
    const testValue = 's';
    const formRuleResult = formRules.interval(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.monitoring.route.interval',
      key:     'testDisplayKey'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"interval" : returns correct message when interval integer is supplied but not unit', () => {
    const testValue = '5';
    const formRuleResult = formRules.interval(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.monitoring.route.interval',
      key:     'testDisplayKey'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"containerImage" : returns undefined when valid container with image is supplied', () => {
    const testValue = { image: 'imageName' };
    const formRuleResult = formRules.containerImage(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"containerImage" : returns correct message when container without image is supplied', () => {
    const testValue = { name: 'testName' };
    const formRuleResult = formRules.containerImage(testValue);
    const expectedResult = JSON.stringify({
      message: 'workload.validation.containerImage',
      name:    testValue.name
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"containerImages" : returns undefined when valid jobTemplate value is supplied', () => {
    const testValue = { jobTemplate: { spec: { template: { spec: { containers: [{ image: 'imageName', name: 'name' }] } } } } };
    const formRuleResult = formRules.containerImages(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"containerImages" : returns undefined when valid non-jobTemplate value is supplied', () => {
    const testValue = { template: { spec: { containers: [{ image: 'imageName', name: 'name' }] } } };
    const formRuleResult = formRules.containerImages(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"containerImages" : returns correct message when supplied value contains no containers', () => {
    const testValue = { template: { spec: { containers: [] } } };
    const formRuleResult = formRules.containerImages(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.required',
      key:     JSON.stringify({ message: 'workload.container.titles.containers' })
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"containerImages" : returns correct message when supplied value has containers but one has no image', () => {
    const testValue = { template: { spec: { containers: [{ name: 'testName' }] } } };
    const formRuleResult = formRules.containerImages(testValue);
    const expectedResult = JSON.stringify({
      message: 'workload.validation.containerImage',
      name:    'testName'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"ruleGroups" : returns undefined when rulegroups are supplied', () => {
    const testValue = { groups: ['group1'] };
    const formRuleResult = formRules.ruleGroups(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"groupsAreValid" : returns undefined when valid rulegroups are supplied', () => {
    const testValue = [
      {
        name:  'group',
        rules: [
          {
            alert:  { name: 'alertname' },
            record: { name: 'recordname' },
            expr:   { name: 'exprname' },
            labels: ['label1']
          }
        ]
      }
    ];
    const formRuleResult = formRules.groupsAreValid(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"groupsAreValid" : returns correct message when rules are empty', () => {
    const testValue = [
      {
        name:  'group',
        rules: []
      }
    ];
    const formRuleResult = formRules.groupsAreValid(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.prometheusRule.groups.valid.singleEntry',
      index:   1
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"groupsAreValid" : returns correct message when rule alert is empty', () => {
    const testValue = [
      {
        name:  'group',
        rules: [
          {
            alert:  '',
            record: '',
            expr:   '',
            labels: { severity: 'none' }
          }
        ]
      }
    ];
    const formRuleResult = formRules.groupsAreValid(testValue);
    const expectedResult = JSON.stringify({
      message:    'validation.prometheusRule.groups.valid.rule.alertName',
      groupIndex: 1,
      ruleIndex:  1
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"groupsAreValid" : returns correct message when rule record is empty', () => {
    const testValue = [
      {
        name:  'group',
        rules: [
          {
            alert:  'name',
            record: '',
            expr:   '',
            labels: { severity: 'none' }
          }
        ]
      }
    ];
    const formRuleResult = formRules.groupsAreValid(testValue);
    const expectedResult = JSON.stringify({
      message:    'validation.prometheusRule.groups.valid.rule.recordName',
      groupIndex: 1,
      ruleIndex:  1
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"groupsAreValid" : returns correct message when rule expr is empty', () => {
    const testValue = [
      {
        name:  'group',
        rules: [
          {
            alert:  'name',
            record: 'record',
            expr:   '',
            labels: { severity: 'none' }
          }
        ]
      }
    ];
    const formRuleResult = formRules.groupsAreValid(testValue);
    const expectedResult = JSON.stringify({
      message:    'validation.prometheusRule.groups.valid.rule.expr',
      groupIndex: 1,
      ruleIndex:  1
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"groupsAreValid" : returns correct message when rule labels is empty', () => {
    const testValue = [
      {
        name:  'group',
        rules: [
          {
            alert:  'name',
            record: 'record',
            expr:   'expr',
            labels: {}
          }
        ]
      }
    ];
    const formRuleResult = formRules.groupsAreValid(testValue);
    const expectedResult = JSON.stringify({
      message:    'validation.prometheusRule.groups.valid.rule.labels',
      groupIndex: 1,
      ruleIndex:  1
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"matching" : returns undefined when is not empty and match_re is not empty', () => {
    const testValue = { match: 'matchValue', match_re: 'match_reValue' };
    const formRuleResult = formRules.matching(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"matching" : returns undefined when match is empty and match_re is not empty', () => {
    const testValue = { match: '', match_re: 'match_reValue' };
    const formRuleResult = formRules.matching(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"matching" : returns undefined when match is not empty and match_re is empty', () => {
    const testValue = { match: 'matchValue', match_re: '' };
    const formRuleResult = formRules.matching(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"matching" : returns correct message when match is empty and match_re is empty', () => {
    const testValue = { match: '', match_re: '' };
    const formRuleResult = formRules.matching(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.monitoring.route.match' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"clusterName" : returns undefined when "isRke2" is false', () => {
    const testValue = 'clusterName';
    const formRuleResult = formRules.clusterName(false)(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"clusterName" : returns undefined when "isRke2" is true and clusterName is valid', () => {
    const testValue = 'clustername';
    const formRuleResult = formRules.clusterName(true)(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"clusterName" : returns correct message when "isRke2" is true and clusterName is 5 characters long with "c-" as a prefix', () => {
    const testValue = 'c-12345';
    const formRuleResult = formRules.clusterName(true)(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.cluster.name' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"clusterName" : returns undefined when "isRke2" is true and clusterName is less than 5 characters long with "c-" as a prefix', () => {
    const testValue = 'c-1234';
    const formRuleResult = formRules.clusterName(true)(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"clusterName" : returns undefined when "isRke2" is true and clusterName is more than 5 characters long with "c-" as a prefix', () => {
    const testValue = 'c-123456';
    const formRuleResult = formRules.clusterName(true)(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"roleTemplateRules" : returns undefined when type is RBAC role and value contains valid rules', () => {
    const testValue: [{}] = [
      {
        verbs: ['verb1'], resources: ['resource1'], apiGroups: ['apiGroup1']
      }
    ];
    const formRuleResult = formRules.roleTemplateRules('rbac.authorization.k8s.io.role')(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"roleTemplateRules" : returns correct message when type is RBAC role and value is missing verbs', () => {
    const testValue: [{}] = [
      {
        verbs: [], resources: ['resource1'], apiGroups: ['apiGroup1']
      }
    ];
    const formRuleResult = formRules.roleTemplateRules('rbac.authorization.k8s.io.role')(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.roleTemplate.roleTemplateRules.missingVerb' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"roleTemplateRules" : returns correct message when type is RBAC role and value is missing resources', () => {
    const testValue: [{}] = [
      {
        verbs: ['verb1'], resources: [], apiGroups: ['apiGroup1']
      }
    ];
    const formRuleResult = formRules.roleTemplateRules('rbac.authorization.k8s.io.role')(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.roleTemplate.roleTemplateRules.missingResource' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"roleTemplateRules" : returns correct message when type is RBAC role and value is missing apiGroups', () => {
    const testValue: [{}] = [
      {
        verbs: ['verb1'], resources: ['resource1'], apiGroups: []
      }
    ];
    const formRuleResult = formRules.roleTemplateRules('rbac.authorization.k8s.io.role')(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.roleTemplate.roleTemplateRules.missingApiGroup' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"roleTemplateRules" : returns undefined when type is not RBAC role and value contains valid rules', () => {
    const testValue: [{}] = [
      {
        verbs: ['verb1'], nonResourceURLs: ['nonResourceURL1'], resources: ['resource1'], apiGroups: ['apiGroup1']
      }
    ];
    const formRuleResult = formRules.roleTemplateRules('nonrbactype')(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"roleTemplateRules" : returns undefined when type is not RBAC role and value is missing resources and nonResourceURLs and apiGroups', () => {
    const testValue: [{}] = [
      {
        verbs: ['verb1'], nonResourceURLs: [], resources: [], apiGroups: []
      }
    ];
    const formRuleResult = formRules.roleTemplateRules('nonrbactype')(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.roleTemplate.roleTemplateRules.missingOneResource' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"servicePort" : returns undefined when servicePort is valid', () => {
    const testValue = {
      name:       'portName',
      nodePort:   '8081',
      port:       '8082',
      targetPort: '8083',
      idx:        0
    };
    const formRuleResult = formRules.servicePort(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"servicePort" : returns correct message when servicePort name is empty', () => {
    const testValue = {
      name:       '',
      nodePort:   '8081',
      port:       '8082',
      targetPort: '8083',
      idx:        0
    };
    const formRuleResult = formRules.servicePort(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.service.ports.name.required', position: 1 });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"servicePort" : returns correct message when servicePort nodePort is not an integer', () => {
    const testValue = {
      name:       'portName',
      nodePort:   'test',
      port:       '8082',
      targetPort: '8083',
      idx:        0
    };
    const formRuleResult = formRules.servicePort(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.service.ports.nodePort.requiredInt', position: 1 });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"servicePort" : returns correct message when servicePort port is not an integer', () => {
    const testValue = {
      name:       'portName',
      nodePort:   '8081',
      port:       'test',
      targetPort: '8083',
      idx:        0
    };
    const formRuleResult = formRules.servicePort(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.service.ports.port.requiredInt', position: 1 });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"servicePort" : returns correct message when port is not provided', () => {
    const testValue = {
      name:       'portName',
      nodePort:   '8081',
      targetPort: '8083',
      idx:        0
    };
    const formRuleResult = formRules.servicePort(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.service.ports.port.required', position: 1 });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"servicePort" : returns correct message when targetPort port is not an integer but is a valid dnsLabelIanaServiceName', () => {
    const testValue = {
      name:       'portName',
      nodePort:   '8081',
      port:       '8082',
      targetPort: 'test',
      idx:        0
    };
    const formRuleResult = formRules.servicePort(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"servicePort" : returns correct message when targetPort port is not an integer but is not a valid dnsLabelIanaServiceName', () => {
    const testValue = {
      name:       'portName',
      nodePort:   '8081',
      port:       '8082',
      targetPort: 'te st',
      idx:        0
    };
    const formRuleResult = formRules.servicePort(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.chars', key: 'testDisplayKey', count: 1, chars: 'Space'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"servicePort" : returns correct message when targetPort port is below the valid range', () => {
    const testValue = {
      name:       'portName',
      nodePort:   '8081',
      port:       '8082',
      targetPort: '0',
      idx:        0
    };
    const formRuleResult = formRules.servicePort(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.service.ports.targetPort.between', position: 1 });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"servicePort" : returns correct message when targetPort port is above the valid range', () => {
    const testValue = {
      name:       'portName',
      nodePort:   '8081',
      port:       '8082',
      targetPort: '65536',
      idx:        0
    };
    const formRuleResult = formRules.servicePort(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.service.ports.targetPort.between', position: 1 });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"clusterIp" : always returns undefined', () => {
    const formRuleResult = formRules.clusterIp('');

    expect(formRuleResult).toBeUndefined();
  });

  it('"externalName" : returns undefined when value is a valid externalName', () => {
    const testValue = 'test';
    const formRuleResult = formRules.externalName(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"externalName" : returns expected message when value empty', () => {
    const testValue = '';
    const formRuleResult = formRules.externalName(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.service.externalName.none' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"externalName" : returns expected message when value starts with a dot', () => {
    const testValue = '.hostname';
    const formRuleResult = formRules.externalName(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.dns.hostname.startDot', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"externalName" : returns expected message when value starts is too long for a hostname', () => {
    const testValue = 'There.are.many.variations.of.passages.of.Lorem.Ipsum.available.but.the.majority.have.suffered.alteration.in.some.form.by.injected.humour.or.randomised.words.which.dont.look.even.slightly.believable.If.you.are.going.to.use.a.passage.of.Lorem.Ipsum.you.need';
    const formRuleResult = formRules.externalName(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.hostname.tooLong', key: 'testDisplayKey', max: 253
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"externalName" : returns expected message when value contains invalid characters', () => {
    const testValue = 'www.host*name.com';
    const formRuleResult = formRules.externalName(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.chars', key: 'testDisplayKey', count: 1, chars: '"*"'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"externalName" : returns expected message when hostname label starts with a dash', () => {
    const testValue = 'www.-hostname.com';
    const formRuleResult = formRules.externalName(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.dns.hostname.startHyphen', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"externalName" : returns expected message when hostname label ends with a dash', () => {
    const testValue = 'www.hostname-.com';
    const formRuleResult = formRules.externalName(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.dns.hostname.endHyphen', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"externalName" : returns expected message when hostname label contains a double-dash at the third character position', () => {
    const testValue = 'www.ho--stname.com';
    const formRuleResult = formRules.externalName(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.dns.doubleHyphen', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"externalName" : returns expected message when hostname label is empty', () => {
    const testValue = 'www..com';
    const formRuleResult = formRules.externalName(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.hostname.emptyLabel', key: 'testDisplayKey', min: 1
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"externalName" : returns expected message when hostname label is too long', () => {
    const testValue = 'www.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef.com';
    const formRuleResult = formRules.externalName(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.hostname.tooLongLabel', key: 'testDisplayKey', max: 63
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"backupTarget" : returns undefined when value is valid backupTarget', () => {
    const testValue = JSON.stringify({ type: 'type' });
    const formRuleResult = formRules.backupTarget(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"backupTarget" : returns expected message when value is backupTarget without a type', () => {
    const testValue = JSON.stringify({});
    const formRuleResult = formRules.backupTarget(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.required', key: 'Type' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"backupTarget" : returns expected message when value is backupTarget with a type of s3 but no accessKeyId', () => {
    const testValue = JSON.stringify({ type: 's3' });
    const formRuleResult = formRules.backupTarget(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.required', key: 'accessKeyId' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"backupTarget" : returns expected message when value is backupTarget with a type of s3 but no secretAccessKey', () => {
    const testValue = JSON.stringify({ type: 's3', accessKeyId: 'id' });
    const formRuleResult = formRules.backupTarget(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.required', key: 'secretAccessKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"backupTarget" : returns expected message when value is backupTarget with a type of s3 but no bucketRegion', () => {
    const testValue = JSON.stringify({
      type: 's3', accessKeyId: 'id', secretAccessKey: 'key'
    });
    const formRuleResult = formRules.backupTarget(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.required', key: 'bucketRegion' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"backupTarget" : returns expected message when value is backupTarget with a type of s3 but no bucketName', () => {
    const testValue = JSON.stringify({
      type: 's3', accessKeyId: 'id', secretAccessKey: 'key', bucketRegion: 'region'
    });
    const formRuleResult = formRules.backupTarget(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.required', key: 'bucketName' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"backupTarget" : returns undefined when value is backupTarget with a type of s3 and all other values', () => {
    const testValue = JSON.stringify({
      type: 's3', accessKeyId: 'id', secretAccessKey: 'key', bucketRegion: 'region', bucketName: 'name'
    });
    const formRuleResult = formRules.backupTarget(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"imageUrl" : returns undefined when value is a valid imageUrl', () => {
    const testValue = 'https://url/image.iso';
    const formRuleResult = formRules.imageUrl(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"imageUrl" : returns expected message when value has an invalid file extension', () => {
    const testValue = 'https://url/image.isi';
    const formRuleResult = formRules.imageUrl(testValue);
    const expectedResult = JSON.stringify({ message: 'harvester.validation.image.ruleTip' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"fileRequired" : returns undefined when value has an image name key', () => {
    const testValue = { 'harvesterhci.io/image-name': 'test' };
    const formRuleResult = formRules.fileRequired(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"fileRequired" : returns expected message when value is invalid', () => {
    const testValue = {};
    const formRuleResult = formRules.fileRequired(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.required', key: JSON.stringify({ message: 'harvester.image.fileName' }) });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"dnsLabel" : returns undefined when valid dnsLabel value is supplied', () => {
    const testValue = 'bob';
    const formRuleResult = formRules.dnsLabel(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"dnsLabel" : returns correct message when dnsLabel value with invalid characters is supplied', () => {
    const testValue = 'bob*bob';
    const formRuleResult = formRules.dnsLabel(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.chars',
      key:     'testDisplayKey',
      count:   1,
      chars:   '"*"'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"dnsLabel" : returns correct message when  dnsLabel value that starts with a dash is supplied', () => {
    const testValue = '-bob';
    const formRuleResult = formRules.dnsLabel(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.label.startHyphen',
      key:     'testDisplayKey'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"dnsLabel" : returns correct message when  dnsLabel value that ends with a dash is supplied', () => {
    const testValue = 'bob-';
    const formRuleResult = formRules.dnsLabel(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.label.endHyphen',
      key:     'testDisplayKey'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"dnsLabel" : returns correct message when dnsLabel value with double-dash after first two characters is supplied', () => {
    const testValue = 'jo--jane';
    const formRuleResult = formRules.dnsLabel(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.doubleHyphen',
      key:     'testDisplayKey'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"dnsLabel" : returns correct message when dnsLabel value is too long', () => {
    const testValue = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz';
    const formRuleResult = formRules.dnsLabel(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.label.tooLongLabel',
      key:     'testDisplayKey',
      max:     63
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  // this rule is pretty much identical to the standard dnsLabel other than the dnsLabel length
  it('"dnsLabelIanaServiceName" : returns correct message when dnsLabel value is too long', () => {
    const testValue = '0123456789abcdef';
    const formRuleResult = formRules.dnsLabelIanaServiceName(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.label.tooLongLabel',
      key:     'testDisplayKey',
      max:     15
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  // this rule is pretty much identical to the standard dnsLabel other than the startNumber test
  it('"dnsLabelRestricted" : returns correct message when dnsLabel starts with a number', () => {
    const testValue = '1testUrl';
    const formRuleResult = formRules.dnsLabelRestricted(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.label.startNumber',
      key:     'testDisplayKey'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  // this rule is pretty much identical to the standard dnsLabel other than the startNumber test
  it('"hostName" : returns undefined when value is valid hostname', () => {
    const testValue = 'www.url.com';
    const formRuleResult = formRules.hostname(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"hostName" : returns expected message when value starts with a dot', () => {
    const testValue = '.hostname';
    const formRuleResult = formRules.hostname(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.dns.hostname.startDot', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"hostName" : returns expected message when value starts is too long for a hostname', () => {
    const testValue = 'There.are.many.variations.of.passages.of.Lorem.Ipsum.available.but.the.majority.have.suffered.alteration.in.some.form.by.injected.humour.or.randomised.words.which.dont.look.even.slightly.believable.If.you.are.going.to.use.a.passage.of.Lorem.Ipsum.you.need';
    const formRuleResult = formRules.hostname(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.hostname.tooLong', key: 'testDisplayKey', max: 253
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"hostName" : returns expected message when value contains invalid characters', () => {
    const testValue = 'www.host*name.com';
    const formRuleResult = formRules.hostname(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.chars', key: 'testDisplayKey', count: 1, chars: '"*"'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"hostName" : returns expected message when value contains a space character', () => {
    const testValue = 'www.host name.com';
    const formRuleResult = formRules.hostname(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.chars', key: 'testDisplayKey', count: 1, chars: 'Space'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"hostName" : returns expected message when hostname label starts with a dash', () => {
    const testValue = 'www.-hostname.com';
    const formRuleResult = formRules.hostname(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.dns.hostname.startHyphen', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"hostName" : returns expected message when hostname label ends with a dash', () => {
    const testValue = 'www.hostname-.com';
    const formRuleResult = formRules.hostname(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.dns.hostname.endHyphen', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"hostName" : returns expected message when hostname label contains a double-dash at the third character position', () => {
    const testValue = 'www.ho--stname.com';
    const formRuleResult = formRules.hostname(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.dns.doubleHyphen', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"hostName" : returns expected message when hostname label is too long', () => {
    const testValue = 'www.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef.com';
    const formRuleResult = formRules.hostname(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.hostname.tooLongLabel', key: 'testDisplayKey', max: 63
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  // this rule is pretty much identical to the standard hostname, but also allows for wildcards
  it('"wildcardHostname" : returns undefined when value is valid hostname', () => {
    const testValue = 'www.url.com';
    const formRuleResult = formRules.wildcardHostname(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"wildcardHostname" : returns expected message when value starts with a dot', () => {
    const testValue = '.hostname';
    const formRuleResult = formRules.wildcardHostname(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.dns.hostname.startDot', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"wildcardHostname" : returns expected message when value starts is too long for a hostname', () => {
    const testValue = 'There.are.many.variations.of.passages.of.Lorem.Ipsum.available.but.the.majority.have.suffered.alteration.in.some.form.by.injected.humour.or.randomised.words.which.dont.look.even.slightly.believable.If.you.are.going.to.use.a.passage.of.Lorem.Ipsum.you.need';
    const formRuleResult = formRules.wildcardHostname(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.hostname.tooLong', key: 'testDisplayKey', max: 253
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"wildcardHostname" : returns expected message when value contains invalid characters', () => {
    const testValue = 'www.host*name.com';
    const formRuleResult = formRules.wildcardHostname(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.chars', key: 'testDisplayKey', count: 1, chars: '"*"'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"wildcardHostname" : returns expected message when value contains a space character', () => {
    const testValue = 'www.host name.com';
    const formRuleResult = formRules.wildcardHostname(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.chars', key: 'testDisplayKey', count: 1, chars: 'Space'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"wildcardHostname" : returns expected message when hostname label starts with a dash', () => {
    const testValue = 'www.-hostname.com';
    const formRuleResult = formRules.wildcardHostname(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.dns.hostname.startHyphen', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"wildcardHostname" : returns expected message when hostname label ends with a dash', () => {
    const testValue = 'www.hostname-.com';
    const formRuleResult = formRules.wildcardHostname(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.dns.hostname.endHyphen', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"wildcardHostname" : returns expected message when hostname label contains a double-dash at the third character position', () => {
    const testValue = 'www.ho--stname.com';
    const formRuleResult = formRules.wildcardHostname(testValue);
    const expectedResult = JSON.stringify({ message: 'validation.dns.doubleHyphen', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"wildcardHostname" : returns expected message when hostname label is too long', () => {
    const testValue = 'www.0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef.com';
    const formRuleResult = formRules.wildcardHostname(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.dns.hostname.tooLongLabel', key: 'testDisplayKey', max: 63
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"wildcardHostname" : returns expected message when wildcard character is not the first part', () => {
    const testValue = 'www.*.hostname.com';
    const formRuleResult = formRules.wildcardHostname(testValue);
    const expectedResult = JSON.stringify({
      message: 'validation.chars', key: 'testDisplayKey', count: 1, chars: '"*"'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"wildcardHostname" : returns expected message when wildcard character is at the beginning but not its own part', () => {
    const testValue = '*hostname.com';
    const formRuleResult = formRules.wildcardHostname(testValue);

    const expectedResult = JSON.stringify({
      message: 'validation.chars', key: 'testDisplayKey', count: 1, chars: '"*"'
    });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"wildcardHostname" : returns valid when wildcard character is the first part', () => {
    const testValue = '*.hostname.com';
    const formRuleResult = formRules.wildcardHostname(testValue);

    expect(formRuleResult).toBeUndefined();
  });

  it('"absolutePath" : return expected message when path doesn\'t begin with a "/"', () => {
    const formRuleResult = formRules.absolutePath('absolute_path');
    const expectedResult = JSON.stringify({ message: 'validation.path', key: 'testDisplayKey' });

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  it('"absolutePath" : returns undefined when path begins with a "/"', () => {
    const formRuleResult = formRules.absolutePath('/absolute_path');

    expect(formRuleResult).toBeUndefined();
  });

  it('"testRule" : always returns the expected string', () => {
    const formRuleResult = formRules.testRule('');
    const expectedResult = 'This is an error returned by the testRule validator';

    expect(formRuleResult).toStrictEqual(expectedResult);
  });

  describe.each([
    ['minValue', 2, [3], [1]],
    ['maxValue', 256, [1], [300]],
    ['betweenValues', [2, 256], [3], [1, 300]],
    ['minLength', 2, ['test'], ['x']],
    ['maxLength', 10, ['x'], ['wrong value']],
    ['betweenLengths', [2, 10], ['test'], ['x', 'wrong value']],
  ])('%p with parameter %p should', (rule, argument, correctValues, wrongValues) => {
    it.each(wrongValues as [])('return error for value %p', (wrong) => {
      const formRuleResult = (formRules as any)[rule](argument)(wrong);

      expect(formRuleResult).not.toBeUndefined();
    });

    it.each(correctValues as [])('return valid for value %p', (correct) => {
      const formRuleResult = (formRules as any)[rule](argument)(correct);

      expect(formRuleResult).toBeUndefined();
    });
  });
});
