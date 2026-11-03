import { shallowMount } from '@vue/test-utils';
import azure from '@shell/machine-config/azure.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';

describe('component: azure', () => {
  const createWrapper = (mode: string, value: Record<string, unknown>) => shallowMount(azure, {
    propsData: {
      credentialId: 'credentialId',
      uuid:         'uuid',
      mode,
      value,
    },
    global: {
      mocks: {
        $fetch:      jest.fn(),
        $fetchState: { pending: true },
        $store:      { getters: { 'i18n/t': (key: string) => key } },
      },
    },
  });

  describe('default image', () => {
    it('should default a new machine pool to openSUSE Leap 16.0', () => {
      const value: Record<string, unknown> = {};

      createWrapper(_CREATE, value);

      expect(value.image).toStrictEqual('susellc:opensuse-leap-x86-64:gen1:latest');
    });

    it('should leave the plan empty so the driver can set the one matching the image', () => {
      const value: Record<string, unknown> = {};

      createWrapper(_CREATE, value);

      expect(value.plan).toBeUndefined();
    });

    it('should keep the saved image of an existing machine pool', () => {
      const value: Record<string, unknown> = { image: 'canonical:ubuntu-24_04-lts:server-gen1:latest', location: 'westus' };

      createWrapper(_EDIT, value);

      expect(value.image).toStrictEqual('canonical:ubuntu-24_04-lts:server-gen1:latest');
    });
  });
});
