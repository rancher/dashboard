<script>
import isEmpty from 'lodash/isEmpty';
import { createYaml } from '@shell/utils/create-yaml';
import { clone, get } from '@shell/utils/object';
import { SCHEMA, NAMESPACE } from '@shell/config/types';
import ResourceYaml from '@shell/components/ResourceYaml';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { mapGetters } from 'vuex';
import { stringify, exceptionToErrorsArray } from '@shell/utils/error';
import CruResourceFooter from '@shell/components/CruResourceFooter';

import {
  _EDIT, _VIEW, AS, _YAML, _UNFLAG, SUB_TYPE
} from '@shell/config/query-params';

import { BEFORE_SAVE_HOOKS } from '@shell/mixins/child-hook';
import Wizard from '@shell/components/Wizard';

export default {

  name: 'CruResource',

  components: {
    AsyncButton,
    Banner,
    CruResourceFooter,
    ResourceYaml,
    Wizard
  },

  props: {
    doneRoute: {
      type:    [String, Object],
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

    // The set of labels to display for the finish AsyncButton
    finishMode: {
      type:    String,
      default: 'finish'
    },

    // Used to prevent cancel and create buttons from moving
    // as form validation errors appear and disappear.
    minHeight: {
      type:    String,
      default: ''
    },

    // Location of `namespace` value within the resource. Used when creating the namespace
    namespaceKey: {
      type:    String,
      default: 'metadata.namespace'
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'form'
    }
  },

  data(props) {
    const yaml = this.createResourceYaml();

    this.$on('createNamespace', (e) => {
      // When createNamespace is set to true,
      // the UI will attempt to create a new namespace
      // before saving the resource.
      this.createNamespace = e;
    });

    return {
      isCancelModal:   false,
      createNamespace: false,
      showAsForm:      this.$route.query[AS] !== _YAML,
      resourceYaml:    yaml,
      initialYaml:     yaml,
      abbrSizes:       {
        3: '24px',
        4: '18px',
        5: '16px',
        6: '14px'
      }
    };
  },

  computed: {
    canSave() {
      const { validationPassed, showAsForm, steps } = this;

      if (showAsForm && steps?.length) {
        return validationPassed && this.steps.every(step => step.ready);
      }

      // Don't apply validation rules if the form is not shown.
      if (!this.showAsForm) {
        return true;
      }

      // Disable the save button if there are form validation
      // errors while the user is typing.
      return this.validationPassed;
    },

    canDiff() {
      return this.initialYaml !== this.resourceYaml;
    },

    canEditYaml() {
      const inStore = this.$store.getters['currentStore'](this.resource);
      const schema = this.$store.getters[`${ inStore }/schemaFor`](this.resource.type);

      return !(schema?.resourceMethods?.includes('blocked-PUT'));
    },

    showYaml() {
      return this.canYaml && (this._selectedSubtype || !this.subtypes.length) && this.canEditYaml && this.mode !== _VIEW;
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

    ...mapGetters({ t: 'i18n/t' }),

    /**
     * Prevent issues for malformed types injection
     */
    hasErrors() {
      return this.errors?.length && Array.isArray(this.errors);
    },
  },

  created() {
    if ( this._selectedSubtype ) {
      this.$emit('select-type', this._selectedSubtype);
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

    async clickSave(buttonDone) {
      try {
        await this.createNamespaceIfNeeded();

        // If the attempt to create the new namespace
        // is successful, save the resource.
        this.$emit('finish', buttonDone);
      } catch (err) {
        // After the attempt to create the namespace,
        // show any applicable errors if the namespace is
        // invalid.
        this.$emit('error', exceptionToErrorsArray(err.message));
        buttonDone(false);
      }
    },

    save() {
      this.$refs.save.clicked();
    },

    async createNamespaceIfNeeded() {
      const inStore = this.$store.getters['currentStore'](this.resource);
      const newNamespaceName = get(this.resource, this.namespaceKey);
      let namespaceAlreadyExists = false;

      try {
        // This is in a try-catch block because the call to fetch
        // a namespace throws an error if the namespace is not found.
        namespaceAlreadyExists = !!(await this.$store.dispatch(`${ inStore }/find`, { type: NAMESPACE, id: newNamespaceName }));
      } catch {}

      if (this.createNamespace && !namespaceAlreadyExists) {
        try {
          const newNamespace = await this.$store.dispatch(`${ inStore }/createNamespace`, { name: newNamespaceName }, { root: true });

          newNamespace.applyDefaults();
          await newNamespace.save();
        } catch (e) {
          // this.errors = exceptionToErrorsArray(e);
          this.$emit('error', exceptionToErrorsArray(e));
          throw new Error(`Could not create the new namespace. ${ e.message }`);
        }
      }
    }
  }
};
</script>

<template>
  <section class="cru">
    <slot name="noticeBanner" />
    <form
      :is="(isView? 'div' : 'form')"
      class="create-resource-container cru__form"
      @submit.prevent
    >
      <div
        v-if="hasErrors"
        id="cru-errors"
        class="cru__errors"
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
        class="subtypes-container cru__content"
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
          <Wizard
            v-if="resource"
            ref="Wizard"
            :header-mode="mode"
            :steps="steps"
            :errors="errors"
            :finish-mode="finishMode"
            class="wizard"
            @error="e=>errors = e"
          >
            <template #stepContainer="{activeStep}" class="step-container">
              <template v-for="step in steps">
                <div v-if="step.name === activeStep.name || step.hidden" :key="step.name" class="step-container__step" :class="{'hide': step.name !== activeStep.name && step.hidden}">
                  <slot :step="step" :name="step.name" />
                </div>
              </template>
            </template>
            <template #controlsContainer="{showPrevious, next, back, activeStep, canNext, activeStepIndex, visibleSteps}">
              <template name="form-footer">
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
                      v-if="showYaml"
                      type="button"
                      class="btn role-secondary"
                      @click="showPreviewYaml"
                    >
                      <t k="cruResource.previewYaml" />
                    </button>
                    <template v-if="showPrevious" name="back">
                      <button type="button" class="btn role-secondary" @click="back()">
                        <t k="wizard.previous" />
                      </button>
                    </template>
                    <template v-if="activeStepIndex === visibleSteps.length-1" name="finish">
                      <AsyncButton
                        v-if="!showSubtypeSelection && !isView"
                        ref="save"
                        :disabled="!activeStep.ready"
                        :mode="finishButtonMode || mode"
                        @click="$emit('finish', $event)"
                      />
                    </template>
                    <template v-else name="next">
                      <button :disabled="!canNext" type="button" class="btn role-primary" @click="next()">
                        <t k="wizard.next" />
                      </button>
                    </template>
                  </div>
                </CruResourceFooter>
              </template>
            </template>
          </Wizard>
        </div>
      </template>
      <!------ SINGLE PROCESS ------>
      <template v-else-if="showAsForm">
        <div
          v-if="_selectedSubtype || !subtypes.length"
          class="resource-container cru__content"
          :style="[minHeight ? { 'min-height': minHeight } : {}]"
        >
          <slot />
        </div>
        <slot name="form-footer">
          <CruResourceFooter
            class="cru__footer"
            :mode="mode"
            :is-form="showAsForm"
            :show-cancel="showCancel"
            :component-testid="componentTestid"
            @cancel-confirmed="confirmCancel"
          >
            <!-- Pass down templates provided by the caller -->
            <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
              <slot :name="slot" v-bind="scope" />
            </template>

            <template #default>
              <div v-if="!isView">
                <button
                  v-if="showYaml"
                  :data-testid="componentTestid + '-yaml'"
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
                  :data-testid="componentTestid + '-save'"
                  @click="clickSave($event)"
                />
              </div>
            </template>
          </CruResourceFooter>
        </slot>
      </template>
      <!------ YAML ------>
      <section
        v-else
        class="cru-resource-yaml-container resource-container cru__content"
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
          class="resource-container cru__content"
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
                      :data-testid="componentTestid + '-yaml-yaml'"
                      @click="yamlUnpreview"
                    >
                      <t k="resourceYaml.buttons.continue" />
                    </button>
                    <button
                      v-if="!showPreview && isEdit"
                      :data-testid="componentTestid + '-yaml-yaml-preview'"
                      :disabled="!canDiff"
                      type="button"
                      class="btn role-secondary"
                      @click="yamlPreview"
                    >
                      <t k="resourceYaml.buttons.diff" />
                    </button>
                  </div>
                  <div v-if="_selectedSubtype || !subtypes.length" class="controls-right">
                    <button
                      :data-testid="componentTestid + '-yaml-cancel'"
                      type="button"
                      class="btn role-secondary"
                      @click="checkCancel(false)"
                    >
                      <t k="cruResource.backToForm" />
                    </button>
                    <AsyncButton
                      v-if="!showSubtypeSelection"
                      :data-testid="componentTestid + '-yaml-save'"
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

  .resource-container {
    display: flex; // Ensures content grows in child CruResources
    flex-direction: column;
  }

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

form.create-resource-container .cru {
  &__footer {
    // Only show border when the mode is not view
    border-top: var(--header-border-size) solid var(--header-border);
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

</style>
