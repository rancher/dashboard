<script>
import AsyncButton from '@shell/components/AsyncButton';
import { Card } from '@components/Card';

export default {
  emits: ['close'],

  components: {
    Card,
    AsyncButton,
  },
  props: {
    warnings: {
      type:    Array,
      default: () => []
    },

    isK3s: {
      type:    Boolean,
      default: false
    },

    /**
     * Callback to identify response of the prompt
     */
    confirm: {
      type:    Function,
      default: () => { }
    },

  },

  methods: {
    close() {
      this.confirm(false);
      this.$emit('close');
    },

    async apply(buttonDone) {
      this.applyErrors = [];
      try {
        this.confirm(true);
        this.$emit('close');
      } catch (err) {
        console.error(err); // eslint-disable-line
        buttonDone(false);
      }
    }
  },
};
</script>

<template>
  <Card
    class="prompt-restore"
    :show-highlight-border="false"
    data-testid="ipv6-dialog"
  >
    <template #title>
      <h4
        v-clean-html="t('cluster.rke2.modal.ipv6Warning.title')"
        class="text-default-text"
      />
    </template>

    <template #body>
      <div
        class="pl-10 pr-10"
        style="min-height: 50px;"
      >
        <t
          k="cluster.rke2.modal.ipv6Warning.body"
          raw
        />
        <t
          :k="isK3s ? 'cluster.rke2.modal.ipv6Warning.readMoreK3s' : 'cluster.rke2.modal.ipv6Warning.readMoreRke2'"
          raw
        />
        <div class="list-pretext">
          <t
            k="cluster.rke2.modal.ipv6Warning.verifySettings"
            raw
          />
        </div>
        <ul
          data-testid="ipv6-dialog-reasons"
          class="warning-list"
        >
          <li
            v-for="warning in warnings"
            :key="warning"
          >
            <t
              :k="warning"
              raw
            />
          </li>
        </ul>
      </div>
    </template>

    <template #actions>
      <div class="bottom">
        <div

          class="buttons"
        >
          <button
            data-testid="ipv6-dialog-cancel"
            class="btn role-secondary mr-10"
            @click="close"
          >
            {{ t('generic.cancel') }}
          </button>

          <AsyncButton
            data-testid="ipv6-dialog-continue"
            mode="continue"
            action-color="role-primary"
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
    .banner {
      margin-top: 0
    }
    .buttons {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }
  }

.list-pretext {
    margin-top: 16px;
}

.warning-list {
    padding-inline-start: 24px;

    & li {
        margin-bottom: 8px;
    }
}
</style>
