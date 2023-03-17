export const RECEIVERS_TYPES = [
  {
    name:  'slack',
    label: 'monitoringReceiver.slack.label',
    title: 'monitoringReceiver.slack.title',
    info:  'monitoringReceiver.slack.info',
    key:   'slack_configs',
    logo:  require(`~shell/assets/images/vendor/slack.svg`)
  },
  {
    name:  'email',
    label: 'monitoringReceiver.email.label',
    title: 'monitoringReceiver.email.title',
    key:   'email_configs',
    logo:  require(`~shell/assets/images/vendor/email.svg`)
  },
  {
    name:  'pagerduty',
    label: 'monitoringReceiver.pagerduty.label',
    title: 'monitoringReceiver.pagerduty.title',
    info:  'monitoringReceiver.pagerduty.info',
    key:   'pagerduty_configs',
    logo:  require(`~shell/assets/images/vendor/pagerduty.svg`)
  },
  {
    name:  'opsgenie',
    label: 'monitoringReceiver.opsgenie.label',
    title: 'monitoringReceiver.opsgenie.title',
    key:   'opsgenie_configs',
    logo:  require(`~shell/assets/images/vendor/email.svg`)
  },
  {
    name:      'webhook',
    label:     'monitoringReceiver.webhook.label',
    title:     'monitoringReceiver.webhook.title',
    key:       'webhook_configs',
    logo:      require(`~shell/assets/images/vendor/webhook.svg`),
    banner:    'webhook.banner',
    addButton: 'webhook.add'
  },
  {
    name:  'custom',
    label: 'monitoringReceiver.custom.label',
    title: 'monitoringReceiver.custom.title',
    info:  'monitoringReceiver.custom.info',
    key:   'webhook_configs',
    logo:  require(`~shell/assets/images/vendor/custom.svg`)
  },
];

export function _getReceiverTypes(resource, { translate }) {
  const types = RECEIVERS_TYPES
    .filter(type => type.name !== 'custom' && resource.spec[type.key]?.length > 0)
    .map(type => translate(type.label));

  const expectedKeys = RECEIVERS_TYPES.map(type => type.key).filter(key => key !== 'custom');

  expectedKeys.push('name');

  const customKeys = Object.keys(resource.spec)
    .filter(key => !expectedKeys.includes(key));

  if (customKeys.length > 0) {
    const customLabel = translate(RECEIVERS_TYPES.find(type => type.name === 'custom').label);

    types.push(customLabel);
  }

  return types;
}

export const calculatedFields = [
  { name: 'receiverTypes', func: _getReceiverTypes }
];
