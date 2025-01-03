import { mount } from '@vue/test-utils';
import Error from '@shell/components/form/Error.vue';

type Rule = (val?: string) => undefined | string;

describe('component: Error', () => {
  it('should not display any error text if no test functions provided', () => {
    const value = 'testValue';
    const rules: Rule[] = [];

    const wrapper = mount(Error, { props: { value, rules } });

    const element = wrapper.find('[data-testid="error-span"]');

    expect(element.exists()).toStrictEqual(false);
  });
  it('should not display any error text if provided test returns undefined', () => {
    const value = 'testValue';
    const rules: Rule[] = [() => undefined, () => undefined];

    const wrapper = mount(Error, { props: { value, rules } });

    const element = wrapper.find('[data-testid="error-span"]');

    expect(element.exists()).toStrictEqual(false);
  });
  it('should properly pass the component value property to test function', () => {
    const value = 'testValue';
    const rules: Rule[] = [(val) => val];

    const wrapper = mount(Error, { props: { value, rules } });
    const element = wrapper.find('[data-testid="error-span"]');

    expect(element.text()).toBe('testValue');
  });
  it('should display error text if provided test return string', () => {
    const value = 'testValue';
    const rules: Rule[] = [() => 'testError', () => undefined];

    const wrapper = mount(Error, { props: { value, rules } });

    const element = wrapper.find('[data-testid="error-span"]');

    expect(element.text()).toBe('testError');
  });
  it('should properly concatenate error text if more than one error returned', () => {
    const value = 'testValue';
    const rules: Rule[] = [() => 'testError1', () => 'testError2'];

    const wrapper = mount(Error, { props: { value, rules } });

    const element = wrapper.find('[data-testid="error-span"]');

    expect(element.text()).toBe('testError1, testError2');
  });
});
