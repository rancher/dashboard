import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import { compileStyle, parse } from '@vue/compiler-sfc';
import { mount, VueWrapper } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResourcePopoverCard from '@shell/components/Resource/Detail/ResourcePopover/ResourcePopoverCard.vue';

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
