<script>
import { MANAGEMENT } from '@shell/config/types';
import GenericPrompt from './GenericPrompt';

export default {
  components: { GenericPrompt },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  async fetch() {
    await Promise.all([
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL }),
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE })
    ]);
  },

  data() {
    const allToDelete = Array.isArray(this.resources) ? this.resources : [this.resources];
    const cluster = allToDelete[0].provisioningCluster;

    // Not all machines can be deleted, there must always be at least one left for roles control plane and etcd
    // First ensure that at least one control plane exists... and then check from the remaining machines that at least one etcd exists
    // This isn't optimisied, there may be cases that retaining a single machine with both roles would be better than retaining two with single roles
    const [ignoredControlPlane, safeControlePlaneMachinesToDelete] = this.deleteType('isControlPlane', allToDelete, cluster);

    const [ignoredEtcd, safeMachinesToDelete] = this.deleteType('isEtcd', safeControlePlaneMachinesToDelete, cluster);
    const ignored = [ignoredControlPlane, ignoredEtcd].filter((i) => !!i);

    return {
      cluster,
      allToDelete,
      safeMachinesToDelete,
      ignored,
      type:   this.$store.getters['type-map/labelFor'](allToDelete[0].schema, allToDelete.length),
      config: {
        title:       this.t('promptRemove.title'),
        applyMode:   'delete',
        applyAction: this.remove,
      }
    };
  },

  methods: {
    deleteType(type, allToDelete, cluster) {
      const allToDeleteByType = allToDelete.reduce((res, m) => {
        if (m[type]) {
          res.typed.push(m);
        } else {
          res.others.push(m);
        }

        return res;
      }, { typed: [], others: [] });

      const totalTypes = cluster.nodes.filter((m) => m[type]).length;
      const typesToDelete = allToDeleteByType.typed.length;
      // If we're attempting to remove all control plan machines.... ignore one
      const ignoredType = totalTypes - typesToDelete === 0 ? allToDeleteByType.typed.pop() : undefined;
      const safeMachinesToDelete = [...allToDeleteByType.typed, ...allToDeleteByType.others];

      return [ignoredType, safeMachinesToDelete];
    },

    async remove() {
      await Promise.all(this.safeMachinesToDelete.map((node) => {
        return node.norman?.doAction('scaledown');
      }));
    }
  }
};
</script>

<template>
  <GenericPrompt
    v-bind="config"
    @close="$emit('close')"
  >
    <template slot="body">
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
            v-for="i in ignored"
            :key="i.name"
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
