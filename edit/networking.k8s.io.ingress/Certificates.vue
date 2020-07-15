<script>
import SortableTable from '@/components/SortableTable';
import { _EDIT, _VIEW } from '@/config/query-params';
import { SECRET } from '@/config/types';
import { TLS } from '@/models/secret';
import Certificate from './Certificate';
export default {
  components: { Certificate, SortableTable },
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
    secrets: {
      type:    Array,
      default: () => []
    }
  },
  data() {
    return { tls: this.value.spec.tls };
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
    },
    certificates() {
      return this.filterByNamespace(this.secrets.filter(secret => secret._type === TLS)).map((secret) => {
        const { id } = secret;

        return id.slice(id.indexOf('/') + 1);
      });
    },
  },
  methods: {
    addCert() {
      this.tls.push({});
    },
    removeCert(idx) {
      this.tls.splice(idx, 1);
    },
    filterByNamespace(list) {
      const namespaces = this.$store.getters['namespaces']();

      return list.filter((resource) => {
        return !!namespaces[resource.metadata.namespace];
      });
    },
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
    <Certificate
      v-for="(cert,i) in tls"
      :key="i"
      class="mb-20"
      :mode="mode"
      :certs="certificates"
      :value="cert"
      @input="e=>$set(tls, i, e)"
      @remove="e=>removeCert(i)"
    />
    <button class="btn role-tertiary add mt-10" type="button" @click="addCert">
      {{ t('ingress.certificates.addCertificate') }}
    </button>
  </div>
</template>
