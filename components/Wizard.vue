<script>
import { STEP } from '@/config/query-params';
import { SCHEMA } from '@/config/types';
import { createYaml } from '@/utils/create-yaml';
import AsyncButton from '@/components/AsyncButton';
import Banner from '@/components/Banner';
import ButtonDropdown from '@/components/ButtonDropdown';
import ResourceYaml from '@/components/ResourceYaml';

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
    ButtonDropdown,
    Banner,
    ResourceYaml
  },

  props:      {
    mode: {
      type:    String,
      default: 'create'
    },

    /*
  steps need: {
    name: String - this will be the slot name
    label: String - this will appear in the top nav bar below circles
    subtext: String (optional) - If defined, appears below the step number in the banner. If blank, label is used
    ready: Boolean - whether or not the step is completed/wizard is able to go to next step
      if a step has ready=true, the wizard also allows navigation *back* to it
  }
  */
    steps: {
      type:    Array,
      default: () => []
    },

    // Initial step to show when Wizard loads. This is overruled by the 'step' query param, if available
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

    // The set of labels to display for the finish AsyncButton
    finishMode: {
      type:    String,
      default: 'finish'
    },

    doneRoute: {
      type:     String,
      required: true
    },

    resource: {
      type:     Object,
      required: true,
    },

    canCreateImmediately: {
      type:    Boolean,
      default: false,
    },

    // Errors to display above the buttons
    errors: {
      type:    Array,
      default: null,
    }
  },
  data() {
    const queryStep = this.$route.query[STEP];

    const activeStep = queryStep ? this.steps[queryStep - 1] : this.steps[this.initStepIndex];

    return {
      activeStep,
      previewModalOpen:       false,
      resourceYaml:           '',
      showpreviewYamlWarning: false,
    };
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
    },

    showSteps() {
      return this.activeStep.showSteps !== false;
    }
  },

  watch: {
    '$route.query'(neu = {}) {
      this.goToStep(neu[STEP]);
    },
  },
  created() {
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

      const {
        steps,
        $route: { query:{ step: queryStep } },
      } = this;

      const selected = steps[number - 1];

      if ( !selected || (!this.isAvailable(selected) && number !== 1)) {
        return;
      }

      if (queryStep !== number) {
        this.$router.replace({ query: { [STEP]: number } }).catch((e) => {
          if (e?.name === 'NavigationDuplicated') {
            // ignore this
          } else if (e.message.includes('with a new navigation')) {
            // route changed by tabs; retry
            this.$router.applyQuery({ [STEP]: number });
          }
        });
      }

      this.activeStep = selected;

      this.$emit('next', { step: selected });
    },

    cancel() {
      this.$router.applyQuery({ [STEP]: 1 });
      this.$emit('cancel');
    },

    finish(cb) {
      this.$emit('finish', cb);
    },

    finishImmediately() {
      const { canCreateImmediately } = this;

      if (canCreateImmediately) {
        this.$emit('finish', (success) => {
          if (success) {
            this.$router.replace({
              name:   this.doneRoute,
              params: { resource: this.resource.type }
            });
          }
        });
      }
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

      const idx = this.steps.indexOf(step);

      if (idx === 0 && !this.editFirstStep) {
        return false;
      }

      for (let i = 0; i < idx; i++) {
        if ( this.steps[i].ready === false ) {
          return false;
        }
      }

      return true;
    },

    showPreviewYaml(show) {
      const schemas = this.$store.getters['cluster/all'](SCHEMA);
      const { resource } = this;

      this.$emit('clearErrors');

      this.resourceYaml = createYaml(schemas, resource.type, resource);

      this.previewModalOpen = true;

      this.$nextTick(() => {
        this.$modal.toggle('previewYaml');
      });
    },

    cancelYamlPreview(cb) {
      const { showpreviewYamlWarning } = this;

      if (showpreviewYamlWarning) {
        this.resourceYaml = null;
        this.showpreviewYamlWarning = false;
        this.previewModalOpen = false;
        this.$modal.hide('previewYaml');
      } else {
        this.showpreviewYamlWarning = true;
      }
    },
  }
};
</script>

<template>
  <div>
    <ul
      v-if="showSteps"
      class="steps"
      tabindex="0"
      @keyup.right.stop="selectNext(1)"
      @keyup.left.stop="selectNext(-1)"
    >
      <template v-for="(step, idx ) in steps">
        <li

          :id="step.name"
          :key="step.name+'li'"
          :class="{step: true, active: step === activeStep, disabled: !isAvailable(step)}"
          role="presentation"
        >
          <span
            :aria-controls="'step' + idx+1"
            :aria-selected="step === activeStep"
            role="tab"
            class="controls"
            @click.prevent="goToStep(idx+1, true)"
          >
            <span class="icon icon-lg" :class="{'icon-dot': step !== activeStep, 'icon-dot-open':step === activeStep}" />
            <span>
              {{ step.label }}
            </span>
          </span>
        </li>
        <div v-if="idx!==steps.length-1" :key="step.name" class="divider" />
      </template>
    </ul>

    <div v-if="showSteps" class="spacer" />

    <div v-if="showBanner" class="top choice-banner">
      <div v-show="initialTitle || activeStepIndex > 0" class="title">
        <div class="round-image">
          <slot name="bannerTitleImage">
            <img :src="bannerImage" />
          </slot>
        </div>
        <h2 v-if="bannerTitle">
          {{ bannerTitle }}
        </h2>
      </div>
      <div class="subtitle">
        <h2> {{ t('wizard.step', {number:activeStepIndex+1}) }}</h2>
        <slot name="bannerSubtext">
          <span class="subtext">{{ activeStep.subtext || activeStep.label }}</span>
        </slot>
      </div>
    </div>

    <div v-if="showBanner" class="spacer-bordered" />

    <div class="step-container">
      <div v-for="step in steps" :key="step.name">
        <template v-if="step === activeStep">
          <slot :step="step" :name="step.name" />
        </template>
      </div>
    </div>

    <div class="spacer-bordered" />

    <div v-if="!previewModalOpen">
      <div v-for="(err,idx) in errors" :key="idx">
        <Banner color="error" :label="err" />
      </div>
    </div>

    <div class="controls-row">
      <slot name="cancel" :cancel="cancel">
        <button type="button" class="btn role-secondary" @click="cancel">
          <t k="generic.cancel" />
        </button>
      </slot>

      <div>
        <slot v-if="activeStepIndex!==0" name="back" :back="back">
          <button :disabled="!editFirstStep && activeStepIndex===1" type="button" class="btn role-secondary" @click="back()">
            <t k="wizard.back" />
          </button>
        </slot>
        <slot v-if="activeStepIndex === steps.length-1" name="finish" :finish="finish">
          <AsyncButton
            :disabled="!activeStep.ready"
            :mode="finishMode"
            @click="finish"
          />
        </slot>
        <slot v-else name="next" :next="next" :canNext="canNext">
          <ButtonDropdown
            :key="!resourceYaml"
            class="inline-block"
          >
            <template #button-content="{ buttonSize }">
              <button
                type="button"
                class="btn bg-transparent"
                :class="buttonSize"
                :disabled="!canNext"
                @click="next()"
              >
                <t k="wizard.next" />
              </button>
            </template>

            <template #popover-content="{buttonSize}">
              <ul class="list-unstyled menu" style="margin: -1px;">
                <li
                  :class="{ hand: canCreateImmediately, 'no-select bg-disabled': !canCreateImmediately }"
                  @click="finishImmediately"
                >
                  <button
                    type="button"
                    class="bg-transparent p-0"
                    :class="buttonSize"
                    :disabled="!canCreateImmediately"
                  >
                    <t k="wizard.create" />
                  </button>
                </li>
                <li
                  class="hand"
                  @click="showPreviewYaml"
                >
                  <button
                    type="button"
                    class="bg-transparent p-0"
                    :class="buttonSize"
                  >
                    <t k="wizard.preview.label" />
                  </button>
                </li>
              </ul>
            </template>
          </ButtonDropdown>
        </slot>
      </div>
    </div>

    <modal
      class="preview-resource-creation-modal"
      name="previewYaml"
      height="auto"
      :click-to-close="false"
    >
      <ResourceYaml
        ref="serviceyaml"
        :value="resource"
        :mode="mode"
        :yaml="resourceYaml"
        :offer-preview="false"
        :done-route="doneRoute"
        :done-override="cancelYamlPreview"
      />
      <Banner
        v-if="showpreviewYamlWarning"
        color="warning"
        :label="t('wizard.preview.cancel')"
      />
      <div v-for="(err,idx) in errors" :key="idx">
        <Banner color="error" :label="err" />
      </div>
    </modal>
  </div>
</template>

<style lang='scss'>

.choice-banner {
  padding: 10px;
  margin: 10px;
  min-height: 100px;
  flex-basis: 40%;
  border-radius: var(--border-radius);
  border-left: 5px solid var(--primary);
  display: flex;

  &.selected{
    background-color: var(--accent-btn);
  }

  &.top {
    background-image: linear-gradient(-90deg, var(--body-bg) , var(--accent-btn));

      H2 {
        margin: 0px;
      }

      .title{
        flex-basis: 10%;
        border-right: 1px solid var(--primary);
        margin-right: 20px;
        padding-right: 20px;
        display: flex;
        align-items: center;
        justify-content: space-evenly;
      }

      .subtitle{
        display: flex;
        flex-direction: column;
        justify-content: center;
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
    margin: 10px;
    border-radius: 50%;
    overflow: hidden;
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

.controls-row {
  display: flex;
  justify-content: space-between;
}

.preview-resource-creation-modal {
  .resource-yaml {
    .yaml-editor {
      min-height: 600px;
    }
    .footer-resource-yaml {
      .spacer {
        padding: 20px 0 0 0;
      }
    }
  }
  .v--modal {
    background-color: transparent;
  }
}
</style>
