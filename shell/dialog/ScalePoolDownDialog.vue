<script>
import { Card } from '@components/Card';
import { alternateLabel } from '@shell/utils/platform';
import { Checkbox } from '@components/Form/Checkbox';
import { SCALE_POOL_PROMPT } from '@shell/store/prefs';

export default {
  emits: ['close'],

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
      const name = this.resources.length > 0 ? this.resources[0].id.split('/')[1] : '';

      return name;
    },
    protip() {
      return this.t('promptRemove.protip', { alternateLabel });
    },
  },
  created() {
    const showScalePoolPrompt = this.$store.getters['prefs/get'](SCALE_POOL_PROMPT);

    // Check for showScalePoolPrompt pref
    // If it is not set, set it to true and update promt checkbox
    if ( showScalePoolPrompt === null ) {
      this.promptConfirmation = true;
      this.$store.dispatch('prefs/set', { key: SCALE_POOL_PROMPT, value: true });
    } else {
      this.promptConfirmation = showScalePoolPrompt;
    }
  },

  methods: {
    close() {
      this.$emit('close');
    },

    update() {
      this.$store.dispatch('prefs/set', { key: SCALE_POOL_PROMPT, value: !!this.promptConfirmation });
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
    <template #title>
      <h4 class="text-default-text">
        {{ t('promptForceRemove.modalTitle') }}
      </h4>
    </template>
    <template #body>
      <div class="pl-10 pr-10">
        <div>
          {{ t('promptRemove.attemptingToRemove', { type }) }} <b>{{ machinenName }}</b>
        </div>
        <div>
          <Checkbox
            v-model:value="promptConfirmation"
            :label="t('promptRemove.promptConfirmation')"
            class="mt-10"
            @update:value="update()"
          />
        </div>
        <div class="text-info mt-20">
          {{ protip }}
        </div>
      </div>
    </template>
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
