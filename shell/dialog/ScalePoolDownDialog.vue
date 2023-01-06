<script>
import { Card } from '@components/Card';
import { alternateLabel } from '@shell/utils/platform';
import { Checkbox } from '@components/Form/Checkbox';

export default {
  components: { Card, Checkbox },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    const allToDelete = Array.isArray(this.resources) ? this.resources : [this.resources];

    return {
      allToDelete,
      type:               this.$store.getters['type-map/labelFor'](allToDelete[0].schema, allToDelete.length),
      promptConfirmation: true
    };
  },
  computed: {
    machinenName() {
      return this.resources[0].id.split('/')[1];
    },
    protip() {
      return this.t('promptRemove.protip', { alternateLabel });
    },
  },
  created() {
    const showScalePoolPrompt = this.$cookies.get('scalePoolPrompt');

    // Check for showScalePoolPrompt cookies
    // If undefined set cookies and update promt checkbox
    if ( showScalePoolPrompt === undefined ) {
      this.promptConfirmation = true;
      this.$cookies.set('scalePoolPrompt', true);
    } else {
      this.promptConfirmation = showScalePoolPrompt;
    }
  },

  methods: {
    close() {
      this.$emit('close');
    },

    update() {
      this.$cookies.set('scalePoolPrompt', !!this.promptConfirmation);
    },

    remove() {
      // Delete pool
      if (this.resources.length > 0 ) {
        this.resources[0].scalePool(-1);
      }
      this.close();
    }
  }
};
</script>

<template>
  <Card
    class="prompt-remove"
    :show-highlight-border="false"
  >
    <h4
      slot="title"
      class="text-default-text"
    >
      {{ t('promptForceRemove.modalTitle') }}
    </h4>
    <div
      slot="body"
      class="pl-10 pr-10"
    >
      <div>
        {{ t('promptRemove.attemptingToRemove', { type }) }} <b>{{ machinenName }}</b>
      </div>
      <div>
        <Checkbox
          v-model="promptConfirmation"
          :label="t('promptRemove.promptConfirmation')"
          class="mt-10"
          @input="update()"
        />
      </div>
      <div class="text-info mt-20">
        {{ protip }}
      </div>
    </div>
    <template #actions>
      <button
        class="btn role-secondary mr-10"
        @click="close"
      >
        {{ t('generic.cancel') }}
      </button>
      <div class="spacer" />
      <button
        class="btn bg-error ml-10 btn role-primary"
        @click="remove"
      >
        {{ t('generic.confirm') }}
      </button>
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  .actions {
    text-align: right;
  }
</style>
