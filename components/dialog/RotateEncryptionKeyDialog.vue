<script>
import AsyncButton from '@/components/AsyncButton';
import Card from '@/components/Card';
import Banner from '@/components/Banner';
import { exceptionToErrorsArray } from '@/utils/error';
import { NORMAN } from '@/config/types';
import { sortBy } from '@/utils/sort';
import day from 'dayjs';
import { escapeHtml } from '@/utils/string';
import { DATE_FORMAT, TIME_FORMAT } from '@/store/prefs';
import { set } from '@/utils/object';

export default {
  components: {
    Card,
    AsyncButton,
    Banner,
  },

  props:      {
    resources: {
      type:     Array,
      required: true
    }
  },

  async fetch() {
    const c = this.cluster;

    let etcdBackups = [];

    if ( c.isRke1 && this.$store.getters['isRancher'] ) {
      etcdBackups = await this.$store.dispatch('rancher/findAll', { type: NORMAN.ETCD_BACKUP });
      etcdBackups = etcdBackups.filter(backup => backup.clusterId === c.metadata.name);
    }

    if (c.isRke2 && this.$store.getters['isRancher']) {
      etcdBackups = c.etcdSnapshots;
      etcdBackups = etcdBackups.filter(backup => backup.clusterId === c.id);
    }

    const backups = sortBy(etcdBackups, ['created']).reverse();
    const dateFormat = escapeHtml(this.$store.getters['prefs/get'](DATE_FORMAT));
    const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

    if (backups.length > 0) {
      const name = backups[0].id.split(':');
      const d = day(backups[0].created).format(dateFormat);
      const t = day(backups[0].created).format(timeFormat);

      this.latestBackup = {
        name: name[0],
        date: `${ d } ${ t }`,
      };
    }
  },

  data() {
    return { errors: [], latestBackup: null };
  },

  computed: {
    cluster() {
      return this.resources?.[0];
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async apply(buttonDone) {
      const isRke2 = this.cluster.isRke2;

      try {
        if (isRke2) {
          const currentGeneration = this.cluster.spec?.rkeConfig?.rotateCertificates?.generation || 0;

          // To rotate the encryption keys, increment
          // rkeConfig.rotateEncyrptionKeys.generation in the YAML.
          set(this.cluster, 'spec.rkeConfig', { rotateEncryptionKeys: { generation: currentGeneration + 1 } });
          await this.cluster.save();
        } else {
          await this.cluster.mgmt.doAction('rotateEncryptionKey');
        }
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
  <Card class="prompt-rotate" :show-highlight-border="false">
    <h4 slot="title" class="text-default-text" v-html="t('promptRotateEncryptionKey.title')" />

    <div slot="body" class="pl-10 pr-10">
      <Banner color="warning" label-key="promptRotateEncryptionKey.warning" />

      <div v-if="!$fetchState.pending">
        <p v-if="latestBackup" class="pt-10 pb-10">
          {{ t('promptRotateEncryptionKey.description', latestBackup, true) }}
        </p>
        <Banner v-else color="error" label-key="promptRotateEncryptionKey.error" />
      </div>
    </div>

    <div slot="actions" class="buttons">
      <button class="btn role-secondary mr-10" @click="close">
        {{ t('generic.cancel') }}
      </button>

      <AsyncButton
        mode="rotate"
        :disabled="$fetchState.pending || !latestBackup"
        @click="apply"
      />

      <Banner v-for="(err, i) in errors" :key="i" color="error" :label="err" />
    </div>
  </Card>
</template>
<style lang='scss' scoped>
  .prompt-rotate {
    margin: 0;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
</style>
