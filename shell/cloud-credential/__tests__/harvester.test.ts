import { mount } from '@vue/test-utils';
import HarvesterCloudCreds from '@shell/cloud-credential/harvester.vue';

const mockStore = { getters: { 'i18n/t': jest.fn() } };

describe('cloud credentials: Harvester', () => {
  const wrapper = mount(HarvesterCloudCreds, {
    props:  { value: {} },
    global: { mocks: { $store: mockStore } }
  });

  it('should display the warning banner for token expiration', async() => {
    const warningBanner = wrapper.find('[data-testid="harvester-token-expiration-warning-banner"]');

    expect(warningBanner.exists()).toBe(true);
    expect(warningBanner.isVisible()).toBe(true);
  });
});
