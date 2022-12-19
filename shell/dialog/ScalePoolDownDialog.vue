<script>
import { Card } from '@components/Card';
import { alternateLabel } from '@shell/utils/platform';
import { handleConflict } from '@shell/plugins/dashboard-store/normalize';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { CAPI } from '@shell/config/types';
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
      type: this.$store.getters['type-map/labelFor'](allToDelete[0].schema, allToDelete.length),
      promptConfirmation: false
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
  mounted() {
    const scalePoolPrompcsrf = this.$cookies.get('scalePoolPromp');
    this.promptConfirmation = scalePoolPrompcsrf;
  },

  methods: {
    scalePool(delta, save = true, depth = 0) {
      console.log(delta);
      // This is used in different places with different scaling rules, so don't check if we can/cannot scale
      if (!this.resources[0].inClusterSpec) {
        return;
      }

      if (delta === -1) {
        console.log('machine -1');

        return;
      }

      const initialValue = this.resources[0].cluster.toJSON();

      this.resources[0].inClusterSpec.quantity += delta;

      if ( !save ) {
        return;
      }
      const value = this.resources[0].cluster;
      const liveModel = this.resources[0].$rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, this.resources[0].cluster.id);

      if ( this.resources[0].scaleTimer ) {
        clearTimeout(this.resources[0].scaleTimer);
      }

      this.resources[0].scaleTimer = setTimeout(() => {
        this.resources[0].cluster.save().catch((err) => {
          let errors = exceptionToErrorsArray(err);

          if ( err.status === 409 && depth < 2 ) {
            const conflicts = handleConflict(initialValue, value, liveModel, this.resources[0].$rootGetters, this.resources[0].$store);

            if ( conflicts === false ) {
              // It was automatically figured out, save again
              // (pass in the delta again as `this.inClusterSpec.quantity` would have reset from the re-fetch done in `save`)
              return this.scalePool(delta, true, depth + 1);
            } else {
              errors = conflicts;
            }
          }

          this.$dispatch('growl/fromError', {
            title: 'Error scaling pool',
            err:   errors
          }, { root: true });
        });
      }, 1000);
    },

    close() {
      this.$emit('close');
    },

    update(e) {
      console.log('clicked');
      
      console.log('clicked ---- ' + e);
      if (this.promptConfirmation) {
        console.log('true ---- set to false');
        this.$cookies.set('scalePoolPromp', true);
      } else {
        console.log('false ---- set to true');
        this.$cookies.set('scalePoolPromp', false);
      }
    },

    remove() {
      // Delete pool
      this.scalePool(-1);
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
          @input="update($event)"
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
        class="btn role-secondary mr-10"
        @click="remove"
      >
        Confirm
      </button>
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  .actions {
    text-align: right;
  }
</style>
