import { mount } from '@vue/test-utils';
import RichTranslation from '../RichTranslation.vue';
import { createStore } from 'vuex';
import { h } from 'vue';

// Mock the i18n store getter
const mockI18nStore = createStore({
  getters: {
    'i18n/t': () => (key: string, args: any, noMarkup: boolean) => {
      const translations: Record<string, string | number> = {
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
  it('fills the translation\'s placeholders from args', () => {
    const store = createStore({ getters: { 'i18n/t': () => (key: string, args: Record<string, unknown> = {}) => `Export <b>${ args.count }</b> from ${ args.name }` } });
    const wrapper = mount(RichTranslation, {
      props:  { k: 'any', args: { count: 3, name: 'Mine' } },
      global: { plugins: [store] },
    });

    expect(wrapper.text()).toBe('Export 3 from Mine');
    expect(wrapper.html()).toContain('<b>3</b>');
  });

  it('translates in the language the user has chosen, not the default', () => {
    // As the real getter does: a language named in the third argument wins, and anything that
    // is not a language there - the `true` this used to pass - falls back to the default
    const translations: Record<string, Record<string, string>> = {
      'en-us':   { greeting: 'Hello' },
      'zh-hans': { greeting: '你好' },
    };
    const store = createStore({
      getters: {
        'i18n/t': () => (key: string, _args: unknown, language?: string) => {
          // `language || selected`, exactly as localeToUse does it
          const locale = language || 'zh-hans';

          return translations[locale]?.[key] ?? translations['en-us'][key];
        }
      }
    });
    const wrapper = mount(RichTranslation, {
      props:  { k: 'greeting' },
      global: { plugins: [store] },
    });

    expect(wrapper.text()).toBe('你好');
  });

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

    expect(wrapper.find('a').exists()).toBe(false); // Should not render as <a>
  });
});
