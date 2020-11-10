<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';
import KeyValue from '@/components/form/KeyValue';
import Labels from '@/components/form/Labels';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import RelatedResources from '@/components/RelatedResources';
import { WORKLOAD_TYPES } from '@/config/types';
import { asciiLike } from '@/utils/string';
import { base64Encode, base64Decode } from '@/utils/crypto';

export default {
  name: 'CruConfigMap',

  components: {
    CruResource,
    NameNsDescription,
    KeyValue,
    Labels,
    Tab,
    Tabbed,
    RelatedResources
  },

  mixins: [CreateEditView],
  data() {
    const { binaryData = {}, data = {} } = this.value;

    const decodedBinaryData = {};

    Object.keys(binaryData).forEach((key) => {
      decodedBinaryData[key] = base64Decode(binaryData[key]);
    });

    return { allData: { ...decodedBinaryData, ...data } };
  },

  computed: {
    hasRelatedWorkloads() {
      const { relationships = [] } = this.value.metadata;

      for (const r in relationships) {
        if (r.rel === 'owner' && WORKLOAD_TYPES.includes(r.fromType)) {
          return true;
        }
      }

      return false;
    },
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
      v-if="!isView"
      :value="value"
      :mode="mode"
      :register-before-hook="registerBeforeHook"
    />

    <div class="spacer"></div>

    <Tabbed :side-tabs="true">
      <Tab name="data" :label="t('configmap.tabs.data.label')" :weight="2">
        <KeyValue
          key="data"
          v-model="allData"
          :mode="mode"
          :protip="t('configmapPage.data.protip')"
          :initial-empty-row="true"
          :value-can-be-empty="true"
          :read-multiple="true"
          :read-accept="'*'"
        />
      </Tab>
      <Tab
        v-if="!isView"
        name="labels-and-annotations"
        :label="t('generic.labelsAndAnnotations')"
        :weight="-1"
      >
        <Labels
          default-container-class="labels-and-annotations-container"
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </Tab>
      <Tab v-if="hasRelatedWorkloads" name="relatedWorkloads" :label="t('secrest.relatedWorkloads')">
        <RelatedResources :ignore-types="['pod']" :value="value" rel="uses" direction="from" />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
