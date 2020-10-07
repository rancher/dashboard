<script>
import { base64Decode } from '@/utils/crypto';
import CreateEditView from '@/mixins/create-edit-view';
import ResourceTabs from '@/components/form/ResourceTabs';
import KeyValue from '@/components/form/KeyValue';

export default {
  components: {
    ResourceTabs,
    KeyValue,
  },

  mixins: [CreateEditView],

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
    parsedRows() {
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

    dockerRows() {
      const auths = JSON.parse(this.parsedRows[0].value).auths;
      const rows = [];

      for (const address in auths) {
        rows.push({
          address,
          username: auths[address].username,
        });
      }

      return rows;
    },

    certRows() {
      let { 'tls.key':key, 'tls.crt': crt } = this.value.data;

      key = base64Decode(key);
      crt = base64Decode(crt);

      return [{ key, crt }];
    },

    dataRows() {
      if (this.value.isRegistry) {
        return this.dockerRows;
      } else if (this.value.isCertificate) {
        return this.certRows;
      }

      return this.parsedRows;
    }
  },
};
</script>

<template>
  <div>
    <KeyValue :title="t('secret.data')" :value="parsedRows" mode="view" :as-map="false" :value-multiline="true" />
    <div class="spacer"></div>
    <ResourceTabs v-model="value" :mode="mode" />
  </div>
</template>
