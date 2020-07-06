<script>
export default {
  props:      {
    mode: {
      type:    String,
      default: 'create'
    },

    /*
  steps need: {
    name: String - this will be the slot name
    label: String - this will appear in the top nav bar below circles
    active: Boolean - whether or not the step is currently shown. If more than one step has active=true, the earlier of the two shows
      if none are active, the first step shows
    ready: Boolean - whether or not the step is completed/wizard is able to go to next step
      if a step has ready=true, the wizard also allows navigation *back* to it
  }
*/
    steps: {
      type:    Array,
      default: () => []
    }
  },

  computed: {
    activeStep() {
      return this.steps.filter(step => !!step.active)[0];
    },

    activeStepIndex() {
      return this.steps.indexOf(this.activeStep);
    },

    canNext() {
      return (this.activeStepIndex < this.steps.length - 1) && this.activeStep.ready;
    },

    readySteps() {
      return this.steps.filter(step => step.ready);
    }

  },

  watch: {
    '$route.query'(neu = {}) {
      this.goToStep(neu.step);
    },
  },

  created() {
    const { $route: { query = {} } } = this;

    // if any step has active===true, load that step. Otherwise, load step defined in query param. Otherwise, load first step.
    const stepNumber = this.activeStep ? this.steps.indexOf(this.activeStep) + 1 : query.step || 1;

    const step = this.steps[stepNumber - 1] || this.steps[0];

    if ( step ) {
      this.goToStep(stepNumber);
    }
  },

  methods: {
    goToStep(number/* , event */) {
      if (number < 1) {
        return;
      }
      const {
        steps,
        $route: { query:{ step: queryStep } },
      } = this;

      const selected = steps[number - 1];

      if ( !selected || !this.isAvailable(selected)) {
        return;
      }

      if (queryStep !== number) {
        this.$router.push({ ...this.$route, query: { ...this.$route.query, step: number } });
      }

      steps.map((step, idx) => {
        this.$set(step, 'active', idx === (number - 1));
      });

      this.$emit('next', { step: selected });
    },

    cancel() {
      this.goToStep(1);
      this.$emit('cancelled');
    },

    finish() {
      this.$emit('finish');
    },

    // a step is not available if ready=false for any previous steps
    isAvailable(step) {
      if (!step) {
        return false;
      }

      const idx = this.steps.indexOf(step);

      for (let i = 0; i < idx; i++) {
        if (!this.steps[i].ready) {
          return false;
        }
      }

      return true;
    }
  }
};
</script>

<template>
  <div>
    <ul
      class="steps"
      tabindex="0"
      @keyup.39.stop="selectNext(1)"
      @keyup.37.stop="selectNext(-1)"
    >
      <template v-for="(step, idx ) in steps">
        <li

          :id="step.name"
          :key="step.name"
          :class="{step: true, active: step.active, disabled: !isAvailable(step) || idx===0}"
          role="presentation"
        >
          <span
            :aria-controls="'step' + idx+1"
            :aria-selected="step.active"
            role="tab"
            class="controls"
            @click.prevent="goToStep(idx+1, $event)"
          >
            <span class="icon icon-lg" :class="{'icon-dot': !step.active, 'icon-dot-open':step.active}" />
            <span>
              {{ step.label }}
            </span>
          </span>
        </li>
        <div v-if="idx!==steps.length-1" :key="step.name" class="divider" />
      </template>
    </ul>

    <div class="step-container">
      <div v-for="step in steps" :key="step.name">
        <template v-if="step.active">
          <slot :step="step" :name="step.name">
            {{ step.name }}'s slot is unused
          </slot>
        </template>
      </div>
    </div>
    <div class="spacer" />
    <div class="text-center">
      <slot name="cancel" :cancel="cancel">
        <button v-if="activeStepIndex" type="button" class="btn role-secondary" @click="cancel">
          <t k="generic.cancel" />
        </button>
      </slot>
      <slot v-if="activeStepIndex === steps.length-1" name="finish" :finish="finish">
        <button :disabled="!activeStep.ready" type="button" class="btn role-primary" @click="finish">
          <t k="wizard.finish" />
        </button>
      </slot>
      <button v-else :disabled="!canNext" type="button" class="btn role-primary" @click="goToStep(activeStepIndex+2)">
        <t k="wizard.next" />
      </button>
    </div>
  </div>
</template>

<style lang='scss'>
.steps {
    margin: 0 20% 0 20%;;
    display:flex;
    justify-content: space-between;
    list-style-type:none;
    padding: 0;

    &:focus{
        outline:none;
        box-shadow: none;
    }

    & li.step{
      display: flex;
      flex-direction: row;
      flex-grow: 1;
      align-items: center;

      &:last-of-type{
        flex-grow: 0;
      }

      & .controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 40px;
        overflow: visible;
      }

      &.active .controls{
        color: var(--primary);
      }

      &:not(.disabled){
        & .controls:hover>*{
            color: var(--primary) !important
        }
      }

      &:not(.active) {
        & .controls>*{
          color: var(--input-disabled-text);
          text-decoration: none;
        }
      }
    }

    & .divider {
      flex-basis: 100%;
      border-top: 1px solid var(--border);
      position: relative;
      top: 5px;
    }
}
</style>
