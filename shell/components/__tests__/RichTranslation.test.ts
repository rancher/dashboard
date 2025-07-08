import { mount } from '@vue/test-utils';
import RichTranslation from '../RichTranslation.vue';
import { createStore } from 'vuex';
import { h } from 'vue';

// Mock the i18n store getter
const mockI18nStore = createStore({
  getters: {
    'i18n/t': () => (key: string, args: any, noMarkup: boolean) => {
      const translations: Record<string, string> = {
        'test.simple':   'Hello World',
        'test.html':     'This is <b>bold</b> and <i>italic</i>.',
        'test.custom':   'This has a <customLink>link</customLink> and <anotherTag/>.',
        'test.mixed':    'Text before <tag1>content1</tag1> text in middle <tag2/> text after.',
        'test.noString': 123,
      };

      return translations[key] || key;
    },
  },
});

describe('richTranslation', () => {
  it('renders a simple translation correctly', () => {
    const wrapper = mount(RichTranslation, {
      props:  { k: 'test.simple' },
      global: { plugins: [mockI18nStore] },
    });

    expect(wrapper.text()).toBe('Hello World');
    expect(wrapper.html()).toContain('<span>Hello World</span>');
  });

  it('renders HTML tags correctly', () => {
    const wrapper = mount(RichTranslation, {
      props:  { k: 'test.html' },
      global: { plugins: [mockI18nStore] },
    });

    expect(wrapper.html()).toContain('<span><span>This is </span><b>bold</b><span> and </span><i>italic</i><span>.</span></span>');
    expect(wrapper.find('b').exists()).toBe(true);
    expect(wrapper.find('i').exists()).toBe(true);
  });

  it('renders custom components via slots (enclosing tag)', () => {
    const wrapper = mount(RichTranslation, {
      props:  { k: 'test.custom' },
      slots:  { customLink: ({ content }: { content: string }) => h('a', { href: '/test' }, content) },
      global: { plugins: [mockI18nStore] },
    });

    expect(wrapper.html()).toContain('<a href="/test">link</a>');
    expect(wrapper.find('a').text()).toBe('link');
  });

  it('renders custom components via slots (self-closing tag)', () => {
    const wrapper = mount(RichTranslation, {
      props:  { k: 'test.custom' },
      slots:  { anotherTag: () => h('span', { class: 'self-closed' }, 'Self-closed content') },
      global: { plugins: [mockI18nStore] },
    });

    expect(wrapper.html()).toContain('<span class="self-closed">Self-closed content</span>');
    expect(wrapper.find('.self-closed').text()).toBe('Self-closed content');
  });

  it('handles mixed content with multiple custom components', () => {
    const wrapper = mount(RichTranslation, {
      props: { k: 'test.mixed' },
      slots: {
        tag1: ({ content }: { content: string }) => h('strong', {}, content),
        tag2: () => h('em', {}, 'emphasized'),
      },
      global: { plugins: [mockI18nStore] },
    });

    expect(wrapper.html()).toContain('<span>Text before </span><strong>content1</strong><span> text in middle </span><em>emphasized</em><span> text after.</span>');
    expect(wrapper.find('strong').text()).toBe('content1');
    expect(wrapper.find('em').text()).toBe('emphasized');
  });

  it('renders correctly when translation is not a string', () => {
    const wrapper = mount(RichTranslation, {
      props:  { k: 'test.noString' },
      global: { plugins: [mockI18nStore] },
    });

    expect(wrapper.text()).toBe('123');
    expect(wrapper.html()).toContain('<span>123</span>');
  });

  it('uses the specified root tag', () => {
    const wrapper = mount(RichTranslation, {
      props: {
        k:   'test.simple',
        tag: 'div',
      },
      global: { plugins: [mockI18nStore] },
    });

    expect(wrapper.html()).toContain('<div><span>Hello World</span></div>');
    expect(wrapper.find('div').exists()).toBe(true);
    expect(wrapper.find('span').exists()).toBe(true); // Inner span for content
  });

  it('falls back to raw tag content if slot is not provided for enclosing tag', () => {
    const wrapper = mount(RichTranslation, {
      props:  { k: 'test.custom' }, // Contains <customLink> and <anotherTag/>
      // No slots provided
      global: { plugins: [mockI18nStore] },
    });

    expect(wrapper.html()).toContain('<span>This has a </span><span>&lt;customLink&gt;link&lt;/customLink&gt;</span><span> and </span><span>&lt;anotherTag/&gt;</span><span>.</span>');
    expect(wrapper.find('a').exists()).toBe(false); // Should not render as <a>
  });

  it('falls back to raw tag content if slot is not provided for self-closing tag', () => {
    const wrapper = mount(RichTranslation, {
      props:  { k: 'test.custom' }, // Contains <customLink> and <anotherTag/>
      // No slots provided
      global: { plugins: [mockI18nStore] },
    });

    expect(wrapper.html()).toContain('<span>&lt;anotherTag/&gt;</span>');
    expect(wrapper.find('.self-closed').exists()).toBe(false); // Should not render with custom class
  });
});
