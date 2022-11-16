<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import KeyValue from '@shell/components/form/KeyValue';
import Labels from '@shell/components/form/Labels';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';

export default {
  name: 'CruConfigMap',

  components: {
    CruResource,
    NameNsDescription,
    KeyValue,
    Labels,
    Tab,
    Tabbed
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
      <Tab
        name="data"
        :label="t('configmap.tabs.data.label')"
        :weight="2"
      >
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
        <KeyValue
          key="binaryData"
          v-model="binaryData"
          :initial-empty-row="true"
          :handle-base64="true"
          :add-allowed="true"
          :read-allowed="true"
          :mode="mode"
          :protip="t('configmap.tabs.data.protip')"
        />
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
