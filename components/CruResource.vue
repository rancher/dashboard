<script>
import { SCHEMA } from '@/config/types';

export default {
  props: {
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
    return {};
  },
  methods: {
    showPreviewYaml() {
      // const schemas = this.$store.getters['cluster/all'](SCHEMA);
      // const { resource } = this;

      // const resourceYaml = createYaml(schemas, resource.type, resource);
    }
  }
};
</script>

<template>
  <form class="create-resource-container">
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
      <slot name="footer">
        <slot name="left-controls">
          <button type="button" class="btn role-secondary" @click="$emit('cancel')">
            <t k="generic.cancel" />
          </button>
        </slot>

        <div>
          <slot v-if="selectedSubtype || !subtypes.length" name="right-controls">
            <button type="button" class="btn role-secondary" @click="showPreviewYaml">
              <t k="wizard.back" />
            </button>
            <button
              :disabled="!canCreate"
              type="button"
              class="btn role-primary"
              @click="$emit('finish')"
            >
              <t k="generic.create" />
            </button>
          </slot>
        </div>
      </slot>
    </div>
  </form>
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
