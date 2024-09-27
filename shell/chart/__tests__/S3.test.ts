import { nextTick } from 'vue';
/* eslint-disable jest/no-hooks */
import { mount } from '@vue/test-utils';

import S3 from '@shell/chart/rancher-backup/S3';
import Vuex from 'vuex';

describe('rancher-backup: S3', () => {
  const mockStore = {
    getters: {
      'i18n/t':                    (text: string) => text,
      t:                           (text: string) => text,
      'cluster/all':               () => [],
      'cluster/paginationEnabled': () => false
    }
  };
  const wrapper = mount(S3, {
    plugins: [Vuex],
    global:  { mocks: { $store: mockStore, $fetchState: { pending: false } } }
  });

  it('should emit invalid when form is not filled', () => {
    expect(wrapper.emitted('valid')).toHaveLength(1);
    expect(wrapper.emitted('valid')![0][0]).toBeFalsy();
  });

  it('should emit valid when required fields are filled', async() => {
    const testCases = [
      {
        bucketNameInput: 'val',
        endpointInput:   '',
        result:          false
      },
      {
        bucketNameInput: '',
        endpointInput:   'val',
        result:          false
      }
    ];

    for (const testCase of testCases) {
      wrapper.setProps({
        value: {
          bucketName: testCase.bucketNameInput,
          endpoint:   testCase.endpointInput
        }
      });

      await nextTick();
      expect(wrapper.emitted('valid')).toHaveLength(1);
      expect(wrapper.emitted('valid')![0][0]).toBe(false);
    }

    wrapper.setProps({
      value: {
        bucketName: 'val1',
        endpoint:   'val2'
      }
    });
    await nextTick();
    expect(wrapper.emitted('valid')).toHaveLength(2);
    expect(wrapper.emitted('valid')![1][0]).toBe(true);
  });
});
