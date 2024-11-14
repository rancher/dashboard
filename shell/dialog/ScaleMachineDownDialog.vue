<script>
import { CAPI as CAPI_LABELS } from '@shell/config/labels-annotations';
import { MANAGEMENT, CAPI } from '@shell/config/types';
import GenericPrompt from './GenericPrompt';

export default {
  emits: ['close'],

  components: { GenericPrompt },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  async fetch() {
    if (this.isRke2) {
      await Promise.all([
        this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT }),
        this.$store.dispatch('management/findAll', { type: CAPI.MACHINE })
      ]);
    } else {
      await Promise.all([
        this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL }),
        this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE })
      ]);
    }
  },

  data() {
    const isRke2 = this.resources[0].cluster?.isRke2;
    const cluster = isRke2 ? this.resources[0].cluster : this.resources[0].provisioningCluster;

    // Not all machines can be deleted, there must always be at least one left for roles control plane and etcd
    // First ensure that at least one control plane exists... and then check from the remaining machines that at least one etcd exists
    // This isn't optimisied, there may be cases that retaining a single machine with both roles would be better than retaining two with single roles
    const [ignoredControlPlane, safeControlePlaneMachinesToDelete] = this.deleteType('isControlPlane', this.resources, cluster, isRke2);
    const [ignoredEtcd, safeMachinesToDelete] = this.deleteType('isEtcd', safeControlePlaneMachinesToDelete, cluster, isRke2);
    const ignored = [ignoredControlPlane, ignoredEtcd].filter((i) => !!i);

    return {
      cluster,
      isRke2,
      allToDelete: this.resources,
      safeMachinesToDelete,
      ignored,
      type:        this.$store.getters['type-map/labelFor'](this.resources[0].schema, this.resources.length),
      config:      {
        title:       this.t('promptRemove.title'),
        applyMode:   'delete',
        applyAction: this.remove,
      }
    };
  },

  methods: {
    deleteType(type, allToDelete, cluster, isRke2) {
      const allToDeleteByType = allToDelete.reduce((res, m) => {
        if (m[type]) {
          res.typed.push(m);
        } else {
          res.others.push(m);
        }

        return res;
      }, { typed: [], others: [] });

      const machines = isRke2 ? cluster.machines : cluster.nodes;
      const totalTypes = machines.filter((m) => m[type]).length;
      const typesToDelete = allToDeleteByType.typed.length;
      // If we're attempting to remove all control plan machines.... ignore one
      const ignoredType = totalTypes - typesToDelete === 0 ? allToDeleteByType.typed.pop() : undefined;
      const safeMachinesToDelete = [...allToDeleteByType.typed, ...allToDeleteByType.others];

      return [ignoredType, safeMachinesToDelete];
    },

    async remove() {
      if (!this.isRke2) {
        await Promise.all(this.safeMachinesToDelete.map((node) => {
          return node.norman?.doAction('scaledown');
        }));

        return;
      }

      // Group machines into pools
      const poolInfo = this.safeMachinesToDelete.reduce((res, m) => {
        res.set(m.pool, res.get(m.pool) || []);
        res.get(m.pool).push(m);

        return res;
      }, new Map());

      // Mark all machines for deletion and then scale down their pool to the new size
      const flatArray = Array.from(poolInfo.entries());

      await Promise.all(flatArray.map(([pool, machines]) => {
        return Promise
          .all(machines.map((m) => {
            m.setAnnotation(CAPI_LABELS.DELETE_MACHINE, 'true');

            return m.save();
          }))
          .then(() => pool.scalePool(-machines.length, false));
      }));

      // Pool scale info is kept in the cluster itself, so now we've made the changes we can save them
      await this.cluster.save();
    }
  }
};
</script>

<template>
  <GenericPrompt
    v-bind="config"
    @close="$emit('close')"
  >
    <template #body>
      <div class="pl-10 pr-10 mt-20 mb-20 body">
        <div v-if="allToDelete.length === 1">
          {{ t('promptRemove.attemptingToRemove', { type }) }} <b>{{ safeMachinesToDelete[0].nameDisplay }}</b>
        </div>
        <div v-else>
          {{ t('promptScaleMachineDown.attemptingToRemove', { type, count: allToDelete.length }, true) }}
        </div>
        <div
          v-if="ignored.length"
          class="retained-machine"
        >
          <span class="mb-20">{{ t('promptScaleMachineDown.retainedMachine1') }}</span>
          <span
            v-for="(i) in ignored"
            :key="i"
            v-clean-html="t('promptScaleMachineDown.retainedMachine2', { name: i.nameDisplay }, true)"
          />
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
