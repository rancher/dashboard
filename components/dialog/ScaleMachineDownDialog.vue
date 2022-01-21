<script>
import { CAPI as CAPI_LABELS } from '@/config/labels-annotations';
import { CAPI } from '@/config/types';
import GenericPrompt from './GenericPrompt';

export default {
  components: { GenericPrompt },

  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },

  async fetch() {
    await Promise.all([
      this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT }),
      this.$store.dispatch('management/findAll', { type: CAPI.MACHINE })
    ]);
  },

  data() {
    const allToDelete = Array.isArray(this.resources) ? this.resources : [this.resources];
    const cluster = allToDelete[0].cluster;

    // Not all machines can be deleted, there must always be at least one left with the role of control plane in the cluster
    const allToDeleteByType = allToDelete.reduce((res, m) => {
      if (m.isControlPlane) {
        res.controlPlane.push(m);
      } else {
        res.others.push(m);
      }

      return res;
    }, { controlPlane: [], others: [] });

    const totalControlPlanes = cluster.machines.filter(m => m.isControlPlane).length;
    const controlPlanesToDelete = allToDeleteByType.controlPlane.length;
    // If we're attempting to remove all control plan machines.... ignore one
    const ignoredControlPlane = totalControlPlanes - controlPlanesToDelete === 0 ? allToDeleteByType.controlPlane.pop() : undefined;
    const safeMachinesToDelete = [...allToDeleteByType.controlPlane, ...allToDeleteByType.others];

    return {
      cluster,
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
      // Group machines into pools
      const poolInfo = this.safeMachinesToDelete.reduce((res, m) => {
        res.set(m.pool, res.get(m.pool) || []);
        res.get(m.pool).push(m);

        return res;
      }, new Map());

      // Mark all machines for deletion and then scale down their pool
      const flatArray = Array.from(poolInfo.entries());

      await Promise.all(flatArray.map(([pool, machines]) => {
        return Promise
          .all(machines.map((m) => {
            m.setAnnotation(CAPI_LABELS.DELETE_MACHINE, 'true');

            return m.save();
          }))
          .then(() => pool.scalePool(-machines.length, false));
      }));

      // Pool scale info is kept in the cluster itself
      await this.cluster.save();
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
