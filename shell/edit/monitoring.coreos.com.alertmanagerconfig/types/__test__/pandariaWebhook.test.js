import { mount } from '@vue/test-utils';
import pandariaWebhook, { WEBHOOK_TYPES } from '@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/pandariaWebhook.vue';
import { _CREATE } from '@shell/config/query-params';

describe('component: pandariaWebhook', () => {
  it('default should display all the inputs', () => {
    const wrapper = mount(pandariaWebhook, {
      propsData: {
        value: {},
        mode:  _CREATE,
      }
    });

    const inputWraps = wrapper.findAll('[data-testid^=input-config-]');

    expect(inputWraps).toHaveLength(5);
  });

  it.each([
    ['ALIYUN_SMS', 7],
    ['DINGTALK', 5],
  ])('should display all the inputs on %p type', (field, expectd) => {
    const newValue = WEBHOOK_TYPES[field];
    const wrapper = mount(pandariaWebhook, {
      propsData: {
        value: {},
        mode:  _CREATE,
      },
      data: () => ({ selectedWebhookType: newValue })
    });

    const inputWraps = wrapper.findAll('[data-testid^=input-config-]');

    expect(inputWraps).toHaveLength(expectd);
  });

  it('ALIYUN_SMS should display phone number input', () => {
    const wrapper = mount(pandariaWebhook, {
      propsData: {
        value: {},
        mode:  _CREATE,
      }
    });

    const inputWraps = wrapper.find('[data-testid=input-config-phone]');

    expect(inputWraps).toBeTruthy();
  });
});
