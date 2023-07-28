/* eslint-disable jest/no-hooks */
import { mount, createLocalVue } from '@vue/test-utils';

import S3 from '@shell/chart/rancher-backup/S3';
import Vuex from 'vuex';

const localVue = createLocalVue();

localVue.use(Vuex);

describe('rancher-backup: S3', () => {
  const mockStore = { getters: { 'i18n/t': (text: string) => text, t: (text: string) => text } };
  const wrapper = mount(S3, { mocks: { $store: mockStore } });

  it('should emit invalid when form is not filled', () => {
    expect(wrapper.emitted('valid')).toHaveLength(1);
    expect(wrapper.emitted('valid')![0][0]).toBeFalsy();
  });

  it('should emit valid when required fields are filled', async() => {
    const bucketName = wrapper.find('[data-testid="S3-bucketName"]').find('input');
    const endpoint = wrapper.find('[data-testid="S3-endpoint"]').find('input');
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
      bucketName.setValue(testCase.bucketNameInput);
      endpoint.setValue(testCase.endpointInput);
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('valid')).toHaveLength(1);
      expect(wrapper.emitted('valid')![0][0]).toBe(false);
    }

    bucketName.setValue('val1');
    endpoint.setValue('val2');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('valid')).toHaveLength(2);
    expect(wrapper.emitted('valid')![1][0]).toBe(true);
  });
});
