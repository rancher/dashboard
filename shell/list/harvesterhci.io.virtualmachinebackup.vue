<script>
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import MessageLink from '@shell/components/MessageLink';
import Masthead from '@shell/components/ResourceList/Masthead';
import ResourceTable from '@shell/components/ResourceTable';

import { HCI } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { STATE, AGE, NAME, NAMESPACE } from '@shell/config/table-headers';

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
          formatter: 'HarvesterBackupTargetValidation'
        },
        {
          name:      'readyToUse',
          labelKey:  'tableHeaders.readyToUse',
          value:     'status.readyToUse',
          align:     'left',
          formatter: 'Checked',
        },
        AGE
      ];
    },

    backupTargetResource() {
      return this.settings.find( O => O.id === 'backup-target');
    },

    isEmptyValue() {
      return this.backupTargetResource.backupTargetIsEmpty;
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
        suffix-label="harvester.backup.message.noSetting.suffix"
      />

      <MessageLink
        v-else
        :to="to"
        prefix-label="harvester.backup.message.errorTip.prefix"
        middle-label="harvester.backup.message.errorTip.middle"
      >
        <template v-slot:suffix>
          {{ t('harvester.backup.message.errorTip.suffix') }} {{ errorMessage }}
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
        suffix-label="harvester.backup.message.viewSetting.suffix"
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
    >
      <template #col:name="{row}">
        <td>
          <span>
            <n-link
              v-if="row.status && row.status.source"
              :to="row.detailLocation"
            >
              {{ row.nameDisplay }}
            </n-link>
            <span v-else>
              {{ row.nameDisplay }}
            </span>
          </span>
        </td>
      </template>
    </resourcetable>
  </div>
  </div>
</template>
