<script>
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import ArrayList from '@/components/form/ArrayList';
import createEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import { mapGetters } from 'vuex';
import { CIS } from '@/config/types';

export default {
  components: {
    NameNsDescription,
    LabeledSelect,
    ArrayList,
    CruResource
  },

  mixins: [createEditView],

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    mode: {
      type:    String,
      default: 'create'
    }
  },

  async fetch() {
    this.allBenchmarks = await this.$store.dispatch('cluster/findAll', { type: CIS.BENCHMARK });
  },

  data() {
    return { allBenchmarks: [], name: this.value.metadata.name };
  },

  computed: {
    ...mapGetters({ currentCluster: 'currentCluster', t: 'i18n/t' }),

    provider() {
      return this.currentCluster.status.provider;
    },

    // filter benchmarks by spec.clusterProvider that match current cluster provider, and include any wih no provider defined
    compatibleBenchmarkNames() {
      return this.allBenchmarks.filter((benchmark) => {
        if (!!benchmark?.spec?.clusterProvider) {
          return benchmark?.spec?.clusterProvider === this.provider;
        }

        return true;
      }).reduce((names, benchmark) => {
        names.push(benchmark.id);

        return names;
      }, []);
    },

  },

  watch: {
    compatibleBenchmarkNames(neu) {
      if (neu.length === 1) {
        this.value.benchmarkVersion = neu[0];
      }
    },
  }
};
</script>

<template>
  <div>
    <CruResource :validation-passed="!!name && !!value.benchmarkVersion" :done-route="doneRoute" :resource="value" :mode="mode" @finish="save">
      <template>
        <div class="row">
          <div class="col span-12">
            <NameNsDescription :mode="mode" :value="value" :namespaced="false" @change="name=value.metadata.name" />
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <LabeledSelect v-model="value.benchmarkVersion" :label="t('cis.benchmarkVersion')" :options="compatibleBenchmarkNames" />
          </div>
        </div>
        <div class="spacer" />
        <div class="row">
          <div class="col span-6">
            <h3>{{ t('cis.testsToSkip') }}</h3>
            <ArrayList v-model="value.skipTests" :value-label="t('cis.testID')" :show-header="true" :add-label="t('cis.addTest')" :mode="mode" />
          </div>
        </div>
      </template>
    </CruResource>
  </div>
</template>
