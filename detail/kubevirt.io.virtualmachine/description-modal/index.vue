<script>
import { DESCRIPTION } from '@/config/labels-annotations';
import Card from '@/components/Card';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput, Card },

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
    return { dialogVisible: false, description: null };
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
      this.$set(this.spec.metadata.annotations, DESCRIPTION, this.description);
      this.$emit('update');
      this.hide();
    },
    hide() {
      this.$modal.hide('descModal');
      this.$emit('close');
    },
    open() {
      this.description = this.spec?.metadata?.annotations?.[DESCRIPTION];
      this.$modal.show('descModal');
    }
  }
};
</script>

<template>
  <modal
    name="descModal"
    height="auto"
    :click-to-close="false"
    width="50%"
    @open="open"
  >
    <Card>
      <template #title>
        <h4 slot="title" class="text-default-text">
          Edit Description
        </h4>
      </template>

      <template #body>
        <LabeledInput
          key="description"
          v-model="description"
          label="Description"
          :min-height="30"
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
