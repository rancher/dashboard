<script>
import omit from 'lodash/omit';
import { get } from '@/utils/object';

import createEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';
import ResourceQuota from '@/edit/core.v1.namespace/ResourceQuota';
import Footer from '@/components/form/Footer';
import LabelsAndAnnotationsEditor from '@/components/LabelsAndAnnotations/Editor';
import { ANNOTATION } from '@/config/types';

export default {
  components: {
    LabeledInput, ResourceQuota, Footer, LabelsAndAnnotationsEditor
  },
  mixins:     [createEditView],
  data() {
    let originalQuotaID = null;
    let description;

    if (!!this.originalValue) {
      originalQuotaID = `${ this.originalValue.metadata.name }/default-quota`;
      const orignalAnnotations = get(this.originalValue, 'metadata.annotations');

      if (orignalAnnotations) {
        description = orignalAnnotations[ANNOTATION.DESCRIPTION];
      }
      this.value.metadata.annotations = this.originalValue.metadata.annotations ? JSON.parse(JSON.stringify(this.originalValue.metadata.annotations)) : {};
      this.value.metadata.labels = this.originalValue.metadata.labels ? JSON.parse(JSON.stringify(this.originalValue.metadata.labels)) : {};
    }
    if (!this.value.metadata) {
      this.value.metadata = {
        annotations: {},
        labels:      {},
        name:        ''
      };
    }

    if (!this.value.metadata.annotations) {
      this.value.metadata.annotations = {};
    }

    if (!this.value.metadata.labels) {
      this.value.metadata.labels = {};
    }

    return {
      originalQuotaID, description, name: this.value.metadata.name
    };
  },
  computed: {
    annotations: {
      get() {
        const all = get(this.value, 'metadata.annotations');

        return omit(all, [ANNOTATION.DESCRIPTION]);
      },
      set(annotations) {
        this.$set(this.value.metadata, 'annotations', { ...annotations, [ANNOTATION.DESCRIPTION]: this.description });
      }
    },
  },
  watch: {
    description(description) {
      this.value.metadata.annotations[ANNOTATION.DESCRIPTION] = description;
    },
    name(name) {
      this.value.metadata.name = name;
    }
  }
};
</script>

<template>
  <div>
    <form>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model="name"
            required
            label="Name"
            type="text"
            :disabled="mode!=='create'"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput v-model="description" :mode="mode" label="Description" type="text" placeholder="Any text you want that better describes the namespace" />
        </div>
      </div>
      <h4 class="mb-10">
        Container Default Resource Limit
      </h4>
      <div class="row">
        <ResourceQuota
          :original-i-d="originalQuotaID"
          class="col span-12"
          :register-after-hook="registerAfterHook"
          :mode="mode"
          :namespace="value"
        />
      </div>
      <LabelsAndAnnotationsEditor :mode="mode" :labels.sync="value.metadata.labels" :annotations.sync="annotations" />
      <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
    </form>
  </div>
</template>
