import { shallowMount } from '@vue/test-utils';
import LicenseSlideIn from '@shell/components/LicenseSlideIn.vue';

const mount = (props = {}) => shallowMount(LicenseSlideIn, {
  props,
  global: { mocks: { t: (key: string, args: any) => `${ key }${ args ? `-${ JSON.stringify(args) }` : '' }` } }
});

describe('component: LicenseSlideIn', () => {
  describe('meta header', () => {
    it('should show the license id and home page link', () => {
      const wrapper = mount({ licenseId: 'MIT', home: 'https://github.com/o/p' });
      const link = wrapper.find('.home-link');

      expect(wrapper.find('.license-badge').text()).toBe('MIT');
      expect(link.text()).toBe('https://github.com/o/p');
      expect(link.attributes('href')).toBe('https://github.com/o/p');
    });

    it('should show the author below the home page link', () => {
      const wrapper = mount({
        licenseId: 'MIT', home: 'https://github.com/o/p', author: 'Jane Doe'
      });

      expect(wrapper.find('.author').text()).toBe('about.licenses.panel.author-{"author":"Jane Doe"}');
    });

    it.each([
      ['no author is given', {}],
      ['the author is empty', { author: '' }]
    ])('should not show the author line when %s', (_label, props) => {
      const wrapper = mount({ licenseId: 'MIT', ...props });

      expect(wrapper.find('.author').exists()).toBe(false);
    });

    it('should show the raw license expression only when it differs from the license id', () => {
      const differs = mount({ licenseId: 'MIT', licenseField: '(MIT OR Apache-2.0)' });
      const same = mount({ licenseId: 'MIT', licenseField: 'MIT' });

      expect(differs.find('.raw-license').exists()).toBe(true);
      expect(same.find('.raw-license').exists()).toBe(false);
    });
  });

  describe('license body', () => {
    it('should render markdown content with the Markdown component', () => {
      const wrapper = mount({ content: { markdown: '# No license file shipped' } });

      expect(wrapper.findComponent({ name: 'Markdown' }).props('value')).toBe('# No license file shipped');
      expect(wrapper.find('.license-body-text').exists()).toBe(false);
    });

    it('should render plain text content as preformatted text', () => {
      const wrapper = mount({ content: { text: 'MIT License\n\nCopyright (c) 2024' } });

      expect(wrapper.find('.license-body-text').text()).toContain('MIT License');
      expect(wrapper.findComponent({ name: 'Markdown' }).exists()).toBe(false);
    });

    it.each([
      ['content is null', null],
      ['content has neither markdown nor text', {}]
    ])('should show the empty state when %s', (_label, content) => {
      const wrapper = mount({ licenseId: 'MIT', content });

      expect(wrapper.find('.empty').exists()).toBe(true);
      expect(wrapper.find('.declared').text()).toBe('about.licenses.panel.declaredAs-{"license":"MIT"}');
    });
  });
});
