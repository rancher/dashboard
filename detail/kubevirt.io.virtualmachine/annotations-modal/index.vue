<script>
import { DESCRIPTION } from '@/config/labels-annotations';
import Card from '@/components/Card';
import KeyValue from '@/components/form/KeyValue';

export default {
  components: { KeyValue, Card },

  props: {
    spec: {
      type:     Object,
      required: true,
    },
    visible: {
      type:    Boolean,
      default: false
    },
    mode: {
      type:     String,
      default: 'create'
    }
  },

  data() {
    return { dialogVisible: false, annotations: {} };
  },

  watch: {
    visible(neu) {
      if (neu) {
        this.open();
      }
    }
  },

  methods: {
    save() {
      const description = this.spec?.metadata?.annotations?.[DESCRIPTION];
      const mergeAnno = this.annotations;

      if (description) {
        mergeAnno[DESCRIPTION] = description;
      }

      this.$set(this.spec.metadata, 'annotations', mergeAnno);
      this.$emit('update');
      this.hide();
    },

    hide() {
      this.$modal.hide('annotationModal');
      this.$emit('close');
    },
    open() {
      const filterd = {};
      const annotations = this.spec?.metadata?.annotations || {};

      Object.keys(annotations).forEach((key) => {
        if (key === DESCRIPTION) {
          return;
        }
        filterd[key] = annotations[key];
      });

      this.annotations = filterd;

      this.$modal.show('annotationModal');
    }
  }
};
</script>

<template>
  <modal
    name="annotationModal"
    width="50%"
    :click-to-close="false"
    height="auto"
    class="anno-modal"
  >
    <Card>
      <template #title>
        <h4 slot="title" class="text-default-text">
          Edit Annotations
        </h4>
      </template>

      <template #body>
        <KeyValue
          v-if="visible"
          key="annotations"
          v-model="annotations"
          :mode="mode"
          :initial-empty-row="true"
          :pad-left="false"
          :read-allowed="false"
        />
      </template>

      <template #actions>
        <button class="btn role-secondary btn-sm mr-20" @click="hide">
          Close
        </button>
        <button class="btn role-tertiary bg-primary btn-sm mr-20" @click="save">
          Save
        </button>
      </template>
    </Card>
  </modal>
</template>

<style lang="scss">
.anno-modal {
  .tip {
    font-size: 13px;
    font-style: italic;
  }
  .extra-column {
    LABEL {
      position: relative;
    }
  }
}
</style>
