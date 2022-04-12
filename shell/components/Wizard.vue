<script>

import AsyncButton from '@shell/components/AsyncButton';
import Banner from '@shell/components/Banner';
import Loading from '@shell/components/Loading';
import { stringify } from '@shell/utils/error';

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
  components: {
    AsyncButton,
    Banner,
    Loading,
  },

  props:      {
    /*
  steps need: {
    name: String - this will be the slot name
    label: String - this will appear in the top nav bar below circles
    subtext: String (optional) - If defined, appears below the step number in the banner. If blank, label is used
    ready: Boolean - whether or not the step is completed/wizard is able to go to next step
      if a step has ready=true, the wizard also allows navigation *back* to it
    hidden: Don't show step, though include in DOM (dynamic steps must be in DOM to determine if they will include themselves in wizard)
    loading: Wizard will block until all steps are not loading
  }
  */
    steps: {
      type:     Array,
      required: true
    },

    // Initial step to show when Wizard loads.
    initStepIndex: {
      type:    Number,
      default: 0
    },

    // if true, allow users to navigate back to the first step of the Wizard
    // if false, only way back to step 1 is to cancel and undo all configuration
    editFirstStep: {
      type:    Boolean,
      default: false
    },

    showBanner: {
      type:    Boolean,
      default: true,
    },

    // whether or not to show the overall title/image on left of banner header in first step
    initialTitle: {
      type:    Boolean,
      default: true
    },

    // place the same title (e.g. the type of thing being created by wizard) on every page
    bannerTitle: {
      type:    String,
      default: null
    },

    // circular image left of banner title
    bannerImage: {
      type:    String,
      default: null
    },

    bannerTitleSubtext: {
      type:    String,
      default: null
    },

    // The set of labels to display for the finish AsyncButton
    finishMode: {
      type:    String,
      default: 'finish'
    },

    // Errors to display above the buttons
    errors: {
      type:    Array,
      default: null,
    }
  },

  data() {
    return { activeStep: null };
  },

  computed: {
    errorStrings() {
      return ( this.errors || [] ).map(x => stringify(x));
    },

    activeStepIndex() {
      return this.visibleSteps.findIndex(s => s.name === this.activeStep.name);
    },

    showPrevious() {
      // If on first step...
      if (this.activeStepIndex === 0) {
        return false;
      }
      // .. or any previous step isn't hidden
      for (let stepIndex = 0; stepIndex < this.activeStepIndex; stepIndex++) {
        const step = this.visibleSteps[stepIndex];

        if (!step) {
          break;
        }
        if (!step.hidden) {
          return true;
        }
      }

      return false;
    },

    canNext() {
      return (this.activeStepIndex < this.visibleSteps.length - 1) && this.activeStep.ready;
    },

    readySteps() {
      return this.visibleSteps.filter(step => step.ready);
    },

    showSteps() {
      return this.activeStep.showSteps !== false && this.visibleSteps.length > 1;
    },

    stepsLoaded() {
      return !this.steps.some(step => step.loading === true);
    },

    visibleSteps() {
      return this.steps.filter(step => !step.hidden);
    }
  },

  watch: {
    stepsLoaded(neu, old) {
      if (!old && neu) {
        this.activeStep = this.visibleSteps[this.initStepIndex];
        this.goToStep(this.activeStepIndex + 1);
      }
    }
  },

  created() {
    this.activeStep = this.visibleSteps[this.initStepIndex];
    this.goToStep(this.activeStepIndex + 1);
  },

  methods: {
    goToStep(number, fromNav) {
      if (number < 1) {
        return;
      }

      // if editFirstStep is false, do not allow returning to step 1 (restarting wizard) from top nav
      if (!this.editFirstStep && (number === 1 && fromNav)) {
        return;
      }

      const selected = this.visibleSteps[number - 1];

      if ( !selected || (!this.isAvailable(selected) && number !== 1)) {
        return;
      }

      this.activeStep = selected;

      this.$emit('next', { step: selected });
    },

    cancel() {
      this.$emit('cancel');
    },

    finish(cb) {
      this.$emit('finish', cb);
    },

    next() {
      this.goToStep(this.activeStepIndex + 2);
    },

    back() {
      this.goToStep(this.activeStepIndex);
    },

    // a step is not available if ready=false for any previous steps OR if the editFirstStep=false and it is the first step
    isAvailable(step) {
      if (!step) {
        return false;
      }

      const idx = this.visibleSteps.findIndex(s => s.name === step.name);

      if (idx === 0 && !this.editFirstStep) {
        return false;
      }

      for (let i = 0; i < idx; i++) {
        if ( this.visibleSteps[i].ready === false ) {
          return false;
        }
      }

      return true;
    },
  }
};
</script>

<template>
  <div class="outer-container">
    <Loading v-if="!stepsLoaded" mode="relative" />
    <!-- Note - Don't v-else this.... the steps need to be included in order to update 'stepsLoaded' -->
    <div class="outer-container" :class="{'hide': !stepsLoaded}">
      <div class="header">
        <div class="title">
          <div v-if="showBanner" class="top choice-banner">
            <div v-show="initialTitle || activeStepIndex > 0" class="title">
              <!-- Logo -->
              <slot name="bannerTitleImage">
                <div v-if="bannerImage" class="round-image">
                  <LazyImage :src="bannerImage" class="logo" />
                </div>
              </slot>
              <!-- Title with subtext -->
              <div class="subtitle">
                <h2 v-if="bannerTitle">
                  {{ bannerTitle }}
                </h2>
                <span v-if="bannerTitleSubtext" class="subtext">{{ bannerTitleSubtext }}</span>
              </div>
            </div>
            <!-- Step number with subtext -->
            <div v-if="activeStep && showSteps" class="subtitle">
              <h2>{{ t(`asyncButton.${finishMode}.action`) }}: {{ t('wizard.step', {number:activeStepIndex+1}) }}</h2>
              <slot name="bannerSubtext">
                <span class="subtext">{{ activeStep.subtext || activeStep.label }}</span>
              </slot>
            </div>
          </div>
        </div>
        <div class="step-sequence">
          <ul
            v-if="showSteps"
            class="steps"
            tabindex="0"
            @keyup.right.stop="selectNext(1)"
            @keyup.left.stop="selectNext(-1)"
          >
            <template v-for="(step, idx ) in visibleSteps">
              <li

                :id="step.name"
                :key="step.name+'li'"
                :class="{step: true, active: step.name === activeStep.name, disabled: !isAvailable(step)}"
                role="presentation"
              >
                <span
                  :aria-controls="'step' + idx+1"
                  :aria-selected="step.name === activeStep.name"
                  role="tab"
                  class="controls"
                  @click.prevent="goToStep(idx+1, true)"
                >
                  <span class="icon icon-lg" :class="{'icon-dot': step.name === activeStep.name, 'icon-dot-open':step.name !== activeStep.name}" />
                  <span>
                    {{ step.label }}
                  </span>
                </span>
              </li>
              <div v-if="idx!==visibleSteps.length-1" :key="step.name" class="divider" />
            </template>
          </ul>
        </div>
      </div>

      <div class="step-container">
        <template v-for="step in steps">
          <div v-if="step.name === activeStep.name || step.hidden" :key="step.name" class="step-container__step" :class="{'hide': step.name !== activeStep.name && step.hidden}">
            <slot :step="step" :name="step.name" />
          </div>
        </template>
      </div>

      <div class="controls-container">
        <div v-for="(err,idx) in errorStrings" :key="idx">
          <Banner color="error" :label="err" :closable="true" @close="errors.splice(idx, 1)" />
        </div>
        <div class="controls-row pt-20">
          <slot name="cancel" :cancel="cancel">
            <button type="button" class="btn role-secondary" @click="cancel">
              <t k="generic.cancel" />
            </button>
          </slot>

          <div class="controls-steps">
            <slot v-if="showPrevious" name="back" :back="back">
              <button :disabled="!editFirstStep && activeStepIndex===1" type="button" class="btn role-secondary" @click="back()">
                <t k="wizard.previous" />
              </button>
            </slot>
            <slot v-if="activeStepIndex === visibleSteps.length-1" name="finish" :finish="finish">
              <AsyncButton
                :disabled="!activeStep.ready"
                :mode="finishMode"
                @click="finish"
              />
            </slot>
            <slot v-else name="next" :next="next">
              <button :disabled="!canNext" type="button" class="btn role-primary" @click="next()">
                <t k="wizard.next" />
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
$spacer: 10px;

.outer-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0;
}

.header {
  display: flex;
  align-content: space-between;
  align-items: center;

  border-bottom: var(--header-border-size) solid var(--header-border);

  & > .title {
    flex: 1;
    min-height: 75px;
  }
  .step-sequence {
    flex:1;

    .steps {
      margin: 0 30px;
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
  }

  .choice-banner {

    flex-basis: 40%;
    display: flex;
    align-items: center;

    &.selected{
      background-color: var(--accent-btn);
    }

    &.top {

      H2 {
        margin: 0px;
      }

      .title{
        display: flex;
        align-items: center;
        justify-content: space-evenly;

        & > .subtitle {
          margin: 0 20px;
        }
      }

      .subtitle{
        display: flex;
        flex-direction: column;
        & .subtext {
          color: var(--input-label);
        }
      }

    }

    &:not(.top){
      box-shadow: 0px 0px 12px 3px var(--box-bg);
      flex-direction: row;
      align-items: center;
      justify-content: start;
      &:hover{
        outline: var(--outline-width) solid var(--outline);
        cursor: pointer;
      }
    }

    & .round-image {
      min-width: 50px;
      height: 50px;
      margin: 10px 10px 10px 0;
      border-radius: 50%;
      overflow: hidden;
      .logo {
        min-width: 50px;
        height: 50px;
      }
    }
  }
}

.step-container {
  position: relative; // Important for loading indicator in chart's with custom form components
  flex: 1 1 auto;
  height: 0;
  overflow-y: auto;
  padding: 20px 2px 2px 2px; // Handle borders flush against edge

  display: flex;
  flex-direction: column;

  &__step {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
}

.controls-container {
  .controls-row {
    display: flex;
    justify-content: space-between;
    padding-top: $spacer;

    border-top: var(--header-border-size) solid var(--header-border);

    .controls-steps {

      .btn {
        margin-left: $spacer;
      }
    }
  }
}

</style>
