import HookOption from '@shell/components/form/HookOption.vue';
import { _EDIT } from '@shell/config/query-params';
import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';

describe('component: HookOption', () => {
  it('should render a row  of inputs per http header', async() => {
    const wrapper = shallowMount(HookOption, { props: { value: { httpGet: {} }, mode: _EDIT } });

    const addButton = wrapper.get('[data-testid="hookoption-add-header-button"]');

    addButton.trigger('click');

    await nextTick();

    let headerRows = wrapper.findAll('[data-testid="hookoption-header-row"]');

    expect(headerRows).toHaveLength(1);

    addButton.trigger('click');

    await nextTick();

    headerRows = wrapper.findAll('[data-testid="hookoption-header-row"]');

    expect(headerRows).toHaveLength(2);
  });
});
