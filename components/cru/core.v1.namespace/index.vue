<script>
import { get } from '@/utils/object';
import createEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import ResourceQuota from '@/components/cru/core.v1.namespace/ResourceQuota';
import Footer from '@/components/form/Footer';
import KeyValue from '@/components/form/KeyValue';
export default {
  components: {
    NameNsDescription, ResourceQuota, Footer, KeyValue
  },
  mixins:     [createEditView],
  computed: {
    labels: {
      get() {
        return get(this.value, 'metadata.labels') || {};
      },
      set(labels) {
        this.$set(this.value.metadata, 'labels', labels);
      }
    },
    annotations: {
      get() {
        return get(this.value, 'metadata.annotations') || {};
      },
      set(annotations) {
        this.$set(this.value.metadata, 'annotations', annotations);
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <NameNsDescription
        v-model="value"
        class="col span-12 inline-description"
        :namespaced="false"
        :mode="mode"
        always-describe
      />
    </div>
    <h4 class="mb-10">
      Container Default Resource Limit
    </h4>
    <div class="row">
      <ResourceQuota class="col span-12" :register-after-hook="registerAfterHook" :value="value" />
    </div>
    <h4 class="mb-10">
      Labels and Annotations
    </h4>
    <div class="row">
      <div class="col span-6">
        <KeyValue
          key="labels"
          v-model="labels"
          :mode="mode"
          :value-multiline="false"
          :pad-left="false"
          :read-allowed="false"
          add-label="Add Label"
          :protip="false"
        />
      </div>
      <div class="col span-6">
        <KeyValue
          key="annotations"
          v-model="annotations"
          :value-multiline="false"
          :mode="mode"
          :pad-left="false"
          :read-allowed="false"
          add-label="Add Annotation"
          :protip="false"
        />
      </div>
    </div>

    <Footer :mode="mode" @save="save" @done="done" />
  </div>
</template>

<style lang = 'scss'>
  .inline-description {
      display: flex;
      & > * {
        align-content: stretch;
        margin-right: 10px;
        flex: 1;
      }
  }
</style>
