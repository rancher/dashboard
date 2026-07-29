import { shallowMount } from '@vue/test-utils';
import SelectIconGrid from '@shell/components/SelectIconGrid.vue';

const mockRows = [
  {
    key:         'option-a',
    name:        'Option A',
    description: 'First option',
    icon:        '/icons/a.png',
    disabled:    false,
  },
  {
    key:         'option-b',
    name:        'Option B',
    description: 'Second option',
    icon:        '/icons/b.png',
    disabled:    false,
  },
  {
    key:      'option-c',
    name:     'Option C',
    icon:     '/icons/c.png',
    disabled: true,
  },
];

describe('component: SelectIconGrid', () => {
  describe('grid container', () => {
    it('should have role="group" on the grid container', () => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });

      expect(wrapper.find('.grid').attributes('role')).toBe('group');
    });

    it('should set aria-label on the grid container when ariaLabel prop is provided', () => {
      const wrapper = shallowMount(SelectIconGrid, {
        props: {
          rows:      mockRows,
          ariaLabel: 'Select a cluster type',
        },
      });

      expect(wrapper.find('.grid').attributes('aria-label')).toBe('Select a cluster type');
    });

    it('should not set aria-label on the grid container when ariaLabel prop is not provided', () => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });

      expect(wrapper.find('.grid').attributes('aria-label')).toBeUndefined();
    });

    it('should not render the grid when rows is empty', () => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: [] } });

      expect(wrapper.find('.grid').exists()).toBe(false);
    });
  });

  describe('item roles (asLink=false)', () => {
    it('should render items as div elements', () => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });
      const items = wrapper.findAll('.item');

      items.forEach((item) => {
        expect(item.element.tagName).toBe('DIV');
      });
    });

    it('should have role="button" on each item when asLink is false', () => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });
      const items = wrapper.findAll('.item');

      items.forEach((item) => {
        expect(item.attributes('role')).toBe('button');
      });
    });

    it('should set aria-label on each item from the nameField', () => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });
      const items = wrapper.findAll('.item');

      expect(items[0].attributes('aria-label')).toBe('Option A');
      expect(items[1].attributes('aria-label')).toBe('Option B');
      expect(items[2].attributes('aria-label')).toBe('Option C');
    });
  });

  describe('item roles (asLink=true)', () => {
    const linkRows = [
      {
        _key:  'link-a',
        label: 'Link A',
        link:  'https://example.com/a',
      },
      {
        _key:     'link-b',
        label:    'Link B',
        link:     'https://example.com/b',
        disabled: true,
      },
    ];

    it('should render items as anchor elements', () => {
      const wrapper = shallowMount(SelectIconGrid, {
        props: {
          rows:      linkRows,
          asLink:    true,
          keyField:  '_key',
          nameField: 'label',
          linkField: 'link',
        },
      });
      const items = wrapper.findAll('.item');

      items.forEach((item) => {
        expect(item.element.tagName).toBe('A');
      });
    });

    it('should not set an explicit role on anchor items (relies on implicit role="link")', () => {
      const wrapper = shallowMount(SelectIconGrid, {
        props: {
          rows:      linkRows,
          asLink:    true,
          keyField:  '_key',
          nameField: 'label',
          linkField: 'link',
        },
      });
      const items = wrapper.findAll('.item');

      items.forEach((item) => {
        expect(item.attributes('role')).toBeUndefined();
      });
    });
  });

  describe('aria-disabled', () => {
    it('should set aria-disabled="true" on a disabled item when asLink is false', () => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });
      const disabledItem = wrapper.findAll('.item')[2];

      expect(disabledItem.attributes('aria-disabled')).toBe('true');
    });

    it('should not set aria-disabled on an enabled item when asLink is false', () => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });
      const enabledItem = wrapper.findAll('.item')[0];

      expect(enabledItem.attributes('aria-disabled')).toBeUndefined();
    });

    it('should set aria-disabled="true" on a disabled item when asLink is true', () => {
      const linkRows = [
        {
          _key:     'link-disabled',
          label:    'Disabled Link',
          link:     'https://example.com',
          disabled: true,
        },
      ];

      const wrapper = shallowMount(SelectIconGrid, {
        props: {
          rows:      linkRows,
          asLink:    true,
          keyField:  '_key',
          nameField: 'label',
          linkField: 'link',
        },
      });

      expect(wrapper.find('.item').attributes('aria-disabled')).toBe('true');
    });

    it('should not set aria-disabled on an enabled item when asLink is true', () => {
      const linkRows = [
        {
          _key:  'link-enabled',
          label: 'Enabled Link',
          link:  'https://example.com',
        },
      ];

      const wrapper = shallowMount(SelectIconGrid, {
        props: {
          rows:      linkRows,
          asLink:    true,
          keyField:  '_key',
          nameField: 'label',
          linkField: 'link',
        },
      });

      expect(wrapper.find('.item').attributes('aria-disabled')).toBeUndefined();
    });
  });

  describe('interaction', () => {
    it('should emit "clicked" when an enabled item is clicked', async() => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });

      await wrapper.findAll('.item')[0].trigger('click');

      expect(wrapper.emitted('clicked')).toHaveLength(1);
      expect(wrapper.emitted('clicked')![0][0]).toStrictEqual(mockRows[0]);
    });

    it('should not emit "clicked" when a disabled item is clicked', async() => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });

      await wrapper.findAll('.item')[2].trigger('click');

      expect(wrapper.emitted('clicked')).toBeUndefined();
    });

    it('should emit "clicked" when Enter is pressed on an enabled item', async() => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });

      await wrapper.findAll('.item')[1].trigger('keyup.enter');

      expect(wrapper.emitted('clicked')).toHaveLength(1);
      expect(wrapper.emitted('clicked')![0][0]).toStrictEqual(mockRows[1]);
    });

    it('should not emit "clicked" when Enter is pressed on a disabled item', async() => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });

      await wrapper.findAll('.item')[2].trigger('keyup.enter');

      expect(wrapper.emitted('clicked')).toBeUndefined();
    });
  });

  describe('tabindex', () => {
    it('should set tabindex="0" on enabled items', () => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });
      const enabledItem = wrapper.findAll('.item')[0];

      expect(enabledItem.attributes('tabindex')).toBe('0');
    });

    it('should set tabindex="-1" on disabled items', () => {
      const wrapper = shallowMount(SelectIconGrid, { props: { rows: mockRows } });
      const disabledItem = wrapper.findAll('.item')[2];

      expect(disabledItem.attributes('tabindex')).toBe('-1');
    });
  });
});
