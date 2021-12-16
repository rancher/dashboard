<script>
import { mapState, mapGetters } from 'vuex';
import AsyncButton from '@/components/AsyncButton';
import Card from '@/components/Card';
import Banner from '@/components/Banner';
import Date from '@/components/formatter/Date.vue';
import RadioGroup from '@/components/form/RadioGroup.vue';
import LabeledSelect from '@/components/form/LabeledSelect.vue';
import { exceptionToErrorsArray } from '@/utils/error';
import { CAPI, NORMAN } from '@/config/types';
import { set } from '@/utils/object';
import SelectOrCreateAuthSecret from '@/components/form/SelectOrCreateAuthSecret';
import ChildHook, { BEFORE_SAVE_HOOKS } from '@/mixins/child-hook';

export default {
  components: {
    Card,
    AsyncButton,
    Banner,
    Date,
    LabeledSelect,
    RadioGroup,
    SelectOrCreateAuthSecret,
  },

  name: 'PromptRestore',

  mixins: [
    ChildHook,
  ],

  data() {
    return {
      errors:              [],
      labels:              {},
      restoreMode:         'all',
      moveTo:              this.workspace,
      loaded:              false,
      allWorkspaces:       [],
      cloudCredentialName: null,
      allSnapshots:        [],
      selectedSnapshot:    null,
    };
  },

  mounted() {
    const cluster = this.$store.getters['management/byId'](CAPI.RANCHER_CLUSTER, this.snapshot?.clusterId);

    this.cloudCredentialName = cluster?.spec?.rkeConfig?.etcd?.s3?.cloudCredentialName;
  },

  computed:   {
    ...mapState('action-menu', ['showPromptRestore', 'toRestore']),
    ...mapGetters({ t: 'i18n/t' }),
    ...mapGetters(['currentCluster']),

    isCluster() {
      return this.toRestore[0]?.type.toLowerCase() !== NORMAN.ETCD_BACKUP;
    },

    snapshot() {
      return !this.isCluster ? this.toRestore[0] : this.allSnapshots[this.selectedSnapshot];
    },

    hasSnapshot() {
      return !!this.snapshot;
    },

    isRke2() {
      return !!this.snapshot?.rke2;
    },

    clusterSnapshots() {
      // We use the cluster name
      // to filter out irrelevant snapshots
      // because the name matches the clusterId field on the
      // snapshot, but the cluster ID doesn't.
      if (this.allSnapshots) {
        const list = Object.values(this.allSnapshots)
          .filter(snapshot => snapshot.clusterId === this.toRestore[0]?.metadata?.name)
          .map(snapshot => ({ label: snapshot.name, value: snapshot.name }));

        return list;
      } else {
        return [];
      }
    },
  },

  watch: {
    showPromptRestore(show) {
      if (show) {
        this.loaded = true;
        this.$modal.show('promptRestore');
        this.fetchSnapshots();
      } else {
        this.loaded = false;
        this.$modal.hide('promptRestore');
      }
    }
  },

  methods: {
    close() {
      this.errors = [];
      this.labels = {};
      this.$store.commit('action-menu/togglePromptRestore');
      this.selectedSnapshot = null;
    },

    async fetchSnapshots() {
      // Get all snapshots because this
      // component is loaded before the user
      // has selected a cluster to restore
      await this.$store.dispatch('rancher/findAll', { type: NORMAN.ETCD_BACKUP })
        .then((allSnapshots) => {
          this.allSnapshots = allSnapshots.reduce((v, s) => {
            v[s.name] = s;

            return v;
          }, {});

          return allSnapshots;
        })
        .catch((err) => {
          console.error(err); // eslint-disable-line no-console
        });
    },

    async apply(buttonDone) {
      try {
        if ( this.isRke2 ) {
          const cluster = this.$store.getters['management/byId'](CAPI.RANCHER_CLUSTER, this.snapshot.clusterId);

          await this.applyHooks(BEFORE_SAVE_HOOKS);

          const now = cluster.spec?.rkeConfig?.etcdSnapshotRestore?.generation || 0;

          let s3; //  = undefined;

          if ( this.snapshot.s3 ) {
            s3 = {
              ...this.snapshot.s3,
              cloudCredentialName: this.cloudCredentialName
            };
          }

          set(cluster, 'spec.rkeConfig.etcdSnapshotRestore', {
            generation: now + 1,
            createdAt:  this.snapshot.createdAt,
            name:       this.snapshot.name,
            size:       this.snapshot.size,
            nodeName:   this.snapshot.nodeName,
            s3,
          });

          await cluster.save();
        } else {
          await this.$store.dispatch('rancher/request', {
            url:           `/v3/clusters/${ escape(this.snapshot.clusterId) }?action=restoreFromEtcdBackup`,
            method:        'post',
            data:   {
              etcdBackupId:     this.snapshot.id,
              restoreRkeConfig: this.restoreMode,
            },
          });
        }

        this.$store.dispatch('growl/success', {
          title:   this.t('promptRestore.notification.title'),
          message: this.t('promptRestore.notification.message', { selectedSnapshot: this.selectedSnapshot })
        }, { root: true });

        buttonDone(true);
        this.close();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    }
  }
};
</script>

<template>
  <modal
    class="promptrestore-modal"
    name="promptRestore"
    styles="background-color: var(--nav-bg); border-radius: var(--border-radius); max-height: 100vh;"
    height="auto"
    :scrollable="true"
  >
    <Card v-if="loaded" class="prompt-restore" :show-highlight-border="false">
      <h4 slot="title" class="text-default-text" v-html="t('promptRestore.title', null, true)" />

      <div slot="body" class="pl-10 pr-10">
        <form>
          <h3 v-t="'promptRestore.name'"></h3>
          <div v-if="!isCluster">
            {{ snapshot.name }}
          </div>

          <LabeledSelect
            v-if="isCluster"
            v-model="selectedSnapshot"
            :label="t('promptRestore.label')"
            :placeholder="t('promptRestore.placeholder')"
            :options="clusterSnapshots"
          />

          <div class="spacer" />

          <h3 v-t="'promptRestore.date'"></h3>
          <div>
            <p>
              <Date v-if="snapshot" :value="snapshot.createdAt || snapshot.created" />
            </p>
          </div>
          <div class="spacer" />

          <template v-if="isRke2">
            <template v-if="snapshot.s3">
              <h3 v-t="'promptRestore.fromS3'"></h3>
              <SelectOrCreateAuthSecret
                ref="selectOrCreate"
                v-model="cloudCredentialName"
                in-store="management"
                generate-name="etcd-restore-s3-"
                :allow-ssh="false"
                :allow-basic="false"
                :allow-s3="true"
                :namespace="false"
                :vertical="true"
                :register-before-hook="registerBeforeHook"
              />
            </template>
          </template>
          <template v-else>
            <RadioGroup
              v-model="restoreMode"
              name="restoreMode"
              label="Restore Type"
              :labels="['Only etcd', 'Kubernetes version and etcd', 'Cluster config, Kubernetes version and etcd']"
              :options="['etcd', 'kubernetesVersion', 'all']"
            />
          </template>
        </form>
      </div>

      <div slot="actions">
        <button class="btn role-secondary" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          mode="restore"
          :disabled="!hasSnapshot"
          @click="apply"
        />

        <Banner v-for="(err, i) in errors" :key="i" color="error" :label="err" />
      </div>
    </Card>
  </modal>
</template>

<style lang='scss' scoped>
  .promptrestore-modal {
    border-radius: var(--border-radius);
    overflow: scroll;
    max-height: 100vh;
    & ::-webkit-scrollbar-corner {
      background: rgba(0,0,0,0);
    }

    .prompt-restore form p {
      min-height: 16px;
    }

    ::v-deep .card-container .card-actions {
      display: block;

      button:not(:last-child) {
        margin-right: 10px;
      }

      .banner {
        display: flex;
      }
    }
  }
</style>
