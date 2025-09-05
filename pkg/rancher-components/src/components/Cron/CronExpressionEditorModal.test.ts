/* eslint-disable jest/no-hooks */
import { mount, VueWrapper } from '@vue/test-utils';
import { createStore } from 'vuex';
import CronExpressionEditorModal from '@components/Cron/CronExpressionEditorModal.vue';

const store = createStore({});

describe('cronExpressionEditorModal', () => {
  let wrapper: VueWrapper<any>;
  let modalsDiv: HTMLElement;

  beforeEach(() => {
    modalsDiv = document.createElement('div');
    modalsDiv.id = 'modals';
    document.body.appendChild(modalsDiv);
  });

  afterEach(() => {
    wrapper?.unmount();
    modalsDiv.remove();
  });

  const factory = (props = {}) => mount(CronExpressionEditorModal, {
    global: {
      plugins: [store],
      stubs:   {
        AppModal:             true,
        CronExpressionEditor: true,
      },
    },
    props: {
      cronExpression: '0 0 * * *',
      show:           true,
      ...props,
    },
  });

  const getEmitted = (event: string) => wrapper.emitted(event) as unknown[][] || [];

  it('renders modal with correct initial props', () => {
    wrapper = factory();

    expect(wrapper.props('cronExpression')).toBe('0 0 * * *');
    expect(wrapper.props('show')).toBe(true);
  });

  it('updates localCron when cronExpression prop changes', async() => {
    wrapper = factory();
    await wrapper.setProps({ cronExpression: '*/5 * * * *' });

    expect(wrapper.vm.localCron).toBe('*/5 * * * *');
  });

  it('emits update:cronExpression and update:show on confirm', async() => {
    wrapper = factory();
    await wrapper.vm.confirmCron?.();

    const cronEmits = getEmitted('update:cronExpression');
    const showEmits = getEmitted('update:show');

    expect(cronEmits).toHaveLength(1);
    expect(cronEmits[0][0]).toBe('0 0 * * *');

    expect(showEmits).toHaveLength(1);
    expect(showEmits[0][0]).toBe(false);
  });

  it('emits update:show on cancel', async() => {
    wrapper = factory();
    await wrapper.vm.closeModal?.();

    const showEmits = getEmitted('update:show');

    expect(showEmits).toHaveLength(1);
    expect(showEmits[0][0]).toBe(false);
  });
});
