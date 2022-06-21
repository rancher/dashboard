<script>
import { alternateLabel } from '@shell/utils/platform';
import AsyncButton from '@shell/components/AsyncButton';
import { escapeHtml } from '@shell/utils/string';
import { Banner } from '@components/Banner';
import { Card } from '@components/Card';
import Checkbox from '~/pkg/rancher-components/src/components/Form/Checkbox/Checkbox.vue';
import { uniq } from '@shell/utils/array';

export default {
  name: 'ForcePodRemoveDialog',

  components: {
    AsyncButton,
    Banner,
    Card,
    // CopyToClipboardText,
    Checkbox
  },

  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return {
      errors:      [],
      confirmName: '',
      forceDelete: true
    };
  },

  computed: {
    names() {
      return this.resources.map(obj => obj.metadata.name);
    },

    machine() {
      return this.resources[0];
    },

    nameToMatch() {
      return this.machine.metadata.name;
    },

    protip() {
      return this.t('promptRemove.protip', { alternateLabel });
    },

    type() {
      return this.$store.getters['type-map/labelFor'](this.machine?.schema, this.resources.length);
    },

    plusMore() {
      const remaining = this.resources.length - this.names.length;

      return this.t('promptRemove.andOthers', { count: remaining });
    },

    podNames() {
      return this.names.reduce((res, name, i) => {
        if (i >= 5) {
          return res;
        }
        res += `<b>${ escapeHtml(name) }</b>`;
        if (i === this.names.length - 1) {
          res += this.plusMore;
        } else {
          res += i === this.resources.length - 2 ? ' and ' : ', ';
        }

        return res;
      }, '');
    }
  },

  methods: {
    close() {
      this.confirmName = '';
      this.errors = [];
      this.$emit('close');
    },

    async forceRemoveMachine(machine) {
      const opt = {
        url:    machine.linkFor('self'),
        method: 'delete',
        data:   {
          gracePeriodSeconds: 0,
          force:              true
        }
      };

      const res = await machine.$dispatch('request', { opt, type: machine.type } );

      if ( res?._status === 204 ) {
        // If there's no body, assume the resource was immediately deleted
        // and drop it from the store as if a remove event happened.
        return this.$dispatch('ws.resource.remove', { data: machine });
      }

      return res;
    },

    refreshSpoofedTypes(types) {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const promises = types.map(type => this.$store.dispatch(`${ inStore }/findAll`, { type, opt: { force: true } }, { root: true }));

      return Promise.all(promises);
    },

    remove(confirm) {
      if (this.doneLocation) {
        // doneLocation will recompute to undefined when delete request completes
        this.cachedDoneLocation = { ...this.doneLocation };
      }
      const serialRemove = this.resources.some(resource => resource.removeSerially);

      if (serialRemove) {
        this.serialRemove(confirm);
      } else {
        this.parallelRemove(confirm);
      }
    },

    removePod(machine) {
      if (this.forceDelete) {
        return this.forceRemoveMachine(machine);
      } else {
        return machine.remove();
      }
    },

    async serialRemove(confirm) {
      try {
        const spoofedTypes = this.getSpoofedTypes(this.resources);

        for (const resource of this.resources) {
          await this.removePod(resource);
        }

        await this.refreshSpoofedTypes(spoofedTypes);

        this.done();
      } catch (err) {
        this.error = err;
        confirm(false);
      }
    },

    getSpoofedTypes() {
      const uniqueResourceTypes = uniq(this.resources.map(resource => resource.type));

      return uniqueResourceTypes.filter(this.$store.getters['type-map/isSpoofed']);
    },

    async parallelRemove(confirm) {
      try {
        const spoofedTypes = this.getSpoofedTypes();

        await Promise.all(this.resources.map(resource => this.removePod(resource)));
        await this.refreshSpoofedTypes(spoofedTypes);
        this.done();
      } catch (err) {
        this.errors = err;
        confirm(false);
      }
    },

    done() {
      this.close();
    },
  }
};
</script>

<template>
  <Card class="prompt-remove" :show-highlight-border="false">
    <h4 slot="title" class="text-default-text">
      {{ t('promptRemove.title') }}
    </h4>
    <div slot="body" class="pl-10 pr-10">
      <div class="mb-10">
        {{ t('promptRemove.attemptingToRemove', { type }) }} <span class="machine-name" v-html="podNames" />
      </div>
      <div class="mb-20">
        <Checkbox
          v-model="forceDelete"
          :label="t('promptForceRemove.forceDelete')"
        />
      </div>

      <Banner color="warning" label-key="promptForceRemove.podRemoveWarning" />
      <Banner v-for="(error, i) in errors" :key="i" class="" color="error" :label="error" />
      <div class="text-info mt-20">
        {{ protip }}
      </div>
    </div>
    <template #actions>
      <button class="btn role-secondary mr-10" @click="close">
        {{ t('generic.cancel') }}
      </button>
      <AsyncButton mode="delete" class="btn bg-error ml-10" @click="remove" />
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  .actions {
    text-align: right;
  }

  .machine-name {
    font-weight: 600;
  }
</style>
