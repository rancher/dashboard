<script>
import { allHash } from '@shell/utils/promise';
import { SECRET, SERVICE } from '@shell/config/types';
import CreateEditView from '@shell/mixins/create-edit-view';
import Rules from '@shell/edit/networking.k8s.io.ingress/Rules';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';

export default {
  name:       'CRUIngress',
  components: {
    ResourceTabs,
    Rules,
    Tab
  },
  mixins: [CreateEditView],
  async fetch() {
    const hash = await allHash({
      secrets:  this.$store.dispatch('cluster/findAll', { type: SECRET }),
      services: this.$store.dispatch('cluster/findAll', { type: SERVICE }),
    });

    this.allServices = hash.services;
    this.allSecrets = hash.secrets;
  },
  data() {
    return { allSecrets: [], allServices: [] };
  },
  computed: {
    serviceTargets() {
      return this.filterByCurrentResourceNamespace(this.allServices)
        .map(service => ({
          label: service.metadata.name,
          value: service.metadata.name,
          ports: service.spec.ports?.map(p => p.port)
        }));
    },
    firstTabLabel() {
      return this.isView ? this.t('ingress.rulesAndCertificates.title') : this.t('ingress.rules.title');
    },
    certificates() {
      return this.filterByCurrentResourceNamespace(this.allSecrets.filter(secret => secret._type === TYPES.TLS)).map((secret) => {
        const { id } = secret;

        return id.slice(id.indexOf('/') + 1);
      });
    },
  },
  methods: {
    filterByCurrentResourceNamespace(resources) {
      return resources.filter((resource) => {
        return resource.metadata.namespace === this.value.metadata.namespace;
      });
    }
  }
};
</script>
<template>
  <ResourceTabs
    v-model="value"
    mode="view"
    class="mt-20"
  >
    <Tab
      :label="t('ingress.rules.title')"
      name="rules"
      :weight="1"
    >
      <Rules
        v-model="value"
        :mode="mode"
        :service-targets="serviceTargets"
        :certificates="certificates"
      />
    </Tab>
  </ResourceTabs>
</template>
