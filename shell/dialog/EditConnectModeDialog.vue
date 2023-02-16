<template>
  <div ref="connectModeModal">
    <Card
      v-show="!showConfirm"
      class="prompt-cluster-connect-mode"
      :show-highlight-border="false"
    >
      <h4
        slot="title"
        class="text-default-text"
      >
        {{ t('clusterConnectMode.connectMode.label') }}
      </h4>
      <div
        v-if="connectModeLoading"
        slot="body"
      />
      <div
        v-else
        slot="body"
        class="pr-10 pl-10"
        style="min-height: 300px;"
      >
        <div class="mb-20 row">
          <div class="col span-6">
            <LabeledSelect
              v-model="mode.directAccess"
              :label="t('clusterConnectMode.connectMode.label')"
              :localized-label="true"
              :options="connectModes"
              :append-to-body="false"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-12">
            <ApiEndpoints
              v-model="mode.apiEndpoints"
              :title="t('clusterConnectMode.apiEndpoint.label')"
              mode="edit"
              :status-map="statusMap"
            />
          </div>
        </div>
      </div>
      <div
        slot="actions"
        class="bottom"
      >
        <Banner
          v-for="(err, i) in errors"
          :key="i"
          color="error"
          :label="err"
        />
        <div class="buttons">
          <button
            class="mr-10 btn role-secondary"
            @click="close"
          >
            {{ t('generic.cancel') }}
          </button>
          <AsyncButton
            class="mr-10"
            :action-label="t('clusterConnectMode.testConnect.label')"
            :waiting-label="t('clusterConnectMode.testConnect.label')"
            :success-label="t('clusterConnectMode.testConnect.label')"
            :disabled="loading || connectModeLoading"
            @click="validate"
          />
          <AsyncButton
            :disabled="loading || connectModeLoading"
            @click="confirmSave"
          />
        </div>
      </div>
    </Card>
    <modal
      class="confirm-modal"
      name="confirm-save"
      :width="350"
      height="auto"
      :click-to-close="false"
    >
      <Card
        class="prompt-cluster-connect-mode"
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
          {{ t('clusterConnectMode.actions.restartConfirm', { name: cluster.metadata.name}) }}
        </div>
        <div
          slot="actions"
          class="bottom"
        >
          <div class="buttons">
            <button
              class="mr-10 btn role-secondary"
              @click="confirm(false)"
            >
              {{ t('generic.cancel') }}
            </button>
            <button
              class="btn role-primary"
              @click="confirm(true)"
            >
              {{ t('clusterConnectMode.actions.yes') }}
            </button>
          </div>
        </div>
      </Card>
    </modal>
  </div>
</template>

<script>
import { Card } from '@components/Card';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ApiEndpoints from '@shell/components/form/ApiEndpoints.vue';
import { stringify } from '@shell/utils/error';

export default {
  props: {
    resources: {
      type:     Array,
      required: true
    },
  },

  data() {
    return {
      mode:         {},
      connectModes: [
        {
          label: 'Tunnel',
          value: 'false',
        }, {
          label: 'Tunnel & Direct',
          value: 'true',
        }
      ],
      loading:     false,
      testSuccess: false,
      errors:      [],

      connectModeLoading: true,
      showConfirm:        false,
      statusMap:          {},
    };
  },
  async fetch() {
    this.connectModeLoading = true;
    try {
      const connectMode = await this.$store.dispatch('rancher/request', {
        url:    `/v3/clusters/${ this.cluster?.id }?action=viewConnectionConfig`,
        method: 'post',
      });

      if (!connectMode.apiEndpoints) {
        connectMode.apiEndpoints = [];
      }
      this.mode = connectMode;
      this.updateStatusMap(connectMode.apiEndpoints || [], connectMode.endpointStatus || [] );
    } catch (err) {
      this.errors = [stringify(err)];
    }
    this.connectModeLoading = false;
  },
  computed: {
    cluster() {
      return this.resources[0];
    },
  },
  methods: {
    confirm(result) {
      if (!result) {
        this.buttonDone(false);
        this.$modal.hide('confirm-save');
        this.close();

        return;
      }
      this.save(this.buttonDone);
    },
    close() {
      this.$emit('close');
    },
    confirmSave(buttonDone) {
      this.$modal.show('confirm-save');
      this.buttonDone = buttonDone;
      this.showConfirm = true;
      this.$nextTick(() => {
        this.$refs.connectModeModal?.parentElement?.style?.setProperty('--prompt-modal-width', '350px');
      });
    },
    async save(buttonDone) {
      this.loading = true;
      try {
        await this.$store.dispatch('rancher/request', {
          url:    `/v3/clusters/${ this.cluster?.id }?action=editConnectionConfig`,
          method: 'post',
          data:   this.mode,
        });
        await this.$store.dispatch('rancher/request', {
          url:    `/mcm/restart/${ this.cluster?.id }`,
          method: 'get',
        });
        buttonDone(true);
        this.close();
      } catch (err) {
        buttonDone(false);
        this.errors = [stringify(err)];
      }
      this.loading = false;
    },
    async validate(buttonDone) {
      this.errors = [];
      const d = this.mode?.apiEndpoints || [];

      if (d.length === 0 || d.some(s => !s.trim())) {
        this.errors = [this.t('clusterConnectMode.apiEndpoint.required')];
        buttonDone(false);

        return;
      }

      this.loading = true;
      const apiEndpoints = [...(this.mode.apiEndpoints || [])];

      try {
        const { endpointStatus = [] } = await this.$store.dispatch('rancher/request', {
          url:    `/v3/clusters/${ this.cluster?.id }?action=validateConnectionConfig`,
          method: 'post',
          data:   this.mode,
        });

        if (endpointStatus.some(s => !s.status)) {
          this.errors = [...new Set(endpointStatus.filter(s => !s.status).map(s => s.error))];
          this.testSuccess = false;
          buttonDone(false);
        } else {
          this.testSuccess = true;
          buttonDone(true);
        }
        this.updateStatusMap(apiEndpoints || [], endpointStatus || []);
      } catch (err) {
        this.errors = [stringify(err)];
        this.testSuccess = false;
        buttonDone(false);
      }
      this.loading = false;
    },
    updateStatusMap(apiEndpoints = [], endpointStatus = []) {
      this.statusMap = endpointStatus.reduce((t, c, i) => {
        t[apiEndpoints[i]] = c;

        return t;
      }, {});
    }
  },
  components: {
    Card,
    AsyncButton,
    Banner,
    LabeledSelect,
    ApiEndpoints,
  }
};
</script>
<style lang="scss" scoped>
.prompt-cluster-connect-mode {
  margin: 0;
  .bottom {
    display: block;
    width: 100%;
  }
  .banner {
    margin-top: 0
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
}
</style>
