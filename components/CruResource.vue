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

export default {
  components: {
    AsyncButton,
    Banner,
    CruResourceFooter,
    ResourceYaml,
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

    // Used to prevent cancel and create buttons from moving
    // as form validation errors appear and disappear.
    minHeight: {
      type:    String,
      default: ''
    }
  },

  data() {
    const yaml = this.createResourceYaml();

    return {
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
    ...mapGetters({ t: 'i18n/t' })
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
    }
  }
};
</script>

<template>
  <section>
    <form
      :is="(isView? 'div' : 'form')"
      class="create-resource-container"
    >
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

      <template v-if="showAsForm">
        <div
          v-if="_selectedSubtype || !subtypes.length"
          class="resource-container"
          :style="[minHeight ? { 'min-height': minHeight } : {}]"
        >
          <slot />
        </div>
        <div class="controls-row">
          <slot name="form-footer">
            <CruResourceFooter
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
                <div v-if="!isView">
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
                </div>
              </template>
            </CruResourceFooter>
          </slot>
        </div>
      </template>

      <section
        v-else
        class="cru-resource-yaml-container"
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
            <div class="controls-row">
              <slot name="cru-yaml-footer">
                <CruResourceFooter
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
            </div>
          </template>
        </ResourceYaml>
      </section>

      <div
        v-for="(err, idx) in errors"
        :key="idx"
      >
        <Banner
          color="error"
          :label="stringify(err)"
        />
      </div>
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

.title {
  margin-top: 20px;

  &.with-description {
    margin-top: 0;
  }
}

.subtype-container {
  position: relative;
};

.subtype-body {
  margin-left: $logo + 10px;
}

.subtype-logo {
  align-items: center;
  display: flex;
  justify-content: center;
  position: absolute;
  left: 0;
  width: $logo;
  height: $logo;
  border-radius: calc(2 * var(--border-radius));
  overflow: hidden;
  background-color: white;

  > .round-image {
    margin-right: 0;
  };

  img {
    width: $logo - 4px;
    height: $logo - 4px;
    object-fit: contain;
    position: relative;
    top: 2px;
  }
}

</style>
