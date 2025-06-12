import { mount } from '@vue/test-utils';
import RcFilterPanel from './RcFilterPanel.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

const filters = [
  {
    key:     'status',
    title:   'Status',
    options: [
      { label: 'Installed', value: 'installed' },
      { label: 'Deprecated', value: 'deprecated' }
    ]
  },
  {
    key:     'repos',
    title:   'Repository',
    options: [
      { label: 'Repo A', value: 'repo-a' },
      { label: 'Repo B', value: 'repo-b' }
    ]
  }
];

describe('rcFilterPanel', () => {
  it('renders all filter groups and options with correct labels', () => {
    const wrapper = mount(RcFilterPanel, {
      props: {
        modelValue: {},
        filters
      }
    });

    expect(wrapper.findAll('.filter-panel-filter-group-title')).toHaveLength(2);
    expect(wrapper.text()).toContain('Status');
    expect(wrapper.text()).toContain('Repository');
    expect(wrapper.text()).toContain('Installed');
    expect(wrapper.text()).toContain('Repo A');
    expect(wrapper.text()).toContain('Repo B');
  });

  it('emits update:modelValue when a new status is added via checkbox emit', async() => {
    const wrapper = mount(RcFilterPanel, {
      props: {
        modelValue: { status: ['installed'] },
        filters
      }
    });

    const checkboxes = wrapper.findAllComponents(Checkbox);
    const deprecatedCheckbox = checkboxes.find((c) => c.props('label') === 'Deprecated');

    expect(deprecatedCheckbox).toBeTruthy();

    deprecatedCheckbox?.vm.$emit('update:value', ['installed', 'deprecated']);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:modelValue');

    expect(emitted).toBeTruthy();
    expect(emitted?.[0][0].status).toStrictEqual(['installed', 'deprecated']);
  });

  it('renders a custom component if provided in option', () => {
    const CustomComponent = { template: '<div>Custom content</div>' };

    const wrapper = mount(RcFilterPanel, {
      props: {
        modelValue: {},
        filters:    [
          {
            key:     'custom',
            title:   'Custom Filters',
            options: [{ component: CustomComponent }]
          }
        ]
      }
    });

    expect(wrapper.text()).toContain('Custom content');
  });
});
