<script>
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';
import { mapGetters } from 'vuex';

import { labelForAddon } from '@shell/utils/cluster';
import { resourceNames } from '@shell/utils/string';

export default {
  emits: ['close'],

  components: {
    Card,
    AsyncButton,
  },
  props: {
    resources: {
      type:     Array,
      required: true
    },
    registerBackgroundClosing: {
      type:     Function,
      required: true
    },
    /**
     * The names of the addons that have configuration conflicts.
     */
    addonNames: {
      type:    Array,
      default: () => []
    },
    /**
     * The Kubernetes version the user is upgrading from.
     */
    previousKubeVersion: {
      type:    String,
      default: ''
    },
    /**
     * The Kubernetes version the user is upgrading to.
     */
    newKubeVersion: {
      type:    String,
      default: ''
    }
  },
  created() {
    this.registerBackgroundClosing(this.closing);
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    formattedAddons() {
      if (!this.addonNames || this.addonNames.length === 0) {
        return '';
      }

      const translatedNames = this.addonNames.map((name) => labelForAddon(this.$store, name, true));

      return resourceNames(translatedNames, null, this.t, false);
    }
  },
  methods: {
    continue(value) {
      if (this.resources[0]) {
        this.resources[0](value);
        delete this.resources[0];
        this.$emit('close');
      }
    },

    close() {
      this.continue(false);
    },

    closing() {
      this.continue(false);
    },

    apply(buttonDone) {
      this.continue(true);
    }
  }
};
</script>

<template>
  <Card
    class="prompt-restore"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ t('addonConfigConfirmation.title') }}
      </h4>
    </template>

    <template #body>
      <slot name="body">
        <span
          v-clean-html="t('addonConfigConfirmation.body', {
            addons: formattedAddons,
            previousKubeVersion,
            newKubeVersion
          }, true)"
        />
      </slot>
    </template>

    <template #actions>
      <div class="bottom">
        <div class="buttons">
          <button
            type="button"
            class="btn role-secondary mr-10"
            @click="close"
          >
            {{ t('generic.cancel') }}
          </button>
          <AsyncButton
            mode="continue"
            @click="apply"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
<style lang='scss' scoped>
.prompt-restore {
  margin: 0;
}

.bottom {
  display: flex;
  flex-direction: column;
  flex: 1;

  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
}
</style>
