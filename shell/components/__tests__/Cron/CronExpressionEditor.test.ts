/* eslint-disable jest/no-hooks */
import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createStore } from 'vuex';
import CronExpressionEditor from '@shell/components/Cron/CronExpressionEditor.vue';
import type { CronField } from '@shell/components/Cron/types';

const translations: Record<string, string> = {
  'component.cron.expressionEditor.label.minute':     'Minute',
  'component.cron.expressionEditor.label.hour':       'Hour',
  'component.cron.expressionEditor.label.dayOfMonth': 'Day of Month',
  'component.cron.expressionEditor.label.month':      'Month',
  'component.cron.expressionEditor.label.dayOfWeek':  'Day of Week',
  'component.cron.expressionEditor.invalidValue':     'Invalid value',
};

const store = createStore({});

interface CronExpressionEditorVm extends InstanceType<typeof CronExpressionEditor> {
  cronValues: Record<CronField, string>;
  handleInput: (field: CronField, value: string) => void;
  isValid: boolean;
  readableCron: string;
  errors: Record<CronField, boolean>;
  focusedField: Record<CronField, boolean>;
  tooltipRefs: Record<CronField, unknown>;
  popperInstances: Record<CronField, unknown>;
  handleFocus: (field: CronField) => void;
  handleBlur: (field: CronField) => void;
}

describe('cronExpressionEditor', () => {
  let wrapper: VueWrapper<CronExpressionEditorVm>;

  const factory = (props: Partial<CronExpressionEditorVm> = {}) => mount(CronExpressionEditor, {
    global: {
      plugins: [store],
      stubs:   {
        CronTooltip:  true,
        LabeledInput: {
          name:     'LabeledInput',
          props:    ['label', 'tooltip', 'type', 'value'],
          template: `
            <div>
              <label>{{ label }}</label>
              <input ref="value" :value="value" />
            </div>
          `
        }
      },
      mocks: { t: (key: string) => translations[key] || key },
    },
    props: { cronExpression: '0 0 * * *', ...props },
  }) as VueWrapper<CronExpressionEditorVm>;

  afterEach(() => wrapper?.unmount());

  const getEmitted = (event: string) => wrapper.emitted(event) as unknown[][] || [];

  it('renders 5 input fields with correct labels', () => {
    wrapper = factory();
    const labels = wrapper.findAll('label').map((l) => l.text());

    expect(labels).toStrictEqual(['Minute', 'Hour', 'Day of Month', 'Month', 'Day of Week']);
  });

  it('initializes cron values and emits initial events', () => {
    wrapper = factory();
    const vm = wrapper.vm;

    expect(vm.cronValues).toStrictEqual({
      minute: '0', hour: '0', dayOfMonth: '*', month: '*', dayOfWeek: '*'
    });
    expect(vm.isValid).toBe(true);
    expect(vm.readableCron).toContain('12:00');

    expect(getEmitted('update:cronExpression')[0][0]).toBe('0 0 * * *');
    expect(typeof getEmitted('update:readableCron')[0][0]).toBe('string');
    expect(getEmitted('update:isValid')[0][0]).toBe(true);
  });

  it('emits correct events when cron value changes', async() => {
    wrapper = factory();
    const vm = wrapper.vm;

    vm.handleInput('minute', '5');
    await nextTick();

    expect(getEmitted('update:cronExpression')[1][0]).toBe('5 0 * * *');
    expect(getEmitted('update:readableCron')[1][0]).toBe(vm.readableCron);
    expect(getEmitted('update:isValid')[1][0]).toBe(true);
  });

  it('validates individual fields correctly', () => {
    wrapper = factory();
    const vm = wrapper.vm;

    vm.handleInput('minute', '0');
    expect(vm.errors.minute).toBe(false);

    vm.handleInput('minute', '61');
    expect(vm.errors.minute).toBe(true);
  });

  it('handles invalid cron expressions gracefully', async() => {
    wrapper = factory({ cronExpression: '61 * * * *' });
    const vm = wrapper.vm;

    await nextTick();
    expect(vm.isValid).toBe(false);
  });

  it('updates readableCron correctly for valid and invalid inputs', async() => {
    wrapper = factory({ cronExpression: '0 12 * * *' });
    const vm = wrapper.vm;

    await nextTick();
    expect(vm.readableCron).toContain('12:00');

    vm.handleInput('hour', '25');
    await nextTick();
    expect(vm.isValid).toBe(false);
  });

  it('shows tooltip and manages popper on focus/blur', async() => {
    wrapper = factory();
    const vm = wrapper.vm;

    await vm.handleFocus('minute');
    expect(vm.focusedField.minute).toBe(true);
    expect(vm.tooltipRefs.minute).not.toBeNull();
    expect(vm.popperInstances.minute).not.toBeNull();

    vm.handleBlur('minute');
    await nextTick();
    expect(vm.focusedField.minute).toBe(false);
    expect(vm.popperInstances.minute).toBeNull();
  });

  it('displays error tooltip for invalid input', async() => {
    wrapper = factory();
    const vm = wrapper.vm;

    vm.handleInput('minute', '61');
    await nextTick();

    const inputWrapper = wrapper.findComponent({ name: 'LabeledInput' });

    expect(inputWrapper.props('tooltip')).toBe('Invalid value');
  });
});
