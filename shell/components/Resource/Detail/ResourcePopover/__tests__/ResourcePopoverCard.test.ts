import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import { compileStyle, parse } from '@vue/compiler-sfc';
import { mount, VueWrapper } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResourcePopoverCard from '@shell/components/Resource/Detail/ResourcePopover/ResourcePopoverCard.vue';
import PercentageBar from '@shell/components/PercentageBar.vue';

describe('component: ResourcePopoverCard.vue', () => {
  let wrapper: VueWrapper<any>;

  const mockResource = {
    nameDisplay: 'My Test Resource',
    glance:      [
      {
        label:   'Status',
        content: 'Active',
      },
      {
        label:         'Type',
        content:       'SomeType',
        formatter:     'SomeFormatterComponent',
        formatterOpts: { opt1: 'value1' }
      },
      {
        label:   'Created',
        content: '2023-01-01',
      }
    ],
  };

  const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

  const SomeFormatterComponent = {
    name:     'SomeFormatterComponent',
    props:    ['value', 'opt1', 'id'],
    template: '<div :id="id">Formatted: {{ value }} with {{ opt1 }}</div>',
  };

  function createWrapper(resource: any) {
    return mount(ResourcePopoverCard, {
      props:  { resource },
      global: {
        plugins:    [store],
        components: { SomeFormatterComponent }
      },
    });
  }

  beforeEach(() => {
    wrapper = createWrapper(mockResource);
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('should render a row for each item in resource.glance', () => {
    const rows = wrapper.findAll('.row');

    expect(rows).toHaveLength(mockResource.glance.length);
  });

  it('should render the correct label and value for each glance item', () => {
    const rows = wrapper.findAll('.row');

    rows.forEach((row, i) => {
      const glanceItem = mockResource.glance[i];
      const label = row.find('label');
      const value = row.find('.value');

      expect(label.text()).toBe(glanceItem.label);
      if (glanceItem.formatter) {
        return;
      }

      expect(value.text()).toBe(glanceItem.content);
    });
  });

  it('should render a dynamic component when a formatter is provided', () => {
    const formatterComponent = wrapper.findComponent(SomeFormatterComponent);

    expect(formatterComponent.exists()).toBe(true);
    expect(formatterComponent.props('value')).toBe(mockResource.glance[1].content);
    expect(formatterComponent.props('opt1')).toBe(mockResource.glance[1].formatterOpts?.opt1);
  });

  it('should generate a unique ID for label `for` and value `id` attributes', () => {
    const firstGlanceItem = mockResource.glance[0];
    const expectedId = `value-${ firstGlanceItem.label }:${ firstGlanceItem.content }`.toLowerCase().replaceAll(' ', '');

    const label = wrapper.find('label');
    const value = wrapper.find('.value');

    expect(label.attributes('for')).toBe(expectedId);
    expect(value.attributes('id')).toBe(expectedId);
  });

  it('should add a specific ID to the first glance item value', () => {
    const firstValueSpan = wrapper.find('#first-glance-item');

    expect(firstValueSpan.exists()).toBe(true);
    // This will be the span inside the first .value div
    expect(firstValueSpan.text()).toBe(mockResource.glance[0].content);

    const secondValue = wrapper.findAll('.value')[1];

    expect(secondValue.find('#first-glance-item').exists()).toBe(false);
  });

  describe('usage', () => {
    const withUsage = (glanceUsage: any) => createWrapper({ ...mockResource, glanceUsage });

    const usageItem = (w: VueWrapper<any>, name: string) => w.find(`[data-testid="resource-popover-usage-${ name }"]`);

    it.each([
      ['has no usage', undefined],
      ['has an empty usage list', []],
    ])('should not render the usage when the resource %s', (_, glanceUsage) => {
      const w = withUsage(glanceUsage);

      expect(w.find('[data-testid="resource-popover-usage"]').exists()).toBe(false);
      w.unmount();
    });

    it('should render an item with a label for each usage, in order', () => {
      const w = withUsage([
        {
          name: 'cpu', label: 'CPU', percentage: 10
        },
        {
          name: 'memory', label: 'Memory', percentage: 20
        },
        {
          name: 'pods', label: 'Pods', percentage: 30
        },
      ]);

      expect(w.findAll('.usage-item').map((item) => item.find('.text-deemphasized').text())).toStrictEqual(['CPU', 'Memory', 'Pods']);
      w.unmount();
    });

    it.each([
      [42.4, '42%', 42.4],
      [0, '0%', 0],
      [0.5, '0.5%', 0.5],
      [5.25, '5.3%', 5.25],
      [100, '100%', 100],
      [150, '150%', 100],
      [-5, '-5%', 0],
    ])('should show a usage of %p as %p with a bar at %p', (percentage, text, bar) => {
      const w = withUsage([{
        name: 'cpu', label: 'CPU', percentage
      }]);
      const item = usageItem(w, 'cpu');

      expect(item.find('.usage-value').text()).toStrictEqual(text);
      expect(item.findComponent(PercentageBar).props('modelValue')).toStrictEqual(bar);
      w.unmount();
    });

    it.each([
      ['missing', undefined],
      ['not a number', NaN],
      ['infinite', Infinity],
      ['a string', '42'],
      ['null', null],
    ])('should show n/a with an empty bar when the usage is %s', (_, percentage) => {
      const w = withUsage([{
        name: 'cpu', label: 'CPU', percentage
      }]);
      const item = usageItem(w, 'cpu');

      expect(item.find('.usage-value').text()).toStrictEqual('generic.na');
      expect(item.findComponent(PercentageBar).props('modelValue')).toStrictEqual(0);
      w.unmount();
    });

    it('should hide the bar from assistive technology, as the percentage is shown as text', () => {
      const w = withUsage([{
        name: 'cpu', label: 'CPU', percentage: 10
      }]);

      expect(usageItem(w, 'cpu').findComponent(PercentageBar).attributes('aria-hidden')).toStrictEqual('true');
      w.unmount();
    });

    it('should still render the glance rows when there is usage', () => {
      const w = withUsage([{
        name: 'cpu', label: 'CPU', percentage: 10
      }]);

      expect(w.findAll('.row')).toHaveLength(mockResource.glance.length);
      w.unmount();
    });

    describe('while the usage is loading', () => {
      const USAGE = [
        {
          name: 'cpu', label: 'CPU', percentage: undefined
        },
        {
          name: 'memory', label: 'Memory', percentage: 20
        },
      ];

      const withLoadingUsage = (usageLoading: boolean | undefined, glanceUsage: any = USAGE) => mount(ResourcePopoverCard, {
        props:  { resource: { ...mockResource, glanceUsage }, usageLoading },
        global: { plugins: [store] },
      });

      const loadingOf = (w: VueWrapper<any>, name: string) => w.find(`[data-testid="resource-popover-usage-${ name }-loading"]`);

      it('should show a spinner with loading text for screen readers, rather than n/a, for a usage that is not known yet', () => {
        const w = withLoadingUsage(true);
        const loading = loadingOf(w, 'cpu');

        expect(loading.find('.icon-spinner').attributes('aria-hidden')).toStrictEqual('true');
        expect(loading.find('.sr-only').text()).toStrictEqual('component.resource.detail.glance.ariaLabel.loadingUsage');
        expect(usageItem(w, 'cpu').text()).not.toContain('generic.na');
        w.unmount();
      });

      it('should mark only a usage that is not known yet as busy', () => {
        const w = withLoadingUsage(true);

        expect([usageItem(w, 'cpu').attributes('aria-busy'), usageItem(w, 'memory').attributes('aria-busy')]).toStrictEqual(['true', 'false']);
        w.unmount();
      });

      it('should keep an empty bar in place of a usage that is not known yet, so the card does not move when it loads', () => {
        const w = withLoadingUsage(true);

        expect(usageItem(w, 'cpu').findComponent(PercentageBar).props('modelValue')).toStrictEqual(0);
        w.unmount();
      });

      it('should keep showing a usage that is already known', () => {
        const w = withLoadingUsage(true);

        expect(loadingOf(w, 'memory').exists()).toBe(false);
        expect(usageItem(w, 'memory').find('.usage-value').text()).toStrictEqual('20%');
        w.unmount();
      });

      it.each([
        ['has finished', false],
        ['is not given', undefined],
      ])('should show n/a for a usage that is not known when loading %s', (_, usageLoading) => {
        const w = withLoadingUsage(usageLoading);

        expect(loadingOf(w, 'cpu').exists()).toBe(false);
        expect(usageItem(w, 'cpu').find('.usage-value').text()).toStrictEqual('generic.na');
        expect(usageItem(w, 'cpu').attributes('aria-busy')).toStrictEqual('false');
        w.unmount();
      });

      it('should replace the spinner with the usage when loading finishes with a value', async() => {
        const w = withLoadingUsage(true, [{ name: 'cpu', label: 'CPU' }]);

        await w.setProps({
          resource: {
            ...mockResource,
            glanceUsage: [{
              name: 'cpu', label: 'CPU', percentage: 42
            }]
          },
          usageLoading: false
        });

        expect(loadingOf(w, 'cpu').exists()).toBe(false);
        expect(usageItem(w, 'cpu').find('.usage-value').text()).toStrictEqual('42%');
        w.unmount();
      });
    });
  });
});

describe('component: ResourcePopoverCard.vue row layout', () => {
  // jsdom has no layout, so check the compiled CSS. Each row is a flex row: if the label can shrink, a long value such as
  // a namespace:name or a URL takes width from it and starts further left than the values of the other rows
  const decls = (className: string) => {
    const source = fs.readFileSync(path.resolve(__dirname, '../ResourcePopoverCard.vue'), 'utf8');
    const style = parse(source).descriptor.styles[0];
    const { code } = compileStyle({
      source:         style.content,
      filename:       'ResourcePopoverCard.vue',
      id:             'data-v-test',
      scoped:         style.scoped,
      preprocessLang: style.lang as 'scss',
    });
    const out: Record<string, string> = {};

    postcss.parse(code).walkRules((rule) => {
      if (rule.selectors.some((selector) => selector.includes(`.row ${ className }`))) {
        rule.walkDecls((decl) => {
          out[decl.prop] = decl.value;
        });
      }
    });

    return out;
  };

  it('should keep the label at half the card, whatever the length of the value', () => {
    expect(decls('.label')).toStrictEqual({ width: '50%', 'flex-shrink': '0' });
  });

  it('should let the value wrap within the rest of the card rather than overflow it', () => {
    expect(decls('.value')).toStrictEqual({ 'min-width': '0' });
  });
});
