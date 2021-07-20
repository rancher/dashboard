<script>
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
      default: 'view'
    }
  },

  data() {
    return { dialogVisible: false, labels: {} };
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
      this.$set(this.spec.metadata, 'labels', this.labels);
      this.$emit('update');
      this.hide();
    },
    hide() {
      this.$modal.hide('labelModal');
      this.$emit('close');
    },
    open() {
      this.labels = Object.assign({}, this.spec?.metadata?.labels);
      this.$modal.show('labelModal');
    }
  }
};
</script>

<template>
  <modal
    name="labelModal"
    width="50%"
    height="auto"
    :click-to-close="false"
    class="label-modal"
    @open="open"
  >
    <Card>
      <template #title>
        <h4 slot="title" class="text-default-text">
          Edit Labels
        </h4>
      </template>

      <template #body>
        <KeyValue
          v-if="visible"
          key="labels"
          v-model="labels"
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
  .label-modal {
    .extra-column {
      LABEL {
        position: relative;
      }
    }
  }
</style>
