<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Principal from '@shell/components/auth/Principal';
import debounce from 'lodash/debounce';
import { _EDIT } from '@shell/config/query-params';
import { NORMAN } from '@shell/config/types';

export default {
  emits: ['add'],

  components: {
    LabeledSelect,
    Principal,
  },

  props: {
    mode: {
      type:    String,
      default: _EDIT,
    },

    showMyGroupTypes: {
      type: Array,
      default(props) {
        return ['group', 'user'];
      },
    },

    searchGroupTypes: {
      type:    String,
      default: null,
      validator(val) {
        return val === null || val === 'group' || val === 'user';
      }
    },

    retainSelection: {
      type:    Boolean,
      default: false
    },

    project: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    this.principals = await this.$store.dispatch('rancher/findAll', {
      type: NORMAN.PRINCIPAL,
      opt:  { url: '/v3/principals' }
    });

    this.options = this.suggested;
  },

  data() {
    return {
      principals:     null,
      searchStr:      '',
      options:        [],
      newValue:       '',
      tooltipContent: null,
    };
  },

  computed: {
    suggested() {
      const out = this.principals.filter((x) => {
        if ( !x.memberOf ) {
          return false;
        }

        if ( !this.showMyGroupTypes.includes(x.principalType) ) {
          return false;
        }

        return true;
      })
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((x) => x.id);

      return out;
    },

    label() {
      return this.retainSelection ? this.t('cluster.memberRoles.addClusterMember.labelSelect') : this.t('cluster.memberRoles.addClusterMember.labelAdd');
    },

    placeholder() {
      return this.project ? this.t('projectMembers.projectPermissions.searchForMember') : this.t('cluster.memberRoles.addClusterMember.placeholder');
    }
  },

  created() {
    this.debouncedSearch = debounce(this.search, 200);
  },

  methods: {
    setTooltipContent() {
      if (!this.retainSelection) {
        return;
      }
      if (this.principals) {
        const selected = this.principals.find((p) => p.id === this.newValue);

        this.tooltipContent = selected?.name;
      } else {
        this.tooltipContent = null;
      }
    },
    resetTooltipContent() {
      if (!this.retainSelection) {
        return;
      }
      this.tooltipContent = null;
    },
    add(id) {
      if (!id) {
        // Ignore attempts to select an invalid principal
        return;
      }

      this.$emit('add', id);
      if (!this.retainSelection) {
        this.newValue = '';
      }
    },

    onSearch(str, loading) {
      str = (str || '').trim();

      this.searchStr = str;

      if ( str ) {
        loading(true);
        this.debouncedSearch(str, loading);
      } else {
        this.search(null, loading);
      }
    },

    async search(str, loading) {
      if ( !str ) {
        this.options = this.suggested.slice();
        loading(false);

        return;
      }

      try {
        const res = await this.$store.dispatch('rancher/collectionAction', {
          type:       NORMAN.PRINCIPAL,
          actionName: 'search',
          opt:        { url: '/v3/principals?action=search' },
          body:       {
            name:          str,
            principalType: this.searchGroupTypes
          }
        });

        if ( this.searchStr === str ) {
          // If not, they've already typed something else
          this.options = res.map((x) => x.id);
        }
      } catch (e) {
        this.options = [];
      } finally {
        loading(false);
      }
    }
  }
};
</script>

<template>
  <LabeledSelect
    ref="labeled-select"
    v-model:value="newValue"
    v-clean-tooltip="{
      content: tooltipContent,
      placement: 'bottom',
      popperClass: ['select-principal-tooltip']
    }"
    :mode="mode"
    :label="label"
    :placeholder="placeholder"
    :options="options"
    :searchable="true"
    :filterable="false"
    class="select-principal"
    :class="{'retain-selection': retainSelection}"
    @update:value="add"
    @search="onSearch"
    @on-open="resetTooltipContent()"
    @on-close="setTooltipContent()"
  >
    <template v-slot:no-options="{ searching }">
      <template v-if="searching">
        <span class="search-slot">
          {{ t('cluster.memberRoles.addClusterMember.noResults') }}
        </span>
      </template>
      <div v-else>
        <em class="search-slot">
          {{ t('cluster.memberRoles.addClusterMember.searchPlaceholder') }}
        </em>
      </div>
    </template>

    <template #option="option">
      <Principal
        :value="option.label"
        :use-muted="false"
      />
    </template>

    <template
      v-if="retainSelection"
      #selected-option="option"
    >
      <Principal
        :value="option.label"
        :use-muted="false"
        class="mt-10 mb-10"
      />
    </template>
  </LabeledSelect>
</template>

<style lang="scss" scoped>
  .search-slot{
    color: var(--body-text);
  }

  .select-principal {
    &.retain-selection {
      min-height: 91px;
      &.focused {
        .principal {
          display: none;
        }
      }
    }
  }
</style>
<style lang="scss">
  .vs__dropdown-menu {
    width: 0%;
    * {
      overflow-x: hidden;
      text-overflow: ellipsis;
    }
  }

  .select-principal-tooltip {
    max-width: 580px;
    word-wrap: break-word;
  }
</style>
