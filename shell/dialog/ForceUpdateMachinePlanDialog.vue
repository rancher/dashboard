<script>
import { Card } from '@components/Card';
import AsyncButton from '@shell/components/AsyncButton';
import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { escapeHtml } from '@shell/utils/string';

export default {
  name: 'ForceUpdateMachinePlanDialog',

  props: {
    resources: {
      type:     Array,
      required: true
    },
  },

  data() {
    return { loading: false, toUpdate: [] };
  },
  async fetch() {
    this.loading = true;
    const hash = {};

    hash.secrets = this.$store.dispatch('management/findAll', { type: SECRET });
    hash.rkebootstraps = this.$store.dispatch('management/findAll', { type: 'rke.cattle.io.rkebootstrap' });

    const res = await allHash(hash);

    this.toUpdate = this.resources.filter((obj) => {
      if (obj.stateObj.name === 'running') {
        return false;
      }

      const rkebootstrap = res.rkebootstraps.find((rkebootstrap) => {
        const { name, kind } = obj.spec.bootstrap.configRef || {};

        return kind === 'RKEBootstrap' && name === rkebootstrap.nameDisplay;
      });

      const machinePlanSecret = res.secrets.find((secret) => {
        return secret._type === 'rke.cattle.io/machine-plan' && secret.name === `${ rkebootstrap.name }-machine-plan` ;
      });

      obj.rkebootstrap = rkebootstrap;
      obj.machinePlanSecret = machinePlanSecret;

      return true;
    });

    this.loading = false;
  },

  computed: {
    names() {
      return this.toUpdate.map(obj => obj.nameDisplay).slice(0, 5);
    },

    plusMore() {
      const remaining = this.toUpdate.length - this.names.length;

      return this.t('promptRemove.andOthers', { count: remaining });
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async updateMachinePlanSecret(count = 0) {
      try {
        const resource = this.toUpdate[count];

        if (resource.machinePlanSecret) {
          await this.removeSecret(resource.machinePlanSecret);
        }
        await this.updateRkebootstrap(resource.rkebootstrap);

        if (count + 1 < this.toUpdate.length) {
          await this.updateMachinePlanSecret(++count);
        }
      } catch (err) {
        this.$store.dispatch('growl/fromError', { title: this.t('forceUpdateMachinePlan.error'), err }, { root: true });
      }
    },

    async confirmUpdate(buttonDone) {
      if (this.toUpdate.length) {
        await this.updateMachinePlanSecret();
      }

      buttonDone(true);
      this.close();
    },

    removeSecret(machinePlanSecret) {
      return machinePlanSecret.remove();
    },

    updateRkebootstrap(rkebootstrap) {
      rkebootstrap.metadata.annotations['rke.pandaria.io/force-update'] = ((Number(rkebootstrap.metadata.annotations['rke.pandaria.io/force-update']) || 0) + 1).toString();

      return rkebootstrap.save();
    },

    resourceNames(names, plusMore) {
      return names.reduce((res, name, i) => {
        if (i >= 5) {
          return res;
        }
        res += `<b>${ escapeHtml( name ) }</b>`;
        if (i === names.length - 1) {
          res += plusMore;
        } else {
          res += i === names.length - 2 ? this.t('generic.and') : this.t('generic.comma');
        }

        return res;
      }, '');
    }
  },
  components: {
    Card,
    AsyncButton,
  }
};
</script>
<template>
  <div ref="forceUpdateMachinePlan">
    <Card
      class="prompt-force-update-mode"
      :show-highlight-border="false"
    >
      <h4
        slot="title"
        class="text-default-text"
      >
        {{ t('promptRemove.title') }}
      </h4>
      <div
        slot="body"
        class="pr-10 pl-10"
      >
        {{ t('forceUpdateMachinePlan.attemptingToUpdate') }}
        <span
          v-clean-html="resourceNames(names, plusMore)"
        />
      </div>
      <div
        slot="actions"
        class="bottom"
      >
        <div class="buttons">
          <button
            class="mr-10 btn role-secondary"
            @click="close"
          >
            {{ t('generic.cancel') }}
          </button>
          <AsyncButton
            :disabled="loading"
            mode="update"
            @click="confirmUpdate"
          />
        </div>
      </div>
    </Card>
  </div>
</template>

<style lang="scss" scoped>
.prompt-force-update-mode {
  margin: 0;
  .bottom {
    display: block;
    width: 100%;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
}
</style>
