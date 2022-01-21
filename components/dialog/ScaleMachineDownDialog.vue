<script>
import { CAPI as CAPI_LABELS } from '@/config/labels-annotations';
import GenericPrompt from './GenericPrompt';

export default {
  components: { GenericPrompt },

  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    const allToDelete = Array.isArray(this.resources) ? this.resources : [this.resources];

    // Not all machines can be deleted, there must always be at least one left with the role of control plane in the cluster
    const allToDeleteByType = allToDelete.reduce((res, m) => {
      if (m.isControlPlane) {
        res.controlPlane.push(m);
      } else {
        res.others.push(m);
      }

      return res;
    }, { controlPlane: [], others: [] });

    const totalControlPlanes = allToDelete[0].cluster.machines.filter(m => m.isControlPlane).length;
    const controlPlanesToDelete = allToDeleteByType.controlPlane.length;
    // If we're attempting to remove all control plan machines.... ignore one
    const ignoredControlPlane = totalControlPlanes - controlPlanesToDelete === 0 ? allToDeleteByType.controlPlane.pop() : undefined;
    const safeMachinesToDelete = [...allToDeleteByType.controlPlane, ...allToDeleteByType.others];

    return {
      allToDelete,
      safeMachinesToDelete,
      ignoredControlPlane,
      type:   this.$store.getters['type-map/labelFor'](allToDelete[0].schema, allToDelete.length),
      config: {
        title:       this.t('promptRemove.title'),
        applyMode:   'delete',
        applyAction: this.remove,
      }
    };
  },

  methods: {

    async remove() {
      // Set the `delete-machine` annotation on each machine and then scale down the pool to the new size
      await Promise.all(this.safeMachinesToDelete.map((machine) => {
        machine.setAnnotation(CAPI_LABELS.DELETE_MACHINE, 'true');

        return machine.save();
      }));
      await this.safeMachinesToDelete[0].pool.scalePool(-this.safeMachinesToDelete.length);
    }
  }
};
</script>

<template>
  <GenericPrompt :resources="[config]" @close="$emit('close')">
    <template slot="body">
      <div class="pl-10 pr-10 mt-20 mb-20 body">
        <div v-if="allToDelete.length === 1">
          {{ t('promptRemove.attemptingToRemove', { type }) }} <b>{{ safeMachinesToDelete[0].name }}</b>
        </div>
        <div v-else>
          {{ t('promptScaleMachineDown.attemptingToRemove', { type, count: allToDelete.length }, true) }}
        </div>
        <div v-if="ignoredControlPlane" class="retained-machine">
          <span>{{ t('promptScaleMachineDown.retainedMachine1') }}</span>
          <span v-html="t('promptScaleMachineDown.retainedMachine2', { name: ignoredControlPlane.name }, true)"></span>
        </div>
      </div>
    </template>
  </GenericPrompt>
</template>

<style lang='scss' scoped>
  .body {
    div:not(:last-of-type) {
      padding-bottom: 15px;
    }
    .retained-machine {
      display: flex;
      flex-direction: column;
    }
  }
</style>
