<script>
import Banner from '@/components/Banner';
import Loading from '@/components/Loading';
import MessageLink from '@/components/MessageLink';
import Masthead from '@/components/ResourceList/Masthead';
import ResourceTable from '@/components/ResourceTable';

import { HCI } from '@/config/types';
import { allHash } from '@/utils/promise';
import { STATE, AGE, NAME, NAMESPACE } from '@/config/table-headers';

export default {
  name:       'HarvesterListBackup',
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
      vms:      this.$store.dispatch('harvester/findAll', { type: HCI.VM }),
      settings: this.$store.dispatch('harvester/findAll', { type: HCI.SETTING }),
      rows:     this.$store.dispatch('harvester/findAll', { type: HCI.BACKUP }),
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
      return [
        STATE,
        NAME,
        NAMESPACE,
        {
          name:      'targetVM',
          labelKey:  'tableHeaders.targetVm',
          value:     'attachVM',
          align:     'left',
          formatter: 'AttachVMWithName'
        },
        {
          name:      'backupTarget',
          labelKey:  'tableHeaders.backupTarget',
          value:     'backupTarget',
          align:     'left',
          formatter: 'BackupTargetValidation'
        },
        {
          name:     'readyToUse',
          labelKey:  'tableHeaders.readyToUse',
          value:    'status.readyToUse',
          align:    'left',
        },
        AGE
      ];
    },

    backupTargetResource() {
      return this.settings.find( O => O.id === 'backup-target');
    },

    isEmptyValue() {
      return this.backupTargetResource.backupTagetetIsEmpty;
    },

    canUpdate() {
      return this?.backupTargetResource?.canUpdate;
    },

    errorMessage() {
      return this.backupTargetResource?.errMessage;
    },
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
      v-if="(errorMessage || isEmptyValue) && canUpdate"
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

    <Banner
      v-else-if="canUpdate"
      color="info"
    >
      <MessageLink
        :to="to"
        prefix-label="harvester.backup.message.viewSetting.prefix"
        middle-label="harvester.backup.message.viewSetting.middle"
        suffic-label="harvester.backup.message.viewSetting.suffic"
      />
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
