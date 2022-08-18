<script>
import { _CREATE, CATEGORY, SEARCH_QUERY } from '@shell/config/query-params';
import { CATEGORY_MAP, RESOURCE_MAP } from '../../plugins/kubewarden/policy-class';
import { ensureRegex } from '@shell/utils/string';
import { sortBy } from '@shell/utils/sort';

import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    // packages
    value: {
      type:    Array,
      default: () => {
        return [];
      }
    }
  },

  components: { LabeledSelect },

  fetch() {
    const query = this.$route.query;

    this.category = query[CATEGORY] || '';
    this.searchQuery = query[SEARCH_QUERY] || '';
  },

  data() {
    return {
      category:          null,
      keywords:          [],
      searchQuery:       null,

      CATEGORY_MAP,
      RESOURCE_MAP
    };
  },

  computed: {
    filteredSubtypes() {
      const subtypes = ( this.value || [] );

      const out = subtypes.filter((subtype) => {
        if ( this.category && !subtype.resourceType.includes(this.category) ) {
          return false;
        }

        if ( this.searchQuery ) {
          const searchTokens = this.searchQuery.split(/\s*[, ]\s*/).map(x => ensureRegex(x, false));

          for ( const token of searchTokens ) {
            if ( !subtype.label.match(token) && (subtype.description && !subtype.description.match(token)) ) {
              return false;
            }
          }
        }

        /*
          TODO: will not work with artifacthub until 502 is resolved
        */
        if ( this.keywords ) {
          for ( const selected of this.keywords ) {
            if ( !subtype.keywords.includes(selected) ) {
              return false;
            }
          }
        }

        return true;
      });

      return sortBy(out, ['category', 'label', 'description']);
    },

    /*
      TODO: will not work with artifacthub until 502 is resolved
    */
    keywordOptions() {
      const flattened = this.value.flatMap((subtype) => {
        return subtype.keywords;
      });

      return [...new Set(flattened)];
    },
  },

  methods: {
    refresh() {
      this.category = null;
      this.keywords = [];
      this.searchQuery = null;
    },

    resourceColor(type) {
      return this.RESOURCE_MAP[type.toLowerCase()];
    }
  }
};
</script>

<template>
  <form
    class="create-resource-container step__policies"
  >
    <div class="filter">
      <LabeledSelect
        v-model="keywords"
        :clearable="true"
        :taggable="true"
        :mode="mode"
        :multiple="true"
        class="filter__keywords"
        label="Filter by Keyword"
        :options="keywordOptions"
      />

      <LabeledSelect
        v-model="category"
        :clearable="true"
        :searchable="false"
        :options="CATEGORY_MAP"
        placement="bottom"
        class="filter__category"
        label="Filter by Resource Type"
        :reduce="opt => opt.value"
      >
        <template #option="opt">
          {{ opt.label }}
        </template>
      </LabeledSelect>

      <input
        ref="searchQuery"
        v-model="searchQuery"
        type="search"
        class="input-sm filter__search"
        :placeholder="t('catalog.charts.search')"
      >
      <button
        ref="btn"
        class="btn, btn-sm, role-primary"
        type="button"
        @click="refresh"
      >
        {{ t('kubewarden.utils.resetFilter') }}
      </button>
    </div>

    <div class="grid">
      <slot name="customSubtype"></slot>

      <div
        v-for="subtype in filteredSubtypes"
        :key="subtype.package_id"
        class="subtype"
        @click="$emit('selectType', subtype.name)"
      >
        <div class="subtype__metadata">
          <div class="subtype__badge" :style="{ 'background-color': resourceColor(subtype.data['kubewarden/resources']) }">
            <label>{{ subtype.data['kubewarden/resources'] === '*' ? 'Global' : subtype.data['kubewarden/resources'] }}</label>
          </div>

          <div v-if="subtype.signed" class="subtype__signed">
            <i v-tooltip="t('kubewarden.policyCharts.signedPolicy')" class="icon icon-checkmark" />
          </div>

          <div v-if="subtype.data['kubewarden/mutation'] === 'true'" class="subtype__mutation">
            <i v-tooltip="t('kubewarden.policyCharts.mutationPolicy')" class="icon icon-edit" />
          </div>

          <div v-if="subtype.data['kubewarden/contextAware'] === 'true'" class="subtype__aware">
            <i v-tooltip="t('kubewarden.policyCharts.contextAware')" class="icon icon-show" />
          </div>

          <h4 class="subtype__label">
            {{ subtype.display_name }}
          </h4>

          <div v-if="subtype.description" class="subtype__description mb-20">
            {{ subtype.description }}
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped>
$padding: 5px;
$height: 110px;
$margin: 10px;

.step {
  &__policies {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-x: hidden;

    .spacer {
      line-height: 2;
    }
  }
}

.filter {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-self: flex-end;

  & > * {
    margin: $margin;
  }
  & > *:first-child {
    margin-left: 0;
  }
  & > *:last-child {
    margin-right: 0;
  }

  &__category {
    min-width: 200px;
    height: unset;
  }
}

@media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
  .filter {
    width: 100%;
  }
}
@media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
  .filter {
    width: 75%;
  }
}

.grid {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin: 0 -1*$margin;

  @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
    .subtype {
      width: 100%;
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
    .subtype {
      width: calc(50% - 2 * #{$margin});
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
    .subtype {
      width: calc(33.33333% - 2 * #{$margin});
    }
  }
  @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
    .subtype {
      width: calc(25% - 2 * #{$margin});
    }
  }

  .disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.subtype {
  &__signed, &__mutation, &__aware {
    position: absolute;
    bottom: 5px;
    padding: 0px 5px;
    border: 1px solid var(--border);
  }

  &__signed {
    left: 10px;
  }

  &__mutation {
    right: 10px;
  }

  &__aware {
    right: 30px;
  }
}
</style>
