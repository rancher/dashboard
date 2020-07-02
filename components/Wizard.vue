<script>
/*
Wizard accepts an array of steps (see props), and creates named slots for each step.
It also contains slots for buttons:
    next
    cancel
    finish

Wizard will emit these events:
    next({step})
    cancel
    finish
*/

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
    subText: String (optional) - If defined, appears in the Step {number}: banner. If blank, label is used
    ready: Boolean - whether or not the step is completed/wizard is able to go to next step
      if a step has ready=true, the wizard also allows navigation *back* to it
  }
  */
    steps: {
      type:    Array,
      default: () => []
    },

    // Initial step to show when Wizard loads. This is overruled by the 'step' query param, if available
    initStepIdx: {
      type:    Number,
      default: 0
    },

    // if true, allow users to navigate back to the first step of the Wizard
    // if false, only way back to step 1 is to cancel and undo all configuration
    editFirstStep: {
      type:    Boolean,
      default: false
    }
  },

  asyncData(ctx) {
    const { route:{ query } } = ctx;

    return { queryStep: query.step };
  },

  data() {
    return { activeStep: this.queryStep || this.steps[this.initStepIdx] };
  },

  computed: {
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
    goToStep(number, fromNav) {
      // if editFirstStep is false, do not allow returning to step 1 (restarting wizard) from top nav
      if (!this.editFirstStep && (number < 1 || (number === 1 && fromNav))) {
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

      this.activeStep = selected;

      this.$emit('next', { step: selected });
    },

    cancel() {
      this.goToStep(1);
      this.$emit('cancel');
    },

    finish() {
      this.$emit('finish');
    },

    next() {
      this.goToStep(this.activeStepIndex + 2);
    },

    // a step is not available if ready=false for any previous steps OR if the editFirstStep=false and it is the first step
    isAvailable(step) {
      if (!step) {
        return false;
      }

      const idx = this.steps.indexOf(step);

      if (idx === 0 && !this.editFirstStep) {
        return false;
      }

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
      @keyup.right.stop="selectNext(1)"
      @keyup.left.stop="selectNext(-1)"
    >
      <template v-for="(step, idx ) in steps">
        <li

          :id="step.name"
          :key="step.name+'li'"
          :class="{step: true, active: step.active, disabled: !isAvailable(step)}"
          role="presentation"
        >
          <span
            :aria-controls="'step' + idx+1"
            :aria-selected="step.active"
            role="tab"
            class="controls"
            @click.prevent="goToStep(idx+1, true)"
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

    <div class="spacer" />

    <div class="step-banner btn-tab">
      <h2> {{ t('wizard.step', {number:activeStepIndex+1}) }}</h2>
      <span>{{ activeStep.subText || activeStep.label }}</span>
    </div>

    <div class="spacer" />

    <div class="step-container">
      <div v-for="step in steps" :key="step.name">
        <template v-if="step === activeStep">
          <slot :step="step" :name="step.name" />
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
      <slot v-else name="next" :next="next">
        <button :disabled="!canNext" type="button" class="btn role-primary" @click="next()">
          <t k="wizard.next" />
        </button>
      </slot>
    </div>
  </div>
</template>

<style lang='scss'>

.btn-tab {
  border-radius: var(--border-radius);
  border-left: 5px solid var(--primary);
  padding: 40px 10px 40px 10px;
  flex-direction: column;
  justify-content: center;
}

.step-banner{
  background-image: linear-gradient(-90deg, var(--body-bg) , var(--accent-btn));

  & SPAN {
    color: var(--input-label);
  }
}

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
        & > span {
          padding-bottom: 10px;
          white-space: nowrap;
        }
      }

      &.active .controls{
        color: var(--primary);
      }

      &:not(.disabled){
        & .controls:hover>*{
            color: var(--primary) !important;
            cursor: pointer;
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
