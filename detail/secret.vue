<script>
import SortableTable from '@/components/SortableTable';
import { KEY, VALUE } from '@/config/table-headers';
import { base64Decode } from '@/utils/crypto';
import CreateEditView from '@/mixins/create-edit-view';
import ResourceTabs from '@/components/form/ResourceTabs';
import KeyValue from '@/components/form/KeyValue';

export default {
  components: {
    SortableTable,
    ResourceTabs,
    KeyValue,
  },
  mixins:     [CreateEditView],
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    return { relatedServices: [] };
  },
  computed:   {
    dockerRows() {
      const auths = JSON.parse(this.dataRows[0].value).auths;
      const rows = [];

      for (const address in auths) {
        rows.push({
          address,
          username: auths[address].username,
        });
      }

      return rows;
    },

    dockerHeaders() {
      const headers = [
        {
          name:      'address',
          label:     'Address',
          value:     'address',
        },
        {
          name:  'username',
          label: 'Username',
          value: 'username',
        }
      ];

      return headers;
    },

    dataRows() {
      const rows = [];
      const { data = {} } = this.value;

      Object.keys(data).forEach((key) => {
        const value = base64Decode(data[key]);

        rows.push({
          key,
          value
        });
      });

      return rows;
    },

    dataHeaders() {
      return [KEY, VALUE];
    },

    certRows() {
      let { 'tls.key':key, 'tls.crt': crt } = this.value.data;

      key = base64Decode(key);
      crt = base64Decode(crt);

      return [{ key, crt }];
    },

    certHeaders() {
      return [
        {
          name:      'privateKey',
          label:     'Private Key',
          value:     'key',
          formatter: 'VerticalScroll'
        },
        {
          name:      'cert',
          label:     'CA Certificate',
          value:     'crt',
          formatter: 'VerticalScroll'
        }
      ];
    }
  },
};
</script>

<template>
  <div>
    <template v-if="value.isRegistry">
      <SortableTable
        class="mt-20"
        key-field="address"
        :rows="dockerRows"
        :headers="dockerHeaders"
        :search="false"
        :table-actions="false"
        :row-actions="false"
      />
    </template>
    <template v-else-if="value.isCertificate">
      <SortableTable
        class="mt-20"
        key-field="value"
        :rows="certRows"
        :headers="certHeaders"
        :search="false"
        :table-actions="false"
        :row-actions="false"
      />
    </template>
    <template v-else>
      <div class="spacer"></div>
      <div>
        <KeyValue :title="t('secret.data')" :value="dataRows" mode="view" :as-map="false" :value-multiline="true" />
      </div>
      <div class="spacer"></div>
    </template>
    <ResourceTabs v-model="value" :mode="mode" />
  </div>
</template>
