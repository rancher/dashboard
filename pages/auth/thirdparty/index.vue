<script>
import Wizard from '@/components/Wizard';
import Step from '@/components/Wizard/Step';

export default {
  components: {
    Wizard,
    Step
  }

};
</script>

<template>
  <div>
    <Wizard>
      <Step>
        step 1
      </Step>
      <Step>
        step 2
      </Step>
      <Step>
        step 3
      </Step>
      <Step>
        step 4
      </Step>
      <Step>
        step 5
      </Step>
    </Wizard>
    <div class="spacer" />
    <div class="text-center">
      <button type="button" class="btn role-secondary">
        <t k="generic.cancel" />
      </button>
      <button type="button" class="btn role-primary" @click="nextStep(1)">
        <t k="wizard.next" />
      </button>
    </div>
  </div>
</template>
