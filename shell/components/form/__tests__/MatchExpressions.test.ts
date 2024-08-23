import { mount } from '@vue/test-utils';
import MatchExpressions from '@shell/components/form/MatchExpressions.vue';
import { _CREATE } from '@shell/config/query-params';
import { nextTick } from 'vue';

describe('component: MatchExpressions', () => {
  it('should display all the inputs', () => {
    const wrapper = mount(MatchExpressions, {
      props: { mode: _CREATE },
      data:  () => ({
        rules: [
          {
            id:       '123',
            key:      '123',
            operator: 'anything',
            values:   '123'
          }
        ]
      })
    });

    const inputWraps = wrapper.findAll('[data-testid^=input-match-expression-]');

    expect(inputWraps).toHaveLength(8);
  });

  it.each([
    'key',
    'values',
  ])('should emit an update on %p input', async(field) => {
    const wrapper = mount(MatchExpressions, {
      props: { mode: _CREATE },
      data:  () => ({
        rules: [
          {
            id:       '123',
            key:      '123',
            operator: 'anything',
            values:   '123'
          }
        ]
      })
    });
    const input = wrapper.find(`[data-testid="input-match-expression-${ field }-0"]`).find('input');
    const newValue = 123;

    input.setValue(newValue);
    await nextTick();

    expect(wrapper.emitted('update:value')).toHaveLength(1);
  });

  it.each([
    'operator',
  ])('should emit an update on %p selection change', async(field) => {
    const wrapper = mount(MatchExpressions, {
      props: { mode: _CREATE },
      data:  () => ({
        rules: [
          {
            id:       '123',
            key:      '123',
            operator: 'anything',
            values:   '123'
          }
        ]
      })
    });

    const select = wrapper.find(`[data-testid="input-match-expression-${ field }-0"]`);

    select.find('button').trigger('click');
    await wrapper.trigger('keydown.down');
    await wrapper.trigger('keydown.enter');

    expect(wrapper.emitted('update:value')).toHaveLength(1);
  });
});
