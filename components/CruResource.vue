<script>
import { createYaml } from '@/utils/create-yaml';
import { SCHEMA } from '@/config/types';
import ResourceYaml from '@/components/ResourceYaml';

export default {
  components: { ResourceYaml },
  props:      {
    doneRoute: {
      type:     String,
      required: true
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

    canCreate: {
      type:    Boolean,
      default: false
    }
  },
  data() {
    return {
      isCancelModal: false,
      showAsForm:    true,
      resourceYaml:   '',
    };
  },
  methods: {
    checkCancel(isCancel) {
      if (isCancel) {
        // this.$modal.show('cancel') pass translation options
        this.isCancelModal = true;
      }

      this.$modal.show('cancel-modal');
    },
    confirmCancel(isCancel) {
      if (isCancel) {
        this.$router.replace({
          name:   this.doneRoute,
          params: { resource: this.resource.type }
        });
      } else {
        this.isCancelModal = false;
        this.resourceYaml = null;
        this.showAsForm = true;
      }
    },
    showPreviewYaml() {
      const schemas = this.$store.getters['cluster/all'](SCHEMA);
      const { resource } = this;

      const resourceYaml = createYaml(schemas, resource.type, resource);

      this.resourceYaml = resourceYaml;
      this.showAsForm = false;
    }
  }
};
</script>

<template>
  <form
    v-if="showAsForm"
    class="create-resource-container"
  >
    <div v-if="subtypes.length && !selectedSubtype" class="subtypes-container">
      <slot name="subtypes">
        <div
          v-for="subtype in subtypes"
          :key="subtype.id"
          class="subtype-banner"
          :class="{ selected: subtype.id === selectedSubtype }"
          @click="$emit('selectType', subtype.id)"
        >
          <slot name="subtype-logo">
            <div class="subtype-logo round-image">
              <img
                v-if="subtype.bannerImage"
                src="subtype.bannerImage"
                alt="${ resource.type }: ${ subtype.label }"
              />
              <div v-else-if="subtype.bannerAbbrv" class="banner-abbrv">
                <span
                  v-if="$store.getters['i18n/exists'](subtype.bannerAbbrv)"
                >{{ t(subtype.bannerAbbrv) }}</span>
                <span v-else>{{ subtype.bannerAbbrv.slice(0, 1).toUpperCase() }}</span>
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
                  v-html="t(subtype.description)"
                ></span>
                <span v-else>{{ subtype.description }}</span>
              </div>
            </div>
          </slot>
        </div>
      </slot>
    </div>

    <div v-if="selectedSubtype || !subtypes.length" class="resource-container">
      <slot name="define" />
    </div>

    <div class="controls-row">
      <slot name="form-footer">
        <button type="button" class="btn role-secondary" @click="$emit('cancel')">
          <t k="generic.cancel" />
        </button>

        <div>
          <button v-if="selectedSubtype || !subtypes.length" type="button" class="btn role-secondary" @click="showPreviewYaml">
            Preview Yaml
          </button>
          <button
            :disabled="!canCreate"
            type="button"
            class="btn role-primary"
            @click="$emit('finish')"
          >
            <t k="generic.create" />
          </button>
        </div>
      </slot>
    </div>
  </form>

  <section v-else>
    <ResourceYaml
      ref="resourceyaml"
      :value="resource"
      :mode="mode"
      :yaml="resourceYaml"
      :offer-preview="false"
      :done-route="doneRoute"
      :done-override="resource.doneOverride"
    >
      <template #yamlFooter="{yamlSave}">
        <div class="controls-row">
          <slot name="cru-yaml-footer">
            <button type="button" class="btn role-secondary" @click="checkCancel(true)">
              <t k="generic.cancel" />
            </button>

            <div v-if="selectedSubtype || !subtypes.length">
              <button type="button" class="btn role-secondary" @click="checkCancel(false)">
                <t k="generic.back" />
              </button>
              <button
                type="button"
                class="btn role-primary"
                @click="yamlSave"
              >
                <t k="generic.create" />
              </button>
            </div>
          </slot>
        </div>
      </template>
    </ResourceYaml>

    <modal
      class="confirm-modal"
      name="cancel-modal"
      :width="350"
      height="auto"
      styles="background-color: var(--nav-bg); border-radius: var(--border-radius); overflow: scroll; max-height: 100vh;"
    >
      <div class="header">
        <h4 class="text-default-text">
          Go Back To Form
        </h4>
      </div>
      <div class="body">
        <p v-if="isCancelModal">
          Cancelling will destroy your changes.
        </p>
        <p v-else>
          Going back will destroy your changes.
        </p>
      </div>
      <div class="footer">
        <button type="button" class="btn role-secondary" @click="$modal.hide('cancel-modal')">
          No, Review Yaml
        </button>
        <button
          type="button"
          class="btn role-primary"
          @click="confirmCancel(isCancelModal)"
        >
          <span v-if="isCancelModal">
            Yes, Cancel.
          </span>
          <span v-else>
            Yes, go back.
          </span>
        </button>
      </div>
    </modal>
  </section>
</template>

<style lang='scss'>
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

.controls-row {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
}
</style>
