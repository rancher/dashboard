import ReceiverConfig, { RECEIVERS_TYPES } from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/receiverConfig.vue';
import Email from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/email.vue';
import Opsgenie from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/opsgenie.vue';
import Pagerduty from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/pagerduty.vue';
import Slack from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/slack.vue';
import Webhook from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/webhook.vue';

const expectedForms: Record<string, unknown> = {
  email:     Email,
  opsgenie:  Opsgenie,
  pagerduty: Pagerduty,
  slack:     Slack,
  webhook:   Webhook,
};

const receiverTypeNames = RECEIVERS_TYPES
  .filter((receiverType) => receiverType.name !== 'custom')
  .map((receiverType) => receiverType.name);

describe('monitoring.coreos.com.alertmanagerconfig/receiverConfig.vue', () => {
  it('should expect a form for every receiver type except custom', () => {
    expect(Object.keys(expectedForms).sort()).toStrictEqual([...receiverTypeNames].sort());
  });

  it.each(receiverTypeNames)('should use the form for receiver type %p', (name) => {
    expect((ReceiverConfig as any).methods.getComponent(name)).toStrictEqual(expectedForms[name]);
  });
});
