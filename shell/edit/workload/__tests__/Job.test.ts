import { mount } from '@vue/test-utils';
import Job from '@shell/edit/workload/Job.vue';
import { _EDIT } from '@shell/config/query-params';
import { WORKLOAD_TYPES } from '@shell/config/types';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';

describe('component: Job', () => {
  describe('given CronJob types', () => {
    it.each([
      'successful',
      'failed',
    ])('should emit an update on %p input', (field) => {
      const wrapper = mount(Job, {
        props: {
          mode: _EDIT,
          type: WORKLOAD_TYPES.CRON_JOB
        }
      });
      const input = wrapper.find(`[data-testid="input-job-${ field }"]`).find('input');
      const newValue = 123;

      input.setValue(newValue);

      expect(wrapper.emitted('update:value')).toHaveLength(1);
    });

    it.each([
      'concurrencyPolicy',
      'suspend',
    ])('should emit an update on %p radio option change', async(field) => {
      const wrapper = mount(Job, {
        props: {
          mode: _EDIT,
          type: WORKLOAD_TYPES.CRON_JOB
        }
      });
      const radioOption = wrapper
        .find(`[data-testid="input-job-${ field }"]`)
        .findComponent(RadioGroup);

      radioOption.vm.$emit('update:value', true);
      expect(wrapper.emitted('update:value')).toHaveLength(1);
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
        props: {
          mode: _EDIT,
          type
        }
      });
      const input = wrapper.find(`[data-testid="input-job-${ field }"]`).find('input');
      const newValue = 123;

      input.setValue(newValue);

      expect(wrapper.emitted('update:value')).toHaveLength(1);
    });
  });
});
