<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import Principal from '@/components/auth/Principal';
import debounce from 'lodash/debounce';
import { _EDIT } from '@/config/query-params';
import { NORMAN } from '@/config/types';

export default {
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
      default() {
        return ['group'];
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
      principals: null,
      searchStr:  '',
      options:    [],
      newValue:   '',
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
      }).map(x => x.id);

      return out;
    },

    label() {
      return this.retainSelection ? this.t('cluster.memberRoles.addClusterMember.labelSelect') : this.t('cluster.memberRoles.addClusterMember.labelAdd');
    }
  },

  created() {
    this.debouncedSearch = debounce(this.search, 200);
  },

  methods: {
    add(id) {
      this.$emit('add', id);
      if (!this.retainSelection) {
        this.newValue = '';
      }
    },

    onSearch(str, loading, vm) {
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
          this.options = res.map(x => x.id);
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
    v-model="newValue"
    v-focus
    :mode="mode"
    :label="label"
    :placeholder="t('cluster.memberRoles.addClusterMember.placeholder')"
    :options="options"
    :searchable="true"
    :filterable="false"
    class="select-principal"
    :class="{'retain-selection': retainSelection}"
    @input="add"
    @search="onSearch"
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

    <template v-if="!searchStr && options.length" #list-header>
      <li class="pl-10 text-muted">
        Your Groups:
      </li>
    </template>

    <template #option="option">
      <Principal :key="option.label" :value="option.label" :use-muted="false" />
    </template>

    <template v-if="retainSelection" #selected-option="option">
      <Principal :key="option.label" :value="option.label" :use-muted="false" class="mt-10 mb-10" />
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
