<script>

import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import { stringify } from '@shell/utils/error';
import LazyImage from '@shell/components/LazyImage';

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

// i18n-uses wizard.next, wizard.edit, wizard.create, wizard.view, wizard.finish
export default {
  name: 'Wizard',

  emits: ['next', 'cancel', 'finish'],

  components: {
    AsyncButton,
    Banner,
    Loading,
    LazyImage,
  },

  props: {
    /*
  steps need: {
    name: String - this will be the slot name
    label: String - this will appear in the top nav bar below circles
    subtext: String (optional) - If defined, appears below the step number in the banner. If blank, label is used
    ready: Boolean - whether or not the step is completed/wizard is able to go to next step
      if a step has ready=true, the wizard also allows navigation *back* to it
    hidden: Don't show step, though include in DOM (dynamic steps must be in DOM to determine if they will include themselves in wizard)
    loading: Wizard will block until all steps are not loading
    nextButton?: {
      labelKey?: default to `wizard.next`
      style?:  defaults to `btn role-primary`
    },
    previousButton: {
      disable: defaults to false
    }
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

    // Verb shown in the header, defaults to finishMode
    headerMode: {
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
      return ( this.errors || [] ).map((x) => stringify(x));
    },

    activeStepIndex() {
      return this.visibleSteps.findIndex((s) => s.name === this.activeStep.name);
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

    canPrevious() {
      return !this.activeStep?.previousButton?.disable && (this.activeStepIndex > 1 || this.editFirstStep);
    },

    canNext() {
      const activeStep = this.visibleSteps[this.activeStepIndex];

      return (this.activeStepIndex < this.visibleSteps.length - 1) && activeStep.ready;
    },

    readySteps() {
      return this.visibleSteps.filter((step) => step.ready);
    },

    showSteps() {
      return this.activeStep.showSteps !== false && this.visibleSteps.length > 1;
    },

    stepsLoaded() {
      return !this.steps.some((step) => step.loading === true);
    },

    visibleSteps() {
      return this.steps.filter((step) => !step.hidden);
    },

    nextButtonStyle() {
      return this.activeStep.nextButton?.style || `btn role-primary`;
    },
    nextButtonLabel() {
      return this.activeStep.nextButton?.labelKey || `wizard.next`;
    }
  },

  watch: {
    stepsLoaded(neu, old) {
      if (!old && neu) {
        this.activeStep = this.visibleSteps[this.initStepIndex];
        this.goToStep(this.activeStepIndex + 1);
      }
    },
    errors() {
      // Ensurce we scroll the errors into view
      this.$nextTick(() => {
        this.$refs.wizard.scrollTop = this.$refs.wizard.scrollHeight;
      });
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

      const idx = this.visibleSteps.findIndex((s) => s.name === step.name);

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
  <div
    ref="wizard"
    class="outer-container"
  >
    <Loading
      v-if="!stepsLoaded"
      mode="relative"
    />
    <!-- Note - Don't v-else this.... the steps need to be included in order to update 'stepsLoaded' -->
    <div
      class="outer-container"
      :class="{'hide': !stepsLoaded}"
    >
      <div>
        <div class="header">
          <div class="title">
            <div
              v-if="showBanner"
              class="top choice-banner"
            >
              <slot
                v-if="!!bannerImage || !!bannerTitle"
                name="bannerTitle"
              >
                <div
                  v-show="initialTitle || activeStepIndex > 0"
                  class="title"
                >
                  <!-- Logo -->
                  <slot name="bannerTitleImage">
                    <div
                      v-if="bannerImage"
                      class="round-image"
                    >
                      <LazyImage
                        :src="bannerImage"
                        class="logo"
                      />
                    </div>
                  </slot>
                  <!-- Title with subtext -->
                  <div class="subtitle">
                    <h2 v-if="bannerTitle">
                      {{ bannerTitle }}
                    </h2>
                    <span
                      v-if="bannerTitleSubtext"
                      class="subtext"
                    >{{ bannerTitleSubtext }}</span>
                  </div>
                </div>
              </slot>
              <!-- Step number with subtext -->
              <div
                v-if="activeStep && showSteps"
                class="subtitle"
              >
                <h2>{{ !!headerMode ? t(`wizard.${headerMode}`) : t(`asyncButton.${finishMode}.action`) }}: {{ t('wizard.step', {number:activeStepIndex+1}) }}</h2>
                <slot name="bannerSubtext">
                  <span
                    v-if="activeStep.subtext !== null"
                    class="subtext"
                  >{{ activeStep.subtext || activeStep.label }}</span>
                </slot>
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
                <template
                  v-for="(step, idx ) in visibleSteps"
                  :key="idx"
                >
                  <li

                    :id="step.name"
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
                      <span
                        class="icon icon-lg"
                        :class="{'icon-dot': step.name === activeStep.name, 'icon-dot-open':step.name !== activeStep.name}"
                      />
                      <span>
                        {{ step.label }}
                      </span>
                    </span>
                  </li>
                  <div
                    v-if="idx!==visibleSteps.length-1"
                    :key="step.name"
                    class="divider"
                  />
                </template>
              </ul>
            </div>
          </div>
        </div>
        <slot
          class="step-container"
          name="stepContainer"
          :activeStep="activeStep"
        >
          <template
            v-for="(step, i) in steps"
            :key="i"
          >
            <div
              v-if="step.name === activeStep.name || step.hidden"
              :key="step.name"
              class="step-container__step"
              :class="{'hide': step.name !== activeStep.name && step.hidden}"
            >
              <slot
                :step="step"
                :name="step.name"
              />
            </div>
          </template>
        </slot>
      </div>
      <slot
        name="controlsContainer"
        :showPrevious="showPrevious"
        :next="next"
        :back="back"
        :canNext="canNext"
        :activeStepIndex="activeStepIndex"
        :visibleSteps="visibleSteps"
        :errorStrings="errorStrings"
        :finish="finish"
        :cancel="cancel"
        :activeStep="activeStep"
      >
        <div
          v-for="(err,idx) in errorStrings"
          :key="idx"
        >
          <Banner
            color="error"
            :label="err"
            :closable="true"
            class="footer-error"
            @close="errors.splice(idx, 1)"
          />
        </div>
        <div
          id="wizard-footer-controls"
          class="controls-row pt-20"
        >
          <slot
            name="cancel"
            :cancel="cancel"
          >
            <button
              type="button"
              class="btn role-secondary"
              @click="cancel"
            >
              <t k="generic.cancel" />
            </button>
          </slot>
          <div class="controls-steps">
            <slot
              v-if="showPrevious"
              name="back"
              :back="back"
            >
              <button
                :disabled="!canPrevious || (!editFirstStep && activeStepIndex===1)"
                type="button"
                class="btn role-secondary"
                @click="back()"
              >
                <t k="wizard.previous" />
              </button>
            </slot>
            <slot
              v-if="activeStepIndex === visibleSteps.length-1"
              name="finish"
              :finish="finish"
            >
              <AsyncButton
                :disabled="!activeStep.ready"
                :mode="finishMode"
                @click="finish"
              />
            </slot>
            <slot
              v-else
              name="next"
              :next="next"
            >
              <button
                :disabled="!canNext"
                type="button"
                :class="nextButtonStyle"
                @click="next()"
              >
                <t :k="nextButtonLabel" />
              </button>
            </slot>
          </div>
        </div>
      </slot>
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
  justify-content: space-between;
}

.header {
  display: flex;
  align-content: space-between;
  align-items: center;
  margin-bottom: 2*$spacer;

  border-bottom: var(--header-border-size) solid var(--header-border);

 $minHeight: 60px;
  & > .title {
    flex: 1;
    min-height: $minHeight;
    display: flex;
  }
  .step-sequence {
    flex:1;
    min-height: $minHeight;
    display: flex;

    .steps {
      flex: 1;
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

        & > span > span:last-of-type {
          padding-bottom: 0;
        }

        &:last-of-type{
          flex-grow: 0;
        }

        & .controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 40px;
          overflow: visible;
          padding-top: 7px;

          & > span {
            padding-bottom: 3px;
            margin-bottom: 5px;
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
        top: 17px;

        .cru__content & {
          top: 13px;
        }
      }
    }
  }

  .choice-banner {

    flex-basis: 40%;
    display: flex;
    align-items: center;
    margin-bottom: $spacer;

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
        position: relative;

        & > .subtitle {
          margin-right: 20px;
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
    overflow: hidden;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
}

// We have to account for the absolute position of the .controls-row
.footer-error {
  margin-top: -40px;
  margin-bottom: 70px;
}

  .controls-row {

    // Overrides outlet padding
    margin-left: -$space-m;
    margin-right: -$space-m;
    padding: $space-s $space-m;

    display: flex;
    justify-content: space-between;
    padding-top: $spacer;

    border-top: var(--header-border-size) solid var(--header-border);
    position: absolute;
    bottom: 0;
    width: 100%;
    background: var(--body-bg);
    .controls-steps {

      .btn {
        margin-left: $spacer;
      }
    }
  }

</style>
