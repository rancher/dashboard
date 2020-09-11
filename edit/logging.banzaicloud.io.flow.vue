<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import { LOGGING } from '@/config/types';
import SortableTable from '@/components/SortableTable';
import { NAME, CONFIGURED_PROVIDERS } from '@/config/table-headers';
import Banner from '@/components/Banner';

export default {
  components: {
    Banner,
    CruResource,
    Labels,
    Loading,
    NameNsDescription,
    SortableTable,
    Tab,
    Tabbed
  },

  mixins: [CreateEditView],

  async fetch() {
    this.allOutputs = await this.$store.dispatch('cluster/findAll', { type: LOGGING.OUTPUTS }) || [];
    this.initialSelection = [...this.value.outputs];
  },

  data() {
    this.value.metadata.namespace = 'default';

    return {
      allOutputs:        [],
      noOutputsBanner:   this.t('logging.flow.noOutputsBanner'),
      selectedOutputs:   [],
      initialSelection:  [],
      tableHeaders:      [
        { ...NAME, labelKey: 'tableHeaders.output' }, CONFIGURED_PROVIDERS
      ],
    };
  },
  computed: {
    outputs() {
      return this.allOutputs.filter(output => output.namespace === this.value.namespace);
    },
    rows() {
      return this.isView ? this.value.outputs : this.outputs;
    },
    bannerColor() {
      return this.outputs.length > 0 ? 'info' : 'warning';
    },
    bannerMessage() {
      return this.outputs.length > 0 ? this.t('logging.flow.outputsBanner') : this.noOutputsBanner;
    }
  },
  watch: {
    '$fetchState.pending': {
      handler() {
        if (!this.$fetchState.pending) {
          this.$nextTick(() => {
            this.selectInitial();
          });
        }
      }
    }
  },
  methods: {
    onSelection(selected) {
      if (!this.isView) {
        this.value.spec = this.value.spec || {};
        this.value.spec.outputRefs = selected.map(s => s.name);
      }
    },
    selectInitial() {
      this.$refs.table.update(this.initialSelection, []);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    class="flow"
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription v-if="!isView" v-model="value" :mode="mode" :namespaced="isNamespaced" />

    <Tabbed :side-tabs="true">
      <Tab name="outputs" :label="t('logging.flow.outputs')">
        <Banner v-if="!isView" :color="bannerColor">
          {{ bannerMessage }}
        </Banner>
        <SortableTable
          ref="table"
          class="sortable-table"
          :headers="tableHeaders"
          :rows="rows"
          :row-actions="false"
          :search="false"
          :table-actions="!isView"
          :show-header-row="false"
          key-field="id"
          @selection="onSelection"
        />
      </Tab>
      <Tab
        v-if="!isView"
        name="labels-and-annotations"
        :label="t('generic.labelsAndAnnotations')"
        :weight="1000"
      >
        <Labels
          default-container-class="labels-and-annotations-container"
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<style lang="scss">
.flow {
    .sortable-table .sortable-table-header {
        display: none;
    }
}
</style>
