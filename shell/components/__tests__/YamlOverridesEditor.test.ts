import { shallowMount } from '@vue/test-utils';
import YamlOverridesEditor from '@shell/components/YamlOverridesEditor.vue';

describe('component: YamlOverridesEditor', () => {
  // Stub YamlEditor with the ref methods the component drives (YamlEditor does
  // not react to its `value` prop, so the component pushes changes via the ref).
  const updateValue = jest.fn();
  const refresh = jest.fn();
  const YamlEditorStub = {
    name:     'YamlEditor',
    template: '<div class="yaml-editor-stub" />',
    props:    ['value', 'preview', 'componentTestid'],
    methods:  { updateValue, refresh },
  };

  const mountEditor = (props: Record<string, any> = {}) => shallowMount(YamlOverridesEditor, {
    props: {
      value:   'foo: bar\n',
      preview: 'foo: bar\nbaz: qux\n',
      ...props,
    },
    global: {
      mocks: { t: (key: string) => key },
      stubs: { YamlEditor: YamlEditorStub },
    },
  });

  beforeEach(() => {
    updateValue.mockClear();
    refresh.mockClear();
  });

  it('renders an editable overrides pane and a read-only final values pane', () => {
    const wrapper = mountEditor({ testidPrefix: 'chart-values' });

    expect(wrapper.find('[data-testid="chart-values-overrides-pane"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="chart-values-final-pane"]').exists()).toBe(true);
  });

  it('derives the pane and editor testids from the testidPrefix', () => {
    const wrapper = mountEditor({ testidPrefix: 'my-prefix' });

    expect((wrapper.vm as any).overridesPaneTestid).toBe('my-prefix-overrides-pane');
    expect((wrapper.vm as any).finalPaneTestid).toBe('my-prefix-final-pane');
    expect((wrapper.vm as any).overridesTestid).toBe('my-prefix-overrides');
    expect((wrapper.vm as any).finalTestid).toBe('my-prefix-final');
  });

  it('shows the supplied labels and hints', () => {
    const wrapper = mountEditor({
      overridesLabel: 'Your overrides',
      overridesHint:  'Only the values that differ',
      finalLabel:     'Final values',
      finalHint:      'Defaults merged with overrides',
    });

    expect(wrapper.text()).toContain('Your overrides');
    expect(wrapper.text()).toContain('Only the values that differ');
    expect(wrapper.text()).toContain('Final values');
    expect(wrapper.text()).toContain('Defaults merged with overrides');
  });

  it('emits update:value when the editable pane changes', () => {
    const wrapper = mountEditor();

    wrapper.findComponent({ ref: 'overridesEditor' }).vm.$emit('update:value', 'foo: changed\n');

    expect(wrapper.emitted('update:value')).toStrictEqual([['foo: changed\n']]);
  });

  it('pushes the preview into the read-only editor via its ref when preview changes', async() => {
    const wrapper = mountEditor();

    await wrapper.setProps({ preview: 'foo: bar\nnew: value\n' });
    await wrapper.vm.$nextTick();

    expect(updateValue).toHaveBeenCalledWith('foo: bar\nnew: value\n');
    expect(refresh).toHaveBeenCalledWith();
  });

  it('updateOverrides pushes a new value into the editable editor via its ref', () => {
    const wrapper = mountEditor();

    (wrapper.vm as any).updateOverrides('foo: seeded\n');

    expect(updateValue).toHaveBeenCalledWith('foo: seeded\n');
  });
});
