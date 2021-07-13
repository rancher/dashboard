<script>
import Banner from '@/components/Banner';
import Loading from '@/components/Loading';
import ResourceTable from '@/components/ResourceTable';
import Masthead from '@/components/ResourceList/Masthead';
import MessageLink from '@/components/MessageLink';

import { HCI } from '@/config/types';
import { allHash } from '@/utils/promise';
import {
  STATE, AGE, NAME, NAMESPACE, TARGET_VM, BACKUP_TARGET, READY_TO_USE
} from '@/config/table-headers';

export default {
  name:       'ListBackup',
  components: {
    ResourceTable, Banner, Loading, Masthead, MessageLink
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    }
  },

  async fetch() {
    const hash = await allHash({
      settings: this.$store.dispatch('virtual/findAll', { type: HCI.SETTING }),
      rows:     this.$store.dispatch('virtual/findAll', { type: HCI.BACKUP }),
    });

    this.rows = hash.rows;
    this.settings = hash.settings;
  },

  data() {
    const params = { ...this.$route.params };

    const resource = params.resource;

    return {
      rows:     [],
      settings: [],
      resource,
      to:       `${ HCI.SETTING }/backup-target?mode=edit`
    };
  },

  computed: {
    headers() {
      return [STATE, NAME, NAMESPACE, TARGET_VM, BACKUP_TARGET, READY_TO_USE, AGE];
    },

    backupTargetResource() {
      return this.settings.find( O => O.id === 'backup-target');
    },

    isEmptyValue() {
      return this.backupTargetResource.backupTagetetIsEmpty;
    },

    errorMessage() {
      return this.backupTargetResource?.errMessage;
    },
  },

  watch: {
    errorMessage: {
      handler(neu) {
        const setting = !!neu ? '' : this.to;

        this.$store.commit('cluster/setConfig', { // Provide a shortcut link, when the configuration is correct
          type: this.resource,
          data: { setting }
        });
      },
      immediate: true
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <Masthead
      :schema="schema"
      :resource="resource"
      :create-button-label="t('harvester.backup.createText')"
    />

    <Banner
      v-if="errorMessage || isEmptyValue"
      color="error"
    >
      <MessageLink
        v-if="isEmptyValue"
        :to="to"
        prefix-label="harvester.backup.message.noSetting.prefix"
        middle-label="harvester.backup.message.noSetting.middle"
        suffic-label="harvester.backup.message.noSetting.suffic"
      />

      <MessageLink
        v-else
        :to="to"
        prefix-label="harvester.backup.message.errorTip.prefix"
        middle-label="harvester.backup.message.errorTip.middle"
      >
        <template v-slot:suffic>
          {{ t('harvester.backup.message.errorTip.suffic') }} {{ errorMessage }}
        </template>
      </MessageLink>
    </Banner>

    <ResourceTable
      v-bind="$attrs"
      :headers="headers"
      :groupable="true"
      :rows="rows"
      :schema="schema"
      key-field="_key"
      default-sort-by="age"
      v-on="$listeners"
    />
  </div>
</template>
