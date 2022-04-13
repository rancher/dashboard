<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';
import KeyValue from '@/components/form/KeyValue';
import Labels from '@/components/form/Labels';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import Banner from '@/components/Banner';
import { _EDIT } from '@/config/query-params';

export default {
  name: 'CruConfigMap',

  components: {
    CruResource,
    NameNsDescription,
    KeyValue,
    Labels,
    Tab,
    Tabbed,
    Banner
  },

  mixins: [CreateEditView],
  data() {
    const { binaryData = {}, data = {} } = this.value;

    return {
      data,
      binaryData
    };
  },
  computed: {
    hasBinaryData() {
      return Object.keys(this.binaryData).length > 0;
    },
    isEditMode() {
      return this.mode === _EDIT;
    }
  },

  watch: {
    data(neu, old) {
      this.updateValue(neu, 'data');
    },
    binaryData(neu, old) {
      this.updateValue(neu, 'binaryData');
    },
  },

  methods: {
    updateValue(val, type) {
      this.$set(this.value, type, {});

      Object.keys(val).forEach((key) => {
        this.$set(this.value[type], key, val[key]);
      });
    }
  }
};
</script>

<template>
  <CruResource
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
    <NameNsDescription
      :value="value"
      :mode="mode"
      :register-before-hook="registerBeforeHook"
    />

    <Tabbed :side-tabs="true">
      <Tab name="data" :label="t('configmap.tabs.data.label')" :weight="2">
        <KeyValue
          key="data"
          v-model="data"
          :mode="mode"
          :protip="t('configmap.tabs.data.protip')"
          :initial-empty-row="true"
          :value-can-be-empty="true"
          :read-multiple="true"
          :read-accept="'*'"
        />
      </Tab>
      <Tab
        name="binary-data"
        :label="t('configmap.tabs.binaryData.label')"
        :weight="1"
      >
        <div v-if="hasBinaryData">
          <Banner
            v-if="isEditMode"
            color="info"
            label-key="configmap.tabs.binaryData.banner"
          />
          <KeyValue
            key="binaryData"
            v-model="binaryData"
            :values-as-binary="true"
            :add-allowed="false"
            :read-allowed="false"
            :mode="mode"
            :protip="t('configmap.tabs.data.protip')"
          />
        </div>
        <p v-else class="no-binary-data mt-20">
          {{ t('configmap.tabs.binaryData.noData') }}
        </p>
      </Tab>
      <Tab
        name="labels-and-annotations"
        label-key="generic.labelsAndAnnotations"
        :weight="-1"
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

<style lang="scss" scoped>
.no-binary-data {
  opacity: 0.8;
}
</style>
