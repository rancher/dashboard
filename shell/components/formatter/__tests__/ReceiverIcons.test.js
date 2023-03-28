import ReceiverIcons from '@shell/components/formatter/ReceiverIcons.vue';
import { PANDARIA_WEBHOOK_URL } from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/pandariaWebhook.vue';

const pandariaWebhookKey = 'monitoringReceiver.pandariaWebhook.label';
const webhookKey = 'monitoringReceiver.webhook.label';

describe('component: ReceiverIcons, methods: getReceiverTypes', () => {
  it('only one pandaria webhook', () => {
    const localThis = { t: key => key };
    const out = ReceiverIcons.methods.getReceiverTypes.call(localThis, {
      name:           'test',
      webhookConfigs: [{
        httpConfig:   { tlsConfig: {} },
        sendResolved: false,
        url:          `${ PANDARIA_WEBHOOK_URL }test-0`
      }]
    });

    expect(out[pandariaWebhookKey].count).toBe(1);
  });

  it('more pandaria webhooks', () => {
    const localThis = { t: key => key };
    const out = ReceiverIcons.methods.getReceiverTypes.call(localThis, {
      name:           'test',
      webhookConfigs: [{
        httpConfig:   { tlsConfig: {} },
        sendResolved: false,
        url:          `${ PANDARIA_WEBHOOK_URL }test-0`
      }, {
        httpConfig:   { tlsConfig: {} },
        sendResolved: false,
        url:          `${ PANDARIA_WEBHOOK_URL }test-1`
      }, {
        httpConfig:   { tlsConfig: {} },
        sendResolved: false,
        url:          `${ PANDARIA_WEBHOOK_URL }test-2`
      }]
    });

    expect(out[pandariaWebhookKey].count).toBe(3);
  });

  it('three pandaria webhooks and two other types', () => {
    const localThis = { t: key => key };
    const out = ReceiverIcons.methods.getReceiverTypes.call(localThis, {
      name:           'test',
      webhookConfigs: [{
        httpConfig:   { tlsConfig: {} },
        sendResolved: false,
        url:          `${ PANDARIA_WEBHOOK_URL }test-0`
      }, {
        httpConfig:   { tlsConfig: {} },
        sendResolved: false,
        url:          `${ PANDARIA_WEBHOOK_URL }test-1`
      }, {
        httpConfig:   { tlsConfig: {} },
        sendResolved: false,
        url:          `${ PANDARIA_WEBHOOK_URL }test-2`
      }, {
        httpConfig:   { tlsConfig: {} },
        sendResolved: false,
        url:          'other1'
      }, {
        httpConfig:   { tlsConfig: {} },
        sendResolved: false,
        url:          'other2'
      }]
    });

    expect(out[pandariaWebhookKey].count).toBe(3);
    expect(out[webhookKey].count).toBe(2);
  });

  it('none pandaria webhooks and two other types', () => {
    const localThis = { t: key => key };
    const out = ReceiverIcons.methods.getReceiverTypes.call(localThis, {
      name:           'test',
      webhookConfigs: [{
        httpConfig:   { tlsConfig: {} },
        sendResolved: false,
        url:          'other1'
      }, {
        httpConfig:   { tlsConfig: {} },
        sendResolved: false,
        url:          'other2'
      }]
    });

    expect(out[webhookKey].count).toBe(2);
  });
});
