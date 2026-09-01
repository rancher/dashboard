import jsyaml from 'js-yaml';
import { shallowMount } from '@vue/test-utils';
import YamlOverridesEditor from '@shell/components/YamlOverridesEditor.vue';

describe('component: YamlOverridesEditor', () => {
  // Stub YamlEditor with the ref methods the component drives (YamlEditor does
  // not react to its `value` prop, so the component pushes changes via the ref).
  const updateValue = jest.fn();
  const refresh = jest.fn();
  const highlightLines = jest.fn();
  const YamlEditorStub = {
    name:     'YamlEditor',
    template: '<div class="yaml-editor-stub" />',
    props:    ['value', 'preview', 'componentTestid'],
    methods:  {
      updateValue, refresh, highlightLines
    },
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
    // The preview push is debounced, so drive it with fake timers.
    jest.useFakeTimers();
    updateValue.mockClear();
    refresh.mockClear();
    highlightLines.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
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
    jest.runAllTimers();
    await wrapper.vm.$nextTick();

    expect(updateValue).toHaveBeenCalledWith('foo: bar\nnew: value\n');
    expect(refresh).toHaveBeenCalledWith();
  });

  it('debounces preview updates so rapid changes push only once', async() => {
    const wrapper = mountEditor();

    await wrapper.setProps({ preview: 'a: 1\n' });
    await wrapper.setProps({ preview: 'a: 2\n' });
    await wrapper.setProps({ preview: 'a: 3\n' });

    // nothing is pushed while the changes are still arriving
    expect(updateValue).not.toHaveBeenCalled();

    jest.runAllTimers();
    await wrapper.vm.$nextTick();

    // only the final value is pushed, once
    expect(updateValue).toHaveBeenCalledTimes(1);
    expect(updateValue).toHaveBeenCalledWith('a: 3\n');
  });

  it('updateOverrides pushes a new value into the editable editor via its ref', () => {
    const wrapper = mountEditor();

    (wrapper.vm as any).updateOverrides('foo: seeded\n');

    expect(updateValue).toHaveBeenCalledWith('foo: seeded\n');
  });

  it('highlights the lines that changed in the preview', async() => {
    const wrapper = mountEditor({ preview: 'a: 1\nb: 2\nc: 3\n' });

    // insert a line between b and c - only the new line (index 2) should flash
    await wrapper.setProps({ preview: 'a: 1\nb: 2\nnew: 4\nc: 3\n' });
    jest.runAllTimers();
    await wrapper.vm.$nextTick();

    expect(highlightLines).toHaveBeenCalledWith([2]);
  });

  describe('smart mode (defaults provided)', () => {
    const defaults = {
      service: {
        port: 80, targetPort: 8086, type: 'ClusterIP'
      },
      image: { repository: 'my/repo' },
    };

    const merged9090 = {
      service: {
        port: 9090, targetPort: 8086, type: 'ClusterIP'
      },
      image: { repository: 'my/repo' },
    };

    it('computes the preview by merging the overrides onto the defaults', () => {
      const wrapper = mountEditor({ defaults, value: 'service:\n  port: 9090\n' });

      expect(jsyaml.load((wrapper.vm as any).resolvedPreview)).toStrictEqual(merged9090);
    });

    it('falls back to the bare defaults when the overrides are invalid from the start', () => {
      const wrapper = mountEditor({ defaults, value: ':\n  not valid: :yaml' });

      expect(jsyaml.load((wrapper.vm as any).resolvedPreview)).toStrictEqual(defaults);
    });

    it('keeps the last valid preview while the overrides are mid-edit/invalid', async() => {
      const wrapper = mountEditor({ defaults, value: 'service:\n  port: 9090\n' });

      // a valid override shows in the preview ...
      expect(jsyaml.load((wrapper.vm as any).resolvedPreview)).toStrictEqual(merged9090);

      // ... and starting an incomplete/invalid new line must not revert it
      await wrapper.setProps({ value: 'service:\n  port: 9090\nimagePullSecre' });
      await wrapper.vm.$nextTick();

      expect(jsyaml.load((wrapper.vm as any).resolvedPreview)).toStrictEqual(merged9090);
    });

    it('ignores the preview prop when defaults are supplied', () => {
      const wrapper = mountEditor({
        defaults, value: 'service:\n  port: 9090\n', preview: 'ignored: true\n'
      });

      expect((wrapper.vm as any).resolvedPreview).not.toContain('ignored');
    });
  });

  it('uses the preview prop directly in controlled mode (no defaults)', () => {
    const wrapper = mountEditor({ value: 'a: 1\n', preview: 'a: 1\nb: 2\n' });

    expect((wrapper.vm as any).resolvedPreview).toBe('a: 1\nb: 2\n');
  });

  describe('changedLineNumbers', () => {
    it('returns the 0-based line numbers added or changed in the new content', () => {
      const wrapper = mountEditor();
      const changed = (wrapper.vm as any).changedLineNumbers('a: 1\nb: 2\n', 'a: 1\nb: 99\n');

      expect(changed).toStrictEqual([1]);
    });

    it('does not shift line numbers when lines are removed', () => {
      const wrapper = mountEditor();
      const changed = (wrapper.vm as any).changedLineNumbers('a: 1\nb: 2\nc: 3\n', 'a: 1\nc: 3\nd: 4\n');

      // 'c: 3' moved up to index 1 (unchanged content), 'd: 4' is new at index 2
      expect(changed).toStrictEqual([2]);
    });

    it('skips the initial population so the whole preview does not flash', () => {
      const wrapper = mountEditor();

      expect((wrapper.vm as any).changedLineNumbers('', 'a: 1\nb: 2\n')).toStrictEqual([]);
      expect((wrapper.vm as any).changedLineNumbers(undefined, 'a: 1\n')).toStrictEqual([]);
    });

    it('returns no changed lines when nothing changed', () => {
      const wrapper = mountEditor();

      expect((wrapper.vm as any).changedLineNumbers('a: 1\n', 'a: 1\n')).toStrictEqual([]);
    });
  });
});
