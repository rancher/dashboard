<script>
import Wizard from '@/components/Wizard';

export default {
  components: { Wizard },

  data() {
    const steps = [
      {
        name:   'step1',
        active: false,
        label:  'one',
        ready:  true,
      },
      {
        name:   'step2',
        active: false,
        label:  'two',
        ready:  true,
      },
      {
        name:   'step3',
        active: false,
        label:  'three',
      },
      {
        name:   'step4',
        active: false,
        label:  'four',
        ready:  true
      }
    ];

    return { steps };
  },

};
</script>

<template>
  <div>
    <Wizard :steps="steps">
      <template #step1>
        step 1
      </template>
      <template #step2="stepProps">
        {{ stepProps }}
      </template>
      <template #step3>
        <button class="btn role-secondary" @click="$set(steps[2], 'ready', true)">
          ready!
        </button>
      </template>
    </Wizard>
  </div>
</template>
