<script>
import { Banner } from '@components/Banner';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import ResourceTable from '@shell/components/ResourceTable';
import { _EDIT } from '@shell/config/query-params';
import { convert, simplify } from '@shell/utils/selector';
import throttle from 'lodash/throttle';
import { COUNT } from '@shell/config/types';
import { matching } from '@shell/utils/selector-typed';

export default {
  name: 'ResourceSelector',

  components: {
    Banner,
    MatchExpressions,
    ResourceTable,
  },

  props: {
    mode: {
      type:    String,
      default: _EDIT,
    },
    type: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    },
    namespace: {
      type:    String,
      default: '',
    },
  },

  async fetch() {
    this.updateMatchingResources();
  },

  data() {
    const matchingResources = {
      matched: 0,
      matches: [],
      none:    true,
      sample:  null,
      total:   0,
    };

    return {
      matchingResources,
      // allResources:        [],
      // allResourcesInScope: [],
      tableHeaders: this.$store.getters['type-map/headersFor'](
        this.$store.getters['cluster/schemaFor'](this.type)
      ),
      inStore: this.$store.getters['currentProduct'].inStore,
    };
  },

  watch: {
    namespace:                'updateMatchingResources',
    'value.matchLabels':      'updateMatchingResources',
    'value.matchExpressions': 'updateMatchingResources',
  },

  computed: {
    schema() {
      return this.$store.getters['cluster/schemaFor'](this.type);
    },
    /**
     * of type matchExpression aka `KubeLabelSelectorExpression[]`
     */
    selectorExpressions: {
      get() {
        return convert(
          this.value.matchLabels || {},
          this.value.matchExpressions || []
        );
      },
      set(selectorExpressions) {
        const { matchLabels, matchExpressions } = simplify(selectorExpressions);

        this.value['matchLabels'] = matchLabels;
        this.value['matchExpressions'] = matchExpressions;
      }
    },
    allResourcesInScope() {
      const counts = this.$store.getters[`${ this.inStore }/all`](COUNT)?.[0]?.counts || {};

      if (this.namespace) {
        return counts?.[this.type].namespaces[this.namespace]?.count || 0;
      }

      return counts[this.type]?.summary?.count || 0;
    }
  },

  methods: {
    updateMatchingResources: throttle(async function() {
      // TODO: RC TEST
      this.matchingResources = await matching({
        labelSelector: { matchExpressions: this.selectorExpressions },
        type:          this.type,
        $store:        this.$store,
        inScopeCount:  this.allResourcesInScope,
        namespace:     this.namespace,
      });

      // let match = [];

      // if (this.selectorExpressions?.length) {
      //   const findPageArgs = { // Of type ActionFindPageArgs
      //     namespaced: this.namespace,
      //     pagination: new FilterArgs({ labelSelector: { matchExpressions: this.selectorExpressions } }),
      //   };

      //   const res = await this.$dispatch('findPage', { type: this.type, opt: findPageArgs });

      //   match = res;
      // }

      // // this.allResourcesInScope = this.namespace ? this.allResources.filter((res) => res.metadata.namespace === this.namespace) : this.allResources;
      // // const match = matching(this.allResourcesInScope, this.selectorExpressions);
      // const matched = match.length || 0;
      // const sample = match[0]?.nameDisplay;

      // this.matchingResources = {
      //   matched,
      //   matches: match,
      //   none:    matched === 0,
      //   sample,
      //   total:   this.allResourcesInScope.length,
      // };
    }, 250, { leading: true }),
  }

};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <MatchExpressions
          v-model:value="selectorExpressions"
          :mode="mode"
          :show-remove="false"
          :type="type"
          :target-resources="allResourcesInScope"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <Banner :color="(matchingResources.none ? 'warning' : 'success')">
          <span v-clean-html="t('generic.selectors.matchingResources.matchesSome', matchingResources)" />
        </Banner>
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <ResourceTable
          :rows="matchingResources.matches"
          :headers="tableHeaders"
          key-field="id"
          :table-actions="false"
          :schema="schema"
          :groupable="false"
          :search="false"
        />
      </div>
    </div>
  </div>
</template>
