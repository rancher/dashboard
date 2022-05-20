<script>
import SortableTable from '@shell/components/SortableTable';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { SECRET } from '@shell/config/types';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import Certificate from './Certificate';

export default {
  components: {
    ArrayListGrouped, Certificate, SortableTable
  },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: _EDIT
    },
    certificates: {
      type:    Array,
      default: () => []
    }
  },
  data() {
    return {
      defaultAddValue: {
        secretName:  null,
        hosts:       ['']
      }
    };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    certHeaders() {
      return [
        {
          name:      'certificate',
          label:     this.t('ingress.certificates.headers.certificate'),
          value:     'link',
          formatter: 'Link',
          sort:      'link.text'
        },
        {
          name:      'hosts',
          label:     this.t('ingress.certificates.headers.hosts'),
          value:     'hosts',
          formatter: 'list'
        },
      ];
    },
    certRows() {
      return this.value?.spec?.tls.map((cert) => {
        if (cert.secretName) {
          const name = 'c-cluster-resource-namespace-id';
          const params = {
            namespace: this.value?.metadata?.namespace,
            id:        cert.secretName,
            resource:  SECRET
          };
          const url = { name, params };

          cert.link = { url, text: cert.secretName };
        } else {
          cert.link = { text: 'default' };
        }

        return cert;
      });
    }
  }
};
</script>
<template>
  <SortableTable
    v-if="isView"
    :rows="certRows"
    :headers="certHeaders"
    key-field="_key"
    :search="false"
    :table-actions="false"
    :row-actions="false"
  />
  <div v-else>
    <ArrayListGrouped v-model="value.spec.tls" :add-label="t('ingress.certificates.addCertificate')" :default-add-value="defaultAddValue" :mode="mode">
      <template #default="props">
        <Certificate
          v-model="props.row.value"
          class="mb-20"
          :mode="mode"
          :certs="certificates"
        />
      </template>
    </ArrayListGrouped>
  </div>
</template>
