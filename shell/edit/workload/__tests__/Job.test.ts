import { mount } from '@vue/test-utils';
import Job from '@shell/edit/workload/Job.vue';
import { _EDIT } from '@shell/config/query-params';
import { WORKLOAD_TYPES } from '@shell/config/types';
import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';

describe('component: Job', () => {
  describe('given CronJob types', () => {
    it.each([
      'successful',
      'failed',
    ])('should emit an update on %p input', (field) => {
      const wrapper = mount(Job, {
        directives: { cleanHtmlDirective },
        propsData:  {
          mode: _EDIT,
          type: WORKLOAD_TYPES.CRON_JOB
        }
      });
      const input = wrapper.find(`[data-testid="input-job-${ field }"]`).find('input');
      const newValue = 123;

      input.setValue(newValue);

      expect(wrapper.emitted('input')).toHaveLength(1);
    });

    it.each([
      'concurrencyPolicy',
      'suspend',
    ])('should emit an update on %p radio option change', (field) => {
      const wrapper = mount(Job, {
        propsData: {
          mode: _EDIT,
          type: WORKLOAD_TYPES.CRON_JOB
        }
      });
      const radioOption = wrapper
        .find(`[data-testid="input-job-${ field }"]`)
        .find('label');

      radioOption.trigger('click');

      expect(wrapper.emitted('input')).toHaveLength(1);
    });
  });

  describe.each([
    [WORKLOAD_TYPES.JOB, []],
    [WORKLOAD_TYPES.CRON_JOB, ['startingDeadlineSeconds', 'termination']],
  ])('given workload type %p', (type, extraFields) => {
    it.each([
      ...extraFields,
      'completions',
      'parallelism',
      'backoffLimit',
      'activeDeadlineSeconds',
    ])('should emit an update on %p input and blur', (field) => {
      const wrapper = mount(Job, {
        propsData: {
          mode: _EDIT,
          type
        }
      });
      const input = wrapper.find(`[data-testid="input-job-${ field }"]`).find('input');
      const newValue = 123;

      input.setValue(newValue);
      input.trigger('blur');

      expect(wrapper.emitted('input')).toHaveLength(1);
    });
  });
});
