import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';

import TableViewPublishModal from '@shell/components/TableViews/TableViewPublishModal.vue';

// Draws its slots in place, as RcModal does, without the teleport
const RcModalStub = {
  props:    ['show', 'title'],
  emits:    ['close'],
  template: `<div :data-title="title"><slot /><slot name="actions" :close="() => $emit('close')"><button data-testid="rc-modal-cancel" @click="$emit('close')">Cancel</button><slot name="primary-action" /></slot></div>`,
};

function mountModal(props: { hasFilter?: boolean } = {}) {
  const store = createStore({ getters: { 'i18n/exists': () => () => false, 'i18n/t': () => (key: string) => key } });

  return mount(TableViewPublishModal, {
    props:  { modal: { show: true, onClose: jest.fn() }, ...props },
    global: { plugins: [store], stubs: { RcModal: RcModalStub } },
  });
}

describe('TableViewPublishModal', () => {
  it('should be titled Publish, and say it makes the view visible to all users', () => {
    const wrapper = mountModal();

    expect(wrapper.find('[data-title]').attributes('data-title')).toContain('tableViews.publish.title');
    expect(wrapper.find('p').text()).toContain('tableViews.publish.body');
  });

  it('should say that the filter is shared, when the view has one', () => {
    expect(mountModal({ hasFilter: true }).find('[data-testid="table-views-publish-warning"]').text()).toContain('tableViews.filterWarning');
  });

  it('should say nothing of a filter the view doesn\'t have', () => {
    expect(mountModal().find('[data-testid="table-views-publish-warning"]').exists()).toBe(false);
  });

  it('should publish, and close, when confirmed', async() => {
    const wrapper = mountModal();

    await wrapper.find('[data-testid="table-views-publish-confirm"]').trigger('click');

    expect(wrapper.emitted('publish')).toHaveLength(1);
    expect(wrapper.props('modal').onClose).toHaveBeenCalledTimes(1);
  });

  it('should close without publishing on Cancel', async() => {
    const wrapper = mountModal();

    await wrapper.find('[data-testid="rc-modal-cancel"]').trigger('click');

    expect(wrapper.emitted('publish')).toBeUndefined();
    expect(wrapper.props('modal').onClose).toHaveBeenCalledTimes(1);
  });
});
