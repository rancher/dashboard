import { mount } from '@vue/test-utils';
import Command from '@shell/components/form/Command.vue';
import { _EDIT } from '@shell/config/query-params';

describe('component: Command', () => {
  it('should display all the inputs', () => {
    const wrapper = mount(Command, {
      propsData: { mode: _EDIT },
      data:      () => ({ stdin: true })
    });

    const inputWraps = wrapper.findAll('[data-testid^=input-command-]');

    expect(inputWraps).toHaveLength(5);
  });

  it.each([
    'command',
    'args',
    'workingDir',
  ])('should emit an update on %p input', (field) => {
    const wrapper = mount(Command, { propsData: { mode: _EDIT } });
    const input = wrapper.find(`[data-testid="input-command-${ field }"]`).find('input');
    const newValue = 123;

    input.setValue(newValue);

    expect(wrapper.emitted('input')).toHaveLength(1);
  });

  it.each([
    'tty',
  ])('should emit an update on %p checkbox change', (field) => {
    const wrapper = mount(Command, {
      propsData: { mode: _EDIT },
      data:      () => ({ stdin: true })
    });
    const checkboxLabel = wrapper
      .find(`[data-testid="input-command-${ field }"]`)
      .find('label');

    checkboxLabel.trigger('click');

    expect(wrapper.emitted('input')).toHaveLength(1);
  });

  it.each([
    'stdin',
  ])('should emit an update on %p selection change', async(field) => {
    const wrapper = mount(Command, {
      propsData: { mode: _EDIT },
      data:      () => ({ stdin: true })
    });
    const select = wrapper.find(`[data-testid="input-command-${ field }"]`);

    select.find('button').trigger('click');
    await wrapper.trigger('keydown.down');
    await wrapper.trigger('keydown.enter');

    expect(wrapper.emitted('input')).toHaveLength(1);
  });
});
//
