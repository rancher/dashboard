<script>
import { get } from '@/utils/object';
import { CERTMANAGER, DESCRIPTION } from '@/config/labels-annotations';
import { DOCKER_JSON } from '@/models/secret';
import DetailTop from '@/components/DetailTop';
import SortableTable from '@/components/SortableTable';
import { KEY, VALUE } from '@/config/table-headers';
import { base64Decode } from '@/utils/crypto';
import CreateEditView from '@/mixins/create-edit-view';
import ResourceTabs from '@/components/form/ResourceTabs';

export default {
  components: {
    DetailTop,
    SortableTable,
    ResourceTabs
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
    dockerJSON() {
      return DOCKER_JSON;
    },

    dockerRows() {
      const auths = JSON.parse(this.dataRows[0].value).auths;
      const rows = [];

      for (const address in auths) {
        rows.push({
          address,
          username: auths[address].username,
          password: auths[address].password
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
          formatter: 'ExternalLink'
        },
        {
          name:  'username',
          label: 'Username',
          value: 'username',
        }
      ];

      return headers;
    },

    issuer() {
      const { metadata:{ annotations = {} } } = this.value;

      return annotations[CERTMANAGER.ISSUER];
    },
    description() {
      const { metadata:{ annotations = {} } } = this.value;

      return annotations[DESCRIPTION];
    },
    detailTopColumns() {
      const columns = [
        {
          title:   'Description',
          content: this.description
        },
        {
          title:   'Namespace',
          content: get(this.value, 'metadata.namespace')
        },
        {
          title:   'Type',
          content: this.value.typeDisplay
        }
      ];

      if (this.issuer) {
        columns.push({
          title:   'Issuer',
          content: this.issuer
        });
      }

      return columns;
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
  },
};
</script>

<template>
  <div>
    <DetailTop :columns="detailTopColumns" />
    <template v-if="value.secretType===dockerJSON">
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
    <template v-else>
      <div class="mt-20 mb-20">
        <h4>Data</h4>
        <SortableTable
          class="mt-20"
          :rows="dataRows"
          :headers="dataHeaders"
          key-field="value"
          :search="false"
          :row-actions="false"
          :table-actions="false"
        />
      </div>
    </template>
    <ResourceTabs v-model="value" :mode="mode" />
  </div>
</template>
