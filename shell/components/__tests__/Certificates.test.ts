import { shallowMount } from '@vue/test-utils';
import Certificates from '@shell/components/Certificates.vue';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

describe('component: Certificates', () => {
  it('show correct \'expiring\' banner', async() => {
    const wrapper = shallowMount(Certificates, {
      data() {
        return {
          schema: {},
          certs:  [{ certState: STATES_ENUM.EXPIRING }]
        };
      },
      global: {
        mocks: {
          $fetchState: { pending: false },
          $store:      {
            getters: {
              'i18n/t':            (l: string) => { },
              'cluster/schemaFor': () => ({ })
            }
          }
        },
      },
    });

    const expiringBanner = wrapper.find('[data-testid="cert-expiring-banner"]');

    expect(expiringBanner.exists()).toBe(true);
  });
});
