import { mount } from '@vue/test-utils';
import AzureCloudCreds from '@shell/cloud-credential/azure.vue';

const mockStore = {
  getters:  { 'i18n/t': jest.fn() },
  dispatch: () => jest.fn()
};

describe('cloud credentials: Azure', () => {
  const wrapper = mount(AzureCloudCreds, {
    propsData: {
      value: {
        decodedData: {
          environment:    '',
          subscriptionId: '',
          clientId:       '',
          clientSecret:   '',
        },
        setData: jest.fn()
      }
    },
    mocks: { $store: mockStore }
  });

  it('should pass all the correct fields when checking if credentials are valid', async() => {
    const spyDispatch = jest.spyOn(mockStore, 'dispatch');

    wrapper.setData({
      value: {
        decodedData: {
          environment:    'my-env',
          subscriptionId: 'my-sub-id',
          clientId:       'my-c-id',
          clientSecret:   'my-c-secret',
        }
      }
    });

    await wrapper.vm.test();

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
