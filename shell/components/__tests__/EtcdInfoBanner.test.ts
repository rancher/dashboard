import { mount } from '@vue/test-utils';
import EtcdInfoBanner from '../EtcdInfoBanner.vue';
import { CATALOG } from '@shell/config/types';

describe('component: EtcdInfoBanner', () => {
  it('should perform fetch correctly', async() => {
    const mockCanList = jest.fn((resource: string) => true);
    const mockDispatch = jest.fn((resource: string, param: any) => ({ data: { result: [] } }));

    const wrapper = mount(
      EtcdInfoBanner,
      {
        global: {
          mocks: {
            $store: {
              getters: {
                'i18n/t':          () => 'Test',
                currentProduct:    { inStore: 'cluster' },
                'cluster/canList': mockCanList,
                currentCluster:    { id: 'local' },
              },
              dispatch: mockDispatch,
            },
            $fetchState: { pending: false }
          },
        }
      });

    await (EtcdInfoBanner as any).fetch.call(wrapper.vm);

    // canList should have been called once
    expect(mockCanList.mock.calls).toHaveLength(1);
    expect(mockCanList.mock.calls[0][0]).toBe(CATALOG.APP);

    // check that the if in the find method worked correctly
    expect(mockDispatch.mock.calls).toHaveLength(4);
    expect(mockDispatch.mock.calls[0][0]).toBe('cluster/find');
  });
});
