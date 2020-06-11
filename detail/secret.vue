<script>
import { CERTMANAGER, DESCRIPTION } from '@/config/labels-annotations';
import { DOCKER_JSON, TLS } from '@/models/secret';
import DetailTop from '@/components/DetailTop';
import SortableTable from '@/components/SortableTable';
import { KEY, VALUE } from '@/config/table-headers';
import { base64Decode } from '@/utils/crypto';
import CreateEditView from '@/mixins/create-edit-view';
import ResourceTabs from '@/components/form/ResourceTabs';
import KeyValue from '@/components/form/KeyValue';
import Date from '@/components/formatter/Date';

export default {
  components: {
    DetailTop,
    SortableTable,
    ResourceTabs,
    KeyValue,
    Date
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

    isCertificate() {
      return this.value._type === TLS;
    },

    isRegistry() {
      return this.value._type === DOCKER_JSON;
    },
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

    issuer() {
      const { metadata:{ annotations = {} } } = this.value;

      if (annotations[CERTMANAGER.ISSUER]) {
        return annotations[CERTMANAGER.ISSUER];
      } else if (this.isCertificate) {
        return this.value.certInfo?.issuer;
      } else {
        return null;
      }
    },

    notAfter() {
      if (this.isCertificate) {
        return this.value.certInfo?.notAfter;
      } else {
        return null;
      }
    },

    cn() {
      if (this.isCertificate) {
        return this.value.certInfo.cn;
      }

      return null;
    },

    // show plus n more for cert names
    plusMoreNames() {
      if (this.isCertificate) {
        return this.value.unrepeatedSans.length;
      }

      return null;
    },

    // use text-warning' or 'text-error' if cert is expiring within 8 days or is expired
    dateClass() {
      if (this.isCertificate) {
        const eightDays = 691200000;

        if (this.value.timeTilExpiration > eightDays ) {
          return '';
        } else if (this.value.timeTilExpiration > 0) {
          return 'text-warning';
        } else {
          return 'text-error';
        }
      }

      return null;
    },

    description() {
      const { metadata:{ annotations = {} } } = this.value;

      return annotations[DESCRIPTION];
    },

    detailTopColumns() {
      const t = this.$store.getters['i18n/t'];

      const columns = [
        {
          title:   t('secret.type'),
          content: this.value.typeDisplay
        }
      ];

      if (this.cn) {
        columns.push({
          title:   t('secret.certificate.cn'),
          content: this.plusMoreNames ? `${ this.cn } ${ t('secret.certificate.plusMore', { n: this.plusMoreNames }) }` : this.cn
        });
      }

      if (this.issuer) {
        columns.push({
          title:   t('secret.certificate.issuer'),
          content: this.issuer
        });
      }

      if (this.notAfter) {
        columns.push({ name: 'notAfter', title: 'Expires' });
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
    <DetailTop :columns="detailTopColumns">
      <template v-if="notAfter" #notAfter>
        <Date :class="dateClass" :value="notAfter" />
      </template>
    </DetailTop>
    <template v-if="isRegistry">
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
    <template v-else-if="isCertificate">
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
        <KeyValue :title="t('secret.data')" :value="dataRows" mode="view" :as-map="false" />
      </div>
      <div class="spacer"></div>
    </template>
    <ResourceTabs v-model="value" :mode="mode" />
  </div>
</template>
