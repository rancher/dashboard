<script>
import { allHash } from '@/utils/promise';
import { SECRET, SERVICE } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import Rules from '@/edit/networking.k8s.io.ingress/Rules';
import ResourceTabs from '@/components/form/ResourceTabs';
import Tab from '@/components/Tabbed/Tab';

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
  <ResourceTabs v-model="value" mode="view" class="mt-20">
    <Tab label="Rules" name="rules" :weight="1">
      <Rules v-model="value" :mode="mode" :service-targets="serviceTargets" />
    </Tab>
  </ResourceTabs>
</template>
