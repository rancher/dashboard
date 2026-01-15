import { mount } from '@vue/test-utils';
import TruncatedMessage from '@shell/components/TruncatedMessage.vue';
import { createStore } from 'vuex';

const mockT = (key: string) => {
  if (key === 'generic.readMore') {
    return 'read more';
  }

  return undefined; // Return undefined to trigger fallback
};

const createMockStore = () => {
  return createStore({
    getters: {
      'i18n/t': () => mockT,
    }
  });
};

describe('TruncatedMessage Component', () => {
  it('renders short message without truncation', () => {
    const shortMessage = 'This is a short message.';
    const wrapper = mount(TruncatedMessage, {
      props: { message: shortMessage },
      global: {
        plugins: [createMockStore()],
      }
    });

    expect(wrapper.text()).toContain(shortMessage);
    // The link should exist even for short messages
    expect(wrapper.find('.read-more-link').exists()).toBe(true);
  });

  it('renders message with default max lines (3)', () => {
    const message = 'This is a test message.';
    const wrapper = mount(TruncatedMessage, {
      props:  { message },
      global: {
        plugins: [createMockStore()],
      }
    });

    const truncatedText = wrapper.find('.truncated-text');

    expect(truncatedText.exists()).toBe(true);
  });

  it('renders message with custom max lines', () => {
    const message = 'This is a test message.';
    const wrapper = mount(TruncatedMessage, {
      props: {
        message,
        maxLines: 5
      },
      global: {
        plugins: [createMockStore()],
      }
    });

    const truncatedText = wrapper.find('.truncated-text');

    expect(truncatedText.exists()).toBe(true);
  });

  it('shows "read more" link when not expanded', () => {
    const message = 'This is a test message.';
    const wrapper = mount(TruncatedMessage, {
      props:  { message },
      global: {
        plugins: [createMockStore()],
      }
    });

    const readMoreLink = wrapper.find('.read-more-link');

    expect(readMoreLink.exists()).toBe(true);
    // Text should contain "read more" even if it's wrapped with %
    expect(readMoreLink.text()).toContain('read more');
  });

  it('expands message when "read more" is clicked', async() => {
    const message = 'This is a test message that should be expanded.';
    const wrapper = mount(TruncatedMessage, {
      props:  { message },
      global: {
        plugins: [createMockStore()],
      }
    });

    const readMoreLink = wrapper.find('.read-more-link');

    await readMoreLink.trigger('click');

    // After expansion, the truncated text should not be visible
    expect(wrapper.find('.truncated-text').exists()).toBe(false);
    expect(wrapper.find('.read-more-link').exists()).toBe(false);
    
    // The full message should be displayed
    expect(wrapper.text()).toBe(message);
  });

  it('emits expand event when "read more" is clicked', async() => {
    const message = 'This is a test message.';
    const wrapper = mount(TruncatedMessage, {
      props:  { message },
      global: {
        plugins: [createMockStore()],
      }
    });

    const readMoreLink = wrapper.find('.read-more-link');

    await readMoreLink.trigger('click');

    expect(wrapper.emitted('expand')).toBeTruthy();
    expect(wrapper.emitted('expand')?.length).toBe(1);
  });
});
