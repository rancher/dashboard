import { mount, VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createStore } from 'vuex';
import CronExpressionEditor from '@components/Cron/CronExpressionEditor.vue';

const store = createStore({});

// mock useI18n for human-readable labels
jest.mock('@shell/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'component.cron.expressionEditor.invalidValue':          'Invalid value',
        'component.cron.expressionEditor.invalidCronExpression': 'Invalid Cron Expression',
        'component.cron.expressionEditor.label.minute':          'Minute',
        'component.cron.expressionEditor.label.hour':            'Hour',
        'component.cron.expressionEditor.label.dayOfMonth':      'Day of Month',
        'component.cron.expressionEditor.label.month':           'Month',
        'component.cron.expressionEditor.label.dayOfWeek':       'Day of Week',
      };

      return map[key] ?? key;
    }
  })
}));

describe('cronExpressionEditor', () => {
  let wrapper: VueWrapper<any>;

  const factory = (props = {}) => mount(CronExpressionEditor, {
    global: { plugins: [store], stubs: { LabeledInput: true, CronTooltip: true } },
    props:  { cronExpression: '0 0 * * *', ...props },
  });

  afterEach(() => wrapper?.unmount());

  const getEmitted = (event: string) => wrapper.emitted(event) as unknown[][] | [];

  it('renders 5 input fields with correct labels', () => {
    wrapper = factory();
    const inputs = wrapper.findAllComponents({ name: 'LabeledInput' });

    expect(inputs).toHaveLength(5);

    const labels = wrapper.findAll('label').map((l) => l.text());

    expect(labels).toStrictEqual(['Minute', 'Hour', 'Day of Month', 'Month', 'Day of Week']);
  });

  it('initializes cron values and emits initial events', () => {
    wrapper = factory();
    expect(wrapper.vm.cronValues).toStrictEqual({
      minute: '0', hour: '0', dayOfMonth: '*', month: '*', dayOfWeek: '*'
    });
    expect(wrapper.vm.isValid).toBe(true);
    expect(wrapper.vm.readableCron).toBe('At 12:00 AM');

    expect(getEmitted('update:cronExpression')[0][0]).toBe('0 0 * * *');
    expect(typeof getEmitted('update:readableCron')[0][0]).toBe('string');
    expect(getEmitted('update:isValid')[0][0]).toBe(true);
  });

  it('emits correct events when cron value changes', async() => {
    wrapper = factory();

    wrapper.vm.handleInput('minute', '5');
    await nextTick();

    expect(getEmitted('update:cronExpression')[1][0]).toBe('5 0 * * *');
    expect(getEmitted('update:readableCron')[1][0]).toBe(wrapper.vm.readableCron);
    expect(getEmitted('update:isValid')[1][0]).toBe(true);
  });

  it('validates individual fields correctly', () => {
    wrapper = factory();

    wrapper.vm.handleInput('minute', '0'); // valid
    expect(wrapper.vm.errors.minute).toBe(false);

    wrapper.vm.handleInput('minute', '61'); // invalid
    expect(wrapper.vm.errors.minute).toBe(true);
  });

  it('handles invalid cron expressions gracefully', async() => {
    wrapper = factory({ cronExpression: '61 * * * *' }); // invalid cron
    await nextTick();

    expect(wrapper.vm.isValid).toBe(false);
    expect(wrapper.vm.readableCron).toBe('Invalid Cron Expression');
  });

  it('updates readableCron correctly for valid and invalid inputs', async() => {
    wrapper = factory({ cronExpression: '0 12 * * *' });
    await nextTick();
    expect(wrapper.vm.readableCron).toContain('12:00');

    wrapper.vm.handleInput('hour', '25'); // invalid hour
    await nextTick();
    expect(wrapper.vm.readableCron).toBe('Invalid Cron Expression');
  });

  it('shows tooltip and manages popper on focus/blur', async() => {
    wrapper = factory();

    // focus triggers tooltip & popper
    await wrapper.vm.handleFocus('minute');
    expect(wrapper.vm.focusedField.minute).toBe(true);
    expect(wrapper.vm.tooltipRefs.minute).not.toBeNull();
    expect(wrapper.vm.popperInstances.minute).not.toBeNull();

    // blur destroys popper
    wrapper.vm.handleBlur('minute');
    await nextTick();
    expect(wrapper.vm.focusedField.minute).toBe(false);
    expect(wrapper.vm.popperInstances.minute).toBeNull();
  });

  it('displays error tooltip for invalid input', async() => {
    wrapper = factory();

    wrapper.vm.handleInput('minute', '61'); // invalid
    await nextTick();

    const inputWrapper = wrapper.findComponent({ name: 'LabeledInput' });

    expect(inputWrapper.props('tooltip')).toBe('Invalid value');
  });
});
