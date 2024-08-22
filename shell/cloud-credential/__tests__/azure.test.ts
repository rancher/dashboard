import { mount } from '@vue/test-utils';
import AzureCloudCreds from '@shell/cloud-credential/azure.vue';

const mockStore = {
  getters:  { 'i18n/t': jest.fn() },
  dispatch: () => jest.fn()
};

describe('cloud credentials: Azure', () => {
  const wrapper = mount(AzureCloudCreds, {
    props: {
      value: {
        decodedData: {
          environment:    'my-env',
          subscriptionId: 'my-sub-id',
          clientId:       'my-c-id',
          clientSecret:   'my-c-secret',
        },
        setData: jest.fn()
      }
    },
    global: { mocks: { $store: mockStore } }
  });

  it('should pass all the correct fields when checking if credentials are valid', async() => {
    const spyDispatch = jest.spyOn(mockStore, 'dispatch');

    await wrapper.vm.test();

    expect(spyDispatch).toHaveBeenCalledTimes(1);
    expect(spyDispatch).toHaveBeenCalledWith('management/request', {
      data: {
        environment:    'my-env',
        subscriptionId: 'my-sub-id',
        clientId:       'my-c-id',
        clientSecret:   'my-c-secret',
      },
      method:               'POST',
      redirectUnauthorized: false,
      url:                  '/meta/aksCheckCredentials'
    });
  });
});
