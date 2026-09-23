import { shallowMount } from '@vue/test-utils';
import YamlOverridesEditor from '@shell/components/YamlOverridesEditor.vue';
import { mergeOverridesRawText, overridesFromValues } from '@shell/utils/chart-values';

describe('component: YamlOverridesEditor', () => {
  // Stub YamlEditor with the ref methods the component drives (YamlEditor does not
  // react to its `value` prop, so cross-pane updates are pushed in via the ref).
  const YamlEditorStub = {
    name:     'YamlEditor',
    template: '<div class="yaml-editor-stub" />',
    props:    ['value', 'componentTestid', 'editorMode'],
    methods:  {
      updateValue() {},
      setLineDecorations() {},
      refresh() {},
    },
  };

  const defaults = { replicas: 2, sachet: { enabled: true } };

  const mountEditor = (props: Record<string, any> = {}) => shallowMount(YamlOverridesEditor, {
    props: {
      value: 'replicas: 5\n',
      defaults,
      ...props,
    },
    global: {
      mocks: { t: (key: string) => key },
      stubs: { YamlEditor: YamlEditorStub },
    },
  });

  const editors = (wrapper: any) => ({
    left:  wrapper.findComponent({ ref: 'defaultsEditor' }).vm,
    right: wrapper.findComponent({ ref: 'overridesEditor' }).vm,
  });

  beforeEach(() => {
    // The cross-pane sync is debounced, so drive it with fake timers.
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders a chart-defaults pane and an overrides pane', () => {
    const wrapper = mountEditor({ testidPrefix: 'chart-values' });

    expect(wrapper.find('[data-testid="chart-values-defaults-pane"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="chart-values-overrides-pane"]').exists()).toBe(true);
  });

  it('shows the supplied labels and hints', () => {
    const wrapper = mountEditor({
      chartDefaultsLabel: 'Chart defaults',
      chartDefaultsHint:  'Every setting the chart ships with',
      overridesLabel:     'Your overrides',
      overridesHint:      'Only the values that differ',
    });

    expect(wrapper.text()).toContain('Chart defaults');
    expect(wrapper.text()).toContain('Every setting the chart ships with');
    expect(wrapper.text()).toContain('Your overrides');
    expect(wrapper.text()).toContain('Only the values that differ');
  });

  describe('editing the overrides (right) pane', () => {
    it('emits update:value with the edited overrides', () => {
      const wrapper = mountEditor();

      editors(wrapper).right.$emit('update:value', 'replicas: 9\n');

      expect(wrapper.emitted('update:value')).toStrictEqual([['replicas: 9\n']]);
    });

    it('pushes the merged final document into the chart-defaults editor', async() => {
      const wrapper = mountEditor();
      const { left } = editors(wrapper);
      const leftUpdate = jest.spyOn(left, 'updateValue');
      const overrides = 'replicas: 9\nsachet:\n  enabled: false\n';

      editors(wrapper).right.$emit('update:value', overrides);
      jest.runAllTimers();
      await wrapper.vm.$nextTick();

      expect(leftUpdate).toHaveBeenCalledWith(mergeOverridesRawText(defaults, overrides));
    });

    it('debounces the sync so rapid edits push only once', async() => {
      const wrapper = mountEditor();
      const { left, right } = editors(wrapper);
      const leftUpdate = jest.spyOn(left, 'updateValue');

      right.$emit('update:value', 'replicas: 6\n');
      right.$emit('update:value', 'replicas: 7\n');
      right.$emit('update:value', 'replicas: 8\n');

      expect(leftUpdate).not.toHaveBeenCalled();

      jest.runAllTimers();
      await wrapper.vm.$nextTick();

      expect(leftUpdate).toHaveBeenCalledTimes(1);
      expect(leftUpdate).toHaveBeenCalledWith(mergeOverridesRawText(defaults, 'replicas: 8\n'));
    });
  });

  describe('editing the chart-defaults (left) pane', () => {
    it('derives the overrides from the edited full document and emits them', () => {
      const wrapper = mountEditor({ value: '' });
      // The user changes a shipped default (replicas 2 -> 5) in the full document.
      const edited = 'replicas: 5\nsachet:\n  enabled: true\n';

      editors(wrapper).left.$emit('update:value', edited);

      const expected = overridesFromValues(defaults, { replicas: 5, sachet: { enabled: true } });

      expect(wrapper.emitted('update:value')).toStrictEqual([[expected]]);
    });

    it('pushes the derived overrides into the overrides editor', async() => {
      const wrapper = mountEditor({ value: '' });
      const { right } = editors(wrapper);
      const rightUpdate = jest.spyOn(right, 'updateValue');
      const edited = 'replicas: 5\nsachet:\n  enabled: true\n';

      editors(wrapper).left.$emit('update:value', edited);
      jest.runAllTimers();
      await wrapper.vm.$nextTick();

      const expected = overridesFromValues(defaults, { replicas: 5, sachet: { enabled: true } });

      expect(rightUpdate).toHaveBeenCalledWith(expected);
    });

    it('does not emit while the edited YAML is mid-edit/invalid', () => {
      const wrapper = mountEditor({ value: '' });

      editors(wrapper).left.$emit('update:value', 'replicas: 5\n  bad: :indent');

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });

    it('does not derive overrides from a bare scalar', () => {
      const wrapper = mountEditor({ value: '' });

      editors(wrapper).left.$emit('update:value', 'just a string');

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });
  });

  describe('switching panes before the sync runs', () => {
    it('updates the overrides editor as soon as it gets focus after a chart-defaults edit', () => {
      const wrapper = mountEditor({ value: '' });
      const { left, right } = editors(wrapper);
      const rightUpdate = jest.spyOn(right, 'updateValue');

      left.$emit('update:value', 'replicas: 5\nsachet:\n  enabled: true\n');
      // Focus moves to the overrides pane before the debounce fires
      wrapper.find('[data-testid="values-overrides-pane"]').trigger('focusin');

      expect(rightUpdate).toHaveBeenCalledWith('replicas: 5\n');
    });

    it('updates the chart-defaults editor as soon as it gets focus after an overrides edit', () => {
      const wrapper = mountEditor();
      const { left, right } = editors(wrapper);
      const leftUpdate = jest.spyOn(left, 'updateValue');

      right.$emit('update:value', 'replicas: 9\n');
      // Focus moves to the chart-defaults pane before the debounce fires
      wrapper.find('[data-testid="values-defaults-pane"]').trigger('focusin');

      expect(leftUpdate).toHaveBeenCalledWith(mergeOverridesRawText(defaults, 'replicas: 9\n'));
    });

    it('does not push into either editor when focus moves with no pending edit', () => {
      const wrapper = mountEditor();
      const { left, right } = editors(wrapper);
      const leftUpdate = jest.spyOn(left, 'updateValue');
      const rightUpdate = jest.spyOn(right, 'updateValue');

      wrapper.find('[data-testid="values-defaults-pane"]').trigger('focusin');
      wrapper.find('[data-testid="values-overrides-pane"]').trigger('focusin');

      expect(leftUpdate).not.toHaveBeenCalled();
      expect(rightUpdate).not.toHaveBeenCalled();
    });
  });

  describe('line decorations', () => {
    it('tints a changed default line, without a label', () => {
      const wrapper = mountEditor({ value: 'replicas: 5\n' });
      const { left } = editors(wrapper);
      const leftDeco = jest.spyOn(left, 'setLineDecorations');

      left.$emit('onReady');

      expect(leftDeco).toHaveBeenCalledWith([
        { line: 0, className: 'line-override-highlight' },
      ]);
    });

    it('tints a key that is not in the defaults', () => {
      const wrapper = mountEditor({ defaults: {}, value: 'foo: bar\n' });
      const { left } = editors(wrapper);
      const leftDeco = jest.spyOn(left, 'setLineDecorations');

      left.$emit('onReady');

      expect(leftDeco).toHaveBeenCalledWith([
        { line: 0, className: 'line-override-highlight' },
      ]);
    });

    it('highlights every non-blank line in the overrides pane', () => {
      const wrapper = mountEditor({ value: 'replicas: 5\nsachet:\n  enabled: false\n' });
      const { right } = editors(wrapper);
      const rightDeco = jest.spyOn(right, 'setLineDecorations');

      right.$emit('onReady');

      expect(rightDeco).toHaveBeenCalledWith([
        { line: 0, className: 'line-override-highlight' },
        { line: 1, className: 'line-override-highlight' },
        { line: 2, className: 'line-override-highlight' },
      ]);
    });
  });

  describe('external prop changes', () => {
    it('reseeds both panes when the value prop changes from outside', async() => {
      const wrapper = mountEditor({ value: 'replicas: 5\n' });
      const { left, right } = editors(wrapper);
      const leftUpdate = jest.spyOn(left, 'updateValue');
      const rightUpdate = jest.spyOn(right, 'updateValue');

      await wrapper.setProps({ value: 'replicas: 7\n' });

      expect(rightUpdate).toHaveBeenCalledWith('replicas: 7\n');
      expect(leftUpdate).toHaveBeenCalledWith(mergeOverridesRawText(defaults, 'replicas: 7\n'));
    });

    it('ignores a value prop change that matches the current overrides', async() => {
      const wrapper = mountEditor({ value: 'replicas: 5\n' });
      const { right } = editors(wrapper);
      const rightUpdate = jest.spyOn(right, 'updateValue');

      // Same content, only a trailing-whitespace difference - our own echo.
      await wrapper.setProps({ value: 'replicas: 5' });

      expect(rightUpdate).not.toHaveBeenCalled();
    });
  });

  describe('updateOverrides', () => {
    it('seeds both editors and emits the new overrides', async() => {
      const wrapper = mountEditor({ value: '' });
      const { left, right } = editors(wrapper);
      const leftUpdate = jest.spyOn(left, 'updateValue');
      const rightUpdate = jest.spyOn(right, 'updateValue');

      (wrapper.vm as any).updateOverrides('replicas: 3\n');
      await wrapper.vm.$nextTick();

      expect(rightUpdate).toHaveBeenCalledWith('replicas: 3\n');
      expect(leftUpdate).toHaveBeenCalledWith(mergeOverridesRawText(defaults, 'replicas: 3\n'));
      expect(wrapper.emitted('update:value')).toStrictEqual([['replicas: 3\n']]);
    });
  });
});
