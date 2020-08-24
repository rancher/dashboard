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
import { _EDIT, _VIEW } from '@/config/query-params';

export default {
  components: {
    AsyncButton,
    Banner,
    CruResourceFooter,
    ResourceYaml,
  },

  props: {
    doneRoute: {
      type:     String,
      required: true
    },

    cancelEvent: {
      type:    Boolean,
      default: false,
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
      default: null
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

    canYaml: {
      type:    Boolean,
      default: true,
    },

    // Override the set of labels shown on the button from teh default save/create.
    finishButtonMode: {
      type:    String,
      default: null,
    }
  },

  data() {
    return {
      showAsForm:    true,
      resourceYaml:  '',
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
    isView() {
      return this.mode === _VIEW;
    },

    isEdit() {
      return this.mode === _EDIT;
    },

    showSubtypeSelection() {
      const { selectedSubtype, subtypes } = this;

      if (isEmpty(subtypes)) {
        return false;
      }

      if (!selectedSubtype) {
        return true;
      }

      return false;
    },
    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    stringify,

    confirmCancel(isCancelNotBack = true) {
      if (isCancelNotBack) {
        this.emitOrRoute();
      } else if (!this.showAsForm) {
        this.resourceYaml = null;
        this.showAsForm = true;
      }
    },

    emitOrRoute() {
      if ( this.cancelEvent ) {
        this.$emit('cancel');
      } else {
        this.$router.replace({
          name:   this.doneRoute,
          params: { resource: this.resource.type }
        });
      }
    },

    async showPreviewYaml() {
      await this.$emit('apply-hooks');

      const schemas = this.$store.getters['cluster/all'](SCHEMA);
      const { resource } = this;
      const clonedResource = clone(resource);
      const resourceYaml = createYaml(schemas, resource.type, clonedResource);

      this.resourceYaml = resourceYaml;
      this.showAsForm = false;
    },
  }
};
</script>

<template>
  <section>
    <form class="create-resource-container">
      <div
        v-if="showSubtypeSelection"
        class="subtypes-container"
      >
        <slot name="subtypes">
          <div
            v-for="subtype in subtypes"
            :key="subtype.id"
            class="subtype-banner"
            :class="{ selected: subtype.id === selectedSubtype }"
            @click="$emit('select-type', subtype.id)"
          >
            <slot name="subtype-logo">
              <div class="subtype-logo round-image">
                <img
                  v-if="subtype.bannerImage"
                  src="subtype.bannerImage"
                  alt="${ resource.type }: ${ subtype.label }"
                />
                <div
                  v-else-if="subtype.bannerAbbrv"
                  class="banner-abbrv"
                >
                  <span v-if="$store.getters['i18n/exists'](subtype.bannerAbbrv)">{{ t(subtype.bannerAbbrv) }}</span>
                  <span v-else>{{ subtype.bannerAbbrv }}</span>
                </div>
                <div v-else>
                  {{ subtype.id.slice(0, 1).toUpperCase() }}
                </div>
              </div>
            </slot>
            <slot name="subtype-content">
              <div class="subtype-content">
                <div class="title">
                  <h5>
                    <span
                      v-if="$store.getters['i18n/exists'](subtype.label)"
                      v-html="t(subtype.label)"
                    ></span>
                    <span v-else>{{ subtype.label }}</span>
                  </h5>
                </div>
                <div class="description">
                  <span
                    v-if="$store.getters['i18n/exists'](subtype.description)"
                    v-html="t(subtype.description, {}, true)"
                  ></span>
                  <span v-else>{{ subtype.description }}</span>
                </div>
              </div>
            </slot>
          </div>
        </slot>
      </div>
      <template v-if="showAsForm">
        <div
          v-if="selectedSubtype || !subtypes.length"
          class="resource-container"
        >
          <slot name="define" />
        </div>
        <div class="controls-row">
          <slot name="form-footer">
            <CruResourceFooter
              :done-route="doneRoute"
              :mode="mode"
              :is-form="showAsForm"
              @cancel-confirmed="confirmCancel"
            >
              <template #default>
                <div v-if="!isView">
                  <button
                    v-if="!isEdit && canYaml && (selectedSubtype || !subtypes.length)"
                    type="button"
                    class="btn role-secondary"
                    @click="showPreviewYaml"
                  >
                    <t k="cruResource.previewYaml" />
                  </button>
                  <AsyncButton
                    v-if="!showSubtypeSelection"
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
          :yaml="resourceYaml"
          :offer-preview="isEdit"
          :done-route="doneRoute"
          :done-override="resource.doneOverride"
          @error="e=>$emit('error', e)"
        >
          <template #yamlFooter="{currentYaml, yamlSave, showPreview, yamlPreview, yamlUnpreview}">
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
                        :disabled="resourceYaml === currentYaml"
                        type="button"
                        class="btn role-secondary"
                        @click="yamlPreview"
                      >
                        <t k="resourceYaml.buttons.diff" />
                      </button>
                    </div>
                    <div v-if="selectedSubtype || !subtypes.length" class="controls-right">
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

<style lang='scss'>
.cru-resource-yaml-container {
  .resource-yaml {
    .yaml-editor {
      min-height: 400px;
    }
  }
}
.subtypes-container {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.subtype-banner {
  border-left: 5px solid var(--primary);
  border-radius: var(--border-radius);
  display: flex;
  flex-basis: 40%;
  margin: 10px;
  min-height: 100px;
  padding: 10px;
  box-shadow: 0 0 20px var(--shadow);

  &.selected {
    background-color: var(--accent-btn);
  }

  &.top {
    background-image: linear-gradient(
      -90deg,
      var(--body-bg),
      var(--accent-btn)
    );

    H2 {
      margin: 0px;
    }

    .title {
      align-items: center;
      border-right: 1px solid var(--primary);
      display: flex;
      flex-basis: 10%;
      justify-content: space-evenly;
      margin-right: 20px;
      padding-right: 20px;
    }

    .description {
      color: var(--input-label);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  }

  .description {
    color: var(--input-label);
  }

  &:not(.top) {
    align-items: center;
    box-shadow: 0px 0px 12px 3px var(--box-bg);
    flex-direction: row;
    justify-content: start;
    &:hover {
      cursor: pointer;
      box-shadow: 0px 0px 1px var(--outline-width) var(--outline);
    }
  }

  .round-image {
    background-color: var(--primary);
    border-radius: 50%;
    height: 50px;
    margin: 10px;
    min-width: 50px;
    overflow: hidden;
  }

  .banner-abbrv {
    align-items: center;
    background-color: var(--primary);
    color: white;
    display: flex;
    font-size: 2.5em;
    height: 100%;
    justify-content: center;
    width: 100%;
  }
}
</style>
