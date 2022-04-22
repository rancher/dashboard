<script>
import isEmpty from 'lodash/isEmpty';
import { createYaml } from '@/utils/create-yaml';
import { clone } from '@/utils/object';
import { SCHEMA } from '@/config/types';
import ResourceYaml from '@/components/ResourceYaml';
import Banner from '@/components/Banner';
import AsyncButton from '@/components/AsyncButton';
import { mapGetters } from 'vuex';
import { stringify } from '@/utils/error';
import CruResourceFooter from '@/components/CruResourceFooter';
import {
  _EDIT, _VIEW, AS, _YAML, _UNFLAG, SUB_TYPE
} from '@/config/query-params';
import { BEFORE_SAVE_HOOKS } from '@/mixins/child-hook';
import Loading from '@/components/Loading';
import Wizard from '@/components/Wizard';

export default {

  name: 'CruResource',

  components: {
    AsyncButton,
    Banner,
    CruResourceFooter,
    ResourceYaml,
    Loading,
    Wizard
  },

  props: {
    doneRoute: {
      type:    String,
      default: null
    },

    cancelEvent: {
      type:    Boolean,
      default: false,
    },

    showCancel: {
      type:    Boolean,
      default: true
    },

    mode: {
      type:     String,
      required: true
    },

    resource: {
      type:     Object,
      required: true
    },

    subtypes: {
      type:    Array,
      default: () => []
    },

    selectedSubtype: {
      type:    String,
      default: null
    },

    validationPassed: {
      type:    Boolean,
      default: true
    },

    errors: {
      type:    Array,
      default: () => []
    },

    // Is the edit as yaml button allowed
    canYaml: {
      type:    Boolean,
      default: true,
    },

    // Call this function instead of the normal one to convert the resource into yaml to display
    generateYaml: {
      type:    Function,
      default: null,
    },

    // Override the set of labels shown on the button from the default save/create.
    finishButtonMode: {
      type:    String,
      default: null,
    },

    applyHooks: {
      type:    Function,
      default: null,
    },
    steps: {
      type:     Array,
      default: () => []
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
  },

  data() {
    const yaml = this.createResourceYaml();

    return {
      activeStep:    null,
      isCancelModal: false,
      showAsForm:    this.$route.query[AS] !== _YAML,
      resourceYaml:  yaml,
      initialYaml:   yaml,
      abbrSizes:     {
        3: '24px',
        4: '18px',
        5: '16px',
        6: '14px'
      }
    };
  },

  computed: {
    canSave() {
      const { validationPassed, showAsForm } = this;

      if (showAsForm) {
        if (validationPassed) {
          return true;
        }
      } else {
        return true;
      }

      return false;
    },

    canDiff() {
      return this.initialYaml !== this.resourceYaml;
    },

    canEditYaml() {
      const inStore = this.$store.getters['currentStore'](this.resource);
      const schema = this.$store.getters[`${ inStore }/schemaFor`](this.resource.type);

      return !(schema?.resourceMethods?.includes('blocked-PUT'));
    },

    isView() {
      return this.mode === _VIEW;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    _selectedSubtype() {
      if ( this.selectedSubtype ) {
        return this.selectedSubtype;
      }

      return this.$route.query[SUB_TYPE];
    },

    showSubtypeSelection() {
      if (isEmpty(this.subtypes)) {
        return false;
      }

      if (!this._selectedSubtype) {
        return true;
      }

      return false;
    },

    //
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
      return !this.steps?.some(step => step.loading === true);
    },

    visibleSteps() {
      return this.steps?.filter(step => !step.hidden);
    },

    /**
     * Prevent issues for malformed types injection
     */
    hasErrors() {
      return this.errors?.length && Array.isArray(this.errors);
    },

    ...mapGetters({ t: 'i18n/t' }),
  },

  watch: {
    stepsLoaded(neu, old) {
      if (!old && neu && this.steps.length) {
        this.activeStep = this.visibleSteps[this.initStepIndex];
        this.goToStep(this.activeStepIndex + 1);
      }
    }
  },

  created() {
    if ( this._selectedSubtype ) {
      this.$emit('select-type', this._selectedSubtype);
    }

    if (this.steps.length) {
      this.activeStep = this.visibleSteps[this.initStepIndex];
      this.goToStep(this.activeStepIndex + 1);
    }
  },

  methods: {
    stringify,

    confirmCancel(isCancelNotBack = true) {
      if (isCancelNotBack) {
        this.emitOrRoute();
      } else if (!this.showAsForm) {
        this.resourceYaml = null;
        this.showAsForm = true;
        this.$router.applyQuery({ [AS]: _UNFLAG });
      }
    },

    /**
     * Dismiss given error
     */
    closeError(index) {
      const errors = this.errors.filter((_, i) => i !== index);

      this.$emit('error', errors);
    },

    emitOrRoute() {
      if ( this.cancelEvent ) {
        this.$emit('cancel');
      } else {
        const { resource = this.resource.type } = this.$route.params;
        const doneOverride = this.resource.doneOverride;
        const doneDefault = {
          name:   this.doneRoute,
          params: { resource }
        };

        this.$router.replace(doneOverride || doneDefault);
      }
    },

    createResourceYaml() {
      const resource = this.resource;

      if ( typeof this.generateYaml === 'function' ) {
        return this.generateYaml.apply(this, resource);
      } else {
        const inStore = this.$store.getters['currentStore'](resource);
        const schemas = this.$store.getters[`${ inStore }/all`](SCHEMA);
        const clonedResource = clone(resource);

        const out = createYaml(schemas, resource.type, clonedResource);

        return out;
      }
    },

    async showPreviewYaml() {
      if ( this.applyHooks ) {
        await this.applyHooks(BEFORE_SAVE_HOOKS);
      }

      const resourceYaml = this.createResourceYaml();

      this.resourceYaml = resourceYaml;
      this.showAsForm = false;
      this.$router.applyQuery({ [AS]: _YAML });
    },

    selectType(id, event) {
      if (event?.srcElement?.tagName === 'A') {
        return;
      }

      this.$router.applyQuery({ [SUB_TYPE]: id });
      this.$emit('select-type', id);
    },

    save() {
      this.$refs.save.clicked();
    },

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
  <section class="cru">
    <form
      :is="(isView? 'div' : 'form')"
      class="create-resource-container cru__form"
    >
      <div
        class="cru__errors"
        :v-if="hasErrors"
      >
        <Banner
          v-for="(err, i) in errors"
          :key="i"
          color="error"
          :label="stringify(err)"
          :stacked="true"
          :closable="true"
          @close="closeError(i)"
        />
      </div>
      <div
        v-if="showSubtypeSelection"
        class="subtypes-container"
      >
        <slot name="subtypes" :subtypes="subtypes">
          <div
            v-for="subtype in subtypes"
            :key="subtype.id"
            class="subtype-banner"
            :class="{ selected: subtype.id === _selectedSubtype }"
            @click="selectType(subtype.id, $event)"
          >
            <slot name="subtype-content">
              <div class="subtype-container">
                <div class="subtype-logo">
                  <img
                    v-if="subtype.bannerImage"
                    :src="subtype.bannerImage"
                    :alt="(resource.type ? resource.type + ': ' : '') + (subtype.label || '')"
                  />
                  <div v-else class="round-image">
                    <div
                      v-if="subtype.bannerAbbrv"
                      class="banner-abbrv"
                    >
                      <span v-if="$store.getters['i18n/exists'](subtype.bannerAbbrv)">{{ t(subtype.bannerAbbrv) }}</span>
                      <span v-else :style="{fontSize: abbrSizes[subtype.bannerAbbrv.length]}">{{ subtype.bannerAbbrv }}</span>
                    </div>
                    <div v-else>
                      {{ subtype.id.slice(0, 1).toUpperCase() }}
                    </div>
                  </div>
                </div>
                <div class="subtype-body">
                  <div class="title" :class="{'with-description': !!subtype.description}">
                    <h5>
                      <span
                        v-if="$store.getters['i18n/exists'](subtype.label)"
                        v-html="t(subtype.label)"
                      ></span>
                      <span v-else>{{ subtype.label }}</span>
                    </h5>
                    <a v-if="subtype.docLink" :href="subtype.docLink" target="_blank" rel="noopener nofollow" class="flex-right">{{ t('generic.moreInfo') }} <i class="icon icon-external-link" /></a>
                  </div>
                  <hr v-if="subtype.description" />
                  <div v-if="subtype.description" class="description">
                    <span
                      v-if="$store.getters['i18n/exists'](subtype.description)"
                      v-html="t(subtype.description, {}, true)"
                    ></span>
                    <span v-else>{{ subtype.description }}</span>
                  </div>
                </div>
              </div>
            </slot>
          </div>
        </slot>
      </div>
      <!------ MULTI STEP PROCESS ------>
      <template v-if="showAsForm && steps.length">
        <div
          v-if="_selectedSubtype || !subtypes.length"
          class="resource-container cru__content cru__content-wizard"
        >
          <template>
            <Wizard
              v-if="resource"
              :steps="steps"
              :errors="errors"
              :edit-first-step="editFirstStep"
              :banner-title="bannerTitle"
              :banner-title-subtext="bannerTitleSubtext"
              :finish-mode="finishMode"
              class="wizard"
              @cancel="cancel"
              @error="e=>errors = e"
              @finish="finish"
            >
              <template #stepContainer class="step-container">
                <template v-for="step in steps">
                  <div v-if="step.name === activeStep.name || step.hidden" :key="step.name" class="step-container__step" :class="{'hide': step.name !== activeStep.name && step.hidden}">
                    <slot :step="step" :name="step.name" />
                  </div>
                </template>
              </template>

              <template #controlsContainer>
                <slot name="form-footer">
                  <CruResourceFooter
                    class="cru__footer"
                    :mode="mode"
                    :is-form="showAsForm"
                    :show-cancel="showCancel"
                    @cancel-confirmed="confirmCancel"
                  >
                    <!-- Pass down templates provided by the caller -->
                    <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
                      <slot :name="slot" v-bind="scope" />
                    </template>
                    <div class="controls-steps">
                      <button
                        v-if="canYaml && (_selectedSubtype || !subtypes.length) && canEditYaml"
                        type="button"
                        class="btn role-secondary"
                        @click="showPreviewYaml"
                      >
                        <t k="cruResource.previewYaml" />
                      </button>
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
                  </CruResourceFooter>
                </slot>
              </template>
            </Wizard>
          </template>
        </div>
      </template>
      <!------ SINGLE PROCESS ------>
      <template v-else-if="showAsForm">
        <div
          v-if="_selectedSubtype || !subtypes.length"
          class="resource-container cru__content"
        >
          <slot />
        </div>
        <slot v-if="!isView" name="form-footer">
          <CruResourceFooter
            class="cru__footer"
            :mode="mode"
            :is-form="showAsForm"
            :show-cancel="showCancel"
            @cancel-confirmed="confirmCancel"
          >
            <!-- Pass down templates provided by the caller -->
            <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
              <slot :name="slot" v-bind="scope" />
            </template>

            <template #default>
              <button
                v-if="canYaml && (_selectedSubtype || !subtypes.length) && canEditYaml"
                type="button"
                class="btn role-secondary"
                @click="showPreviewYaml"
              >
                <t k="cruResource.previewYaml" />
              </button>
              <AsyncButton
                v-if="!showSubtypeSelection"
                ref="save"
                :disabled="!canSave"
                :mode="finishButtonMode || mode"
                @click="$emit('finish', $event)"
              />
            </template>
          </CruResourceFooter>
        </slot>
      </template>
      <!------ YAML ------>
      <section
        v-else
        class="cru-resource-yaml-container cru__content"
      >
        <ResourceYaml
          ref="resourceyaml"
          :value="resource"
          :mode="mode"
          :initial-yaml-for-diff="initialYaml"
          :yaml="resourceYaml"
          :offer-preview="isEdit"
          :done-route="doneRoute"
          :done-override="resource.doneOverride"
          :errors="errors"
          :apply-hooks="applyHooks"
          @error="e=>$emit('error', e)"
        >
          <template #yamlFooter="{yamlSave, showPreview, yamlPreview, yamlUnpreview}">
            <slot name="cru-yaml-footer">
              <CruResourceFooter
                class="cru__footer"
                :done-route="doneRoute"
                :mode="mode"
                :is-form="showAsForm"
                @cancel-confirmed="confirmCancel"
              >
                <template #default="{checkCancel}">
                  <div class="controls-middle">
                    <button
                      v-if="showPreview"
                      type="button"
                      class="btn role-secondary"
                      @click="yamlUnpreview"
                    >
                      <t k="resourceYaml.buttons.continue" />
                    </button>
                    <button
                      v-if="!showPreview && isEdit"
                      :disabled="!canDiff"
                      type="button"
                      class="btn role-secondary"
                      @click="yamlPreview"
                    >
                      <t k="resourceYaml.buttons.diff" />
                    </button>
                  </div>
                  <div v-if="_selectedSubtype || !subtypes.length" class="controls-right">
                    <button type="button" class="btn role-secondary" @click="checkCancel(false)">
                      <t k="cruResource.backToForm" />
                    </button>
                    <AsyncButton
                      v-if="!showSubtypeSelection"
                      :disabled="!canSave"
                      :action-label="isEdit ? t('generic.save') : t('generic.create')"
                      @click="cb=>yamlSave(cb)"
                    />
                  </div>
                </template>
              </CruResourceFooter>
            </slot>
          </template>
        </ResourceYaml>
      </section>
    </form>
  </section>
</template>

<style lang='scss' scoped>
.cru-resource-yaml-container {
  .resource-yaml {
    .yaml-editor {
      min-height: 100px;
    }
  }
}
.create-resource-container {
  .subtype-banner {
    .round-image {
      background-color: var(--primary);
    }
  }
}

$logo: 60px;
$logo-space: 100px;

.title {
  margin-top: 20px;

  &.with-description {
    margin-top: 0;
  }
}

.subtype-container {
  position: relative;
  display: flex;
  height: 100%;
};

.subtype-body {
  flex: 1;
  padding: 10px;
}

.subtype-logo {
  align-items: center;
  display: flex;
  justify-content: center;
  min-width: $logo-space;
  min-height: $logo-space;
  overflow: hidden;
  background-color: var(--box-bg);

  img {
    width: $logo - 4px;
    height: $logo - 4px;
    object-fit: contain;
    position: relative;
    top: 2px;
  }
}

.cru {
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  &__form {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  &__content {
    flex-grow: 1;
    &-wizard {
      display: flex;
    }
  }

  &__footer {
    right: 0;
    position: sticky;
    bottom: 0;
    background-color: var(--header-bg);
    border-top: var(--header-border-size) solid var(--header-border);

    // Overrides outlet padding
    margin-left: -$space-m;
    margin-right: -$space-m;
    margin-bottom: -$space-m;
    padding: $space-s $space-m;
  }

  &__errors {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--header-bg);
    margin: 10px 0;
  }
}

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
