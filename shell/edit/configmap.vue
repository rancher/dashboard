<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import KeyValue from '@shell/components/form/KeyValue';
import Labels from '@shell/components/form/Labels';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { asciiLike } from '@shell/utils/string';
import { base64Encode, base64Decode } from '@shell/utils/crypto';

export default {
  name: 'CruConfigMap',

  components: {
    CruResource,
    NameNsDescription,
    KeyValue,
    Labels,
    Tab,
    Tabbed,
  },

  mixins: [CreateEditView],
  data() {
    const { binaryData = {}, data = {} } = this.value;

    const decodedBinaryData = {};
    const binaryValueKeys = [];

    Object.keys(binaryData).forEach((key) => {
      decodedBinaryData[key] = base64Decode(binaryData[key]);
      binaryValueKeys.push(key);
    });

    return {
      allData: {
        ...decodedBinaryData,
        ...data
      },
      binaryValueKeys
    };
  },

  watch: {
    allData(neu, old) {
      this.$set(this.value, 'data', {});
      this.$set(this.value, 'binaryData', {});

      Object.keys(neu).forEach((key) => {
        if (this.isBinary(neu[key])) {
          const encoded = base64Encode(neu[key]);

          this.$set(this.value.binaryData, key, encoded);
        } else {
          this.$set(this.value.data, key, neu[key]);
        }
      });
    }
  },

  methods: {
    isBinary(value) {
      return typeof value === 'string' && !asciiLike(value);
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
          v-model="allData"
          :binary-value-keys="binaryValueKeys"
          :mode="mode"
          :protip="t('configmap.tabs.data.protip')"
          :initial-empty-row="true"
          :value-can-be-empty="true"
          :read-multiple="true"
          :read-accept="'*'"
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
