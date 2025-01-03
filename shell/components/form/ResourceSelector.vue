<script>
import { Banner } from '@components/Banner';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import ResourceTable from '@shell/components/ResourceTable';
import { allHash } from '@shell/utils/promise';
import { _EDIT } from '@shell/config/query-params';
import { convert, matching, simplify } from '@shell/utils/selector';
import throttle from 'lodash/throttle';
import { COUNT } from '@shell/config/types';
import isEmpty from 'lodash/isEmpty';
import { FilterArgs } from '@shell/types/store/pagination.types';

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
    /**
     * Is the selector is null then should it match all resources?
     *
     * This can be different per resource
     */
    nullMatchesAll: {
      type:    Boolean,
      default: false,
    },
    /**
     * Is the selector is empty (`{}`) then should it match all resources?
     *
     * This can be different per resource
     */
    emptyMatchesAll: {
      type:    Boolean,
      default: true,
    },
  },

  async fetch() {
    // const hash = await allHash({ allResources: this.$store.dispatch('cluster/findAll', { type: this.type }) });

    // this.allResources = hash.allResources;

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

    const store = 'cluster';

    return {
      store,
      matchingResources,
      // allResources:        [],
      allResourcesInScope: [],
      tableHeaders:        this.$store.getters['type-map/headersFor'](
        this.$store.getters[`${ store }/schemaFor`](this.type)
      ),
    };
  },

  watch: {
    namespace:                'updateMatchingResources',
    'value.matchLabels':      'updateMatchingResources',
    'value.matchExpressions': 'updateMatchingResources',
  },

  computed: {
    schema() {
      return this.$store.getters[`${ this.store }/schemaFor`](this.type);
    },

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

    matchAll() {
      return (this.nullMatchesAll === true && (this.value.matchLabels === null && this.value.matchExpressions === null)) ||
        (this.emptyMatchesAll === true && this.selectorExpressions.length === 0);
    }
  },

  methods: {
    async fetchMatches({
      type,
      namespace,
      labelSelector // of type KubeLabelSelector
    }) {
      const findPageArgs = { // Of type ActionFindPageArgs
        namespaced: namespace,
        pagination: new FilterArgs({ labelSelector }),
      };

      return this.$store.dispatch(`${ this.store }/findPage`, { type, opt: findPageArgs });
    },

    updateMatchingResources: throttle(async function() {
      // This is scarily similar to shell/edit/service.vue updateMatchingPods....
      const expressions = this.selectorExpressions;
      const counts = this.$store.getters[`${ this.store }/all`](COUNT)?.[0]?.counts || {};
      const allResourcesInScope = this.namespace ? counts[this.type]?.namespaces[this.namespace]?.count || 0 : counts[this.type]?.summary.count;

      if (allResourcesInScope === 0) {
        this.matchingResources = {
          matched: 0,
          matches: [],
          none:    true,
          sample:  null,
          total:   allResourcesInScope
        };
      } else if (this.matchAll) {
        this.matchingResources = {
          matched: allResourcesInScope,
          matches: [],
          none:    false,
          sample:  null,
          total:   allResourcesInScope
        };
      } else {
        const matches = await this.fetchMatches({
          type:          this.type,
          namespace:     this.namespace,
          labelSelector: { matchExpressions: expressions },
        });
        const sample = matches[0]?.nameDisplay;

        this.matchingResources = {
          matched: matches.length,
          matches,
          none:    matches === 0,
          sample,
          total:   allResourcesInScope
        };
      }

      // TODO: RC previously no selector showed everything as matched, now we show no matches

      // Previously...
      // const allResourcesInScope2 = this.namespace ? this.allResources.filter((res) => res.metadata.namespace === this.namespace) : this.allResources;
      // const match = matching(allResourcesInScope2, this.selectorExpressions);
      // const matched = match.length || 0;
      // const sample = match[0]?.nameDisplay;

      // console.warn(this.selectorExpressions, matched);

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
        />
        <!-- :target-resources="allResourcesInScope" prop doesn't exist -->
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <Banner :color="(matchingResources.none ? 'warning' : 'success')">
          <span v-clean-html="t(matchAll ? 'generic.selectors.matchingResources.matchesAll' : 'generic.selectors.matchingResources.matchesSome', matchingResources)" />
        </Banner>
      </div>
    </div>
    <div
      v-if="!matchAll"
      class="row"
    >
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
