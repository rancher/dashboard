import fs from 'fs';
import path from 'path';
import jsyaml from 'js-yaml';
import { mount, VueWrapper } from '@vue/test-utils';
import Password from '@shell/components/form/Password.vue';

// The accessible name of the reveal control comes straight out of the translations, so
// the assertions below are made against the real strings rather than a mocked `t`.
const translations = jsyaml.load(
  fs.readFileSync(path.resolve(__dirname, '../../../assets/translations/en-us.yaml'), 'utf8')
) as Record<string, any>;

const translate = (key: string, args?: Record<string, string>): string => {
  const raw = key.split('.').reduce<any>((acc, part) => acc?.[part], translations);

  if (typeof raw !== 'string') {
    throw new Error(`Missing translation for "${ key }"`);
  }

  return raw.replace(/{\s*(\w+)\s*}/g, (_match, name) => args?.[name] ?? '');
};

function createWrapper(props = {}): VueWrapper<any, any> {
  return mount(Password, {
    props:  { label: 'Password', ...props },
    global: { mocks: { $store: { getters: { 'i18n/t': translate } } } },
  }) as VueWrapper<any, any>;
}

describe('component: Password', () => {
  describe('a11y: reveal control', () => {
    it('should use an accessible name that contains the visible label when hidden', () => {
      const wrapper = createWrapper();

      const toggle = wrapper.find('a.hide-show');

      expect(toggle.text()).toBe('Show');
      // WCAG 2.5.3 Label in Name - "Reveal Password" would not match the visible "Show"
      expect(toggle.attributes('aria-label')).toBe('Show Password');
      expect(toggle.attributes('aria-label')).toContain(toggle.text());
    });

    it('should use an accessible name that contains the visible label when revealed', async() => {
      const wrapper = createWrapper();

      await wrapper.find('a.hide-show').trigger('click');

      const toggle = wrapper.find('a.hide-show');

      expect(toggle.text()).toBe('Hide');
      expect(toggle.attributes('aria-label')).toBe('Hide Password');
      expect(toggle.attributes('aria-label')).toContain(toggle.text());
    });

    it('should name the field it applies to, so it is unique on a page with several passwords', () => {
      const current = createWrapper({ label: 'Current Password' });
      const updated = createWrapper({ label: 'New Password' });

      expect(current.find('a.hide-show').attributes('aria-label')).toBe('Show Current Password');
      expect(updated.find('a.hide-show').attributes('aria-label')).toBe('Show New Password');
    });
  });
});
