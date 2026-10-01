import { flushPromises, mount } from '@vue/test-utils';
import ShareUsageDataDialog from '@shell/dialog/ShareUsageDataDialog.vue';
import { RadioGroup } from '@components/Form/Radio';
import { SHARE_USAGE_DATA } from '@shell/store/prefs';

const createWrapper = (dispatch = jest.fn().mockResolvedValue(undefined)) => {
  const store = {
    dispatch,
    getters: {
      'i18n/t':      (key: string) => key,
      'i18n/exists': () => true,
    },
  };

  const wrapper = mount(ShareUsageDataDialog, {
    global: {
      provide: { store },
      mocks:   { $store: store, t: (key: string) => key },
    },
  });

  return { wrapper, dispatch };
};

const confirmButton = (wrapper: any) => wrapper.find('[data-testid="share-usage-data-confirm"]');
const choose = (wrapper: any, value: string) => wrapper.findComponent(RadioGroup).vm.$emit('update:value', value);

describe('component: ShareUsageDataDialog', () => {
  it('should ask whether to share anonymous usage data', () => {
    const { wrapper } = createWrapper();

    expect(wrapper.find('h3').text()).toStrictEqual('shareUsageData.title');
  });

  it('should offer to share or not to share', () => {
    const { wrapper } = createWrapper();

    const values = wrapper.findComponent(RadioGroup).props('options').map((o: any) => o.value);

    expect(values).toStrictEqual(['share', 'dont-share']);
  });

  it('should start without a choice', () => {
    const { wrapper } = createWrapper();

    expect(wrapper.findComponent(RadioGroup).props('value')).toBeNull();
  });

  // Neither option is picked for the admin, so they must make an explicit choice
  it('should hold the confirm button until an option is picked', async() => {
    const { wrapper } = createWrapper();

    expect(confirmButton(wrapper).attributes('disabled')).toBeDefined();

    await choose(wrapper, 'share');

    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('should say a choice is required until an option is picked', async() => {
    const { wrapper } = createWrapper();

    expect(wrapper.find('.share-usage-data__required').exists()).toStrictEqual(true);

    await choose(wrapper, 'dont-share');

    expect(wrapper.find('.share-usage-data__required').exists()).toStrictEqual(false);
  });

  it('should not save or close when confirmed without a choice', async() => {
    const { wrapper, dispatch } = createWrapper();

    await confirmButton(wrapper).trigger('click');

    expect(dispatch).toHaveBeenCalledTimes(0);
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it.each(['share', 'dont-share'])('should save %s and close when confirmed', async(value) => {
    const { wrapper, dispatch } = createWrapper();

    await choose(wrapper, value);
    await confirmButton(wrapper).trigger('click');
    await flushPromises();

    expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: SHARE_USAGE_DATA, value });
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should stay open and report the error when saving fails', async() => {
    const err = new Error('boom');
    const dispatch = jest.fn().mockImplementation((action: string) => (action === 'prefs/set' ? Promise.reject(err) : Promise.resolve()));
    const { wrapper } = createWrapper(dispatch);

    await choose(wrapper, 'share');
    await confirmButton(wrapper).trigger('click');
    await flushPromises();

    expect(dispatch).toHaveBeenCalledWith('growl/fromError', { title: 'shareUsageData.title-{}', err });
    expect(wrapper.emitted('close')).toBeUndefined();
    expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('should show what is collected by default', () => {
    const { wrapper } = createWrapper();

    expect(wrapper.find('[data-testid="share-usage-data-details"]').isVisible()).toStrictEqual(true);
    expect(wrapper.find('[data-testid="share-usage-data-details-toggle"]').attributes('aria-expanded')).toStrictEqual('true');
  });

  it('should collapse the details when the toggle is clicked', async() => {
    const { wrapper } = createWrapper();
    const toggle = wrapper.find('[data-testid="share-usage-data-details-toggle"]');

    await toggle.trigger('click');

    expect(wrapper.find('[data-testid="share-usage-data-details"]').isVisible()).toStrictEqual(false);
    expect(toggle.attributes('aria-expanded')).toStrictEqual('false');
  });

  it('should open the privacy policy in a new tab', () => {
    const { wrapper } = createWrapper();
    const link = wrapper.find('[data-testid="share-usage-data-privacy"]');

    expect({ href: link.attributes('href'), target: link.attributes('target') }).toStrictEqual({
      href:   'https://www.suse.com/company/policies/privacy/',
      target: '_blank',
    });
  });
});
