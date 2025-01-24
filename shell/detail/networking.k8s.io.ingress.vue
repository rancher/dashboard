<script>
import { allHash } from '@shell/utils/promise';
import CreateEditView from '@shell/mixins/create-edit-view';
import Rules from '@shell/edit/networking.k8s.io.ingress/Rules';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import IngressDetailEditHelper from '@shell/utils/ingress';

export default {
  name:       'CRUIngress',
  emits:      ['input'],
  components: {
    ResourceTabs,
    Rules,
    Tab
  },
  mixins: [CreateEditView],
  async fetch() {
    this.ingressHelper = new IngressDetailEditHelper({
      $store:    this.$store,
      namespace: this.value.metadata.namespace
    });
    const promises = {
      services:       this.ingressHelper.fetchServices(),
      secrets:        this.ingressHelper.fetchSecrets(),
      resourceFields: this.schema.fetchResourceFields(),
    };

    const hash = await allHash(promises);

    this.services = hash.services;
    this.secrets = hash.secrets;
  },
  data() {
    return {
      secrets:  [],
      services: [],
    };
  },
  computed: {
    serviceTargets() {
      return this.ingressHelper.findAndMapServiceTargets(this.services);
    },
    firstTabLabel() {
      return this.isView ? this.t('ingress.rulesAndCertificates.title') : this.t('ingress.rules.title');
    },
    certificates() {
      return this.ingressHelper.findAndMapCerts(this.secrets);
    },
  },
};
</script>
<template>
  <ResourceTabs
    :value="value"
    mode="view"
    class="mt-20"
    @update:value="$emit('input', $event)"
  >
    <Tab
      :label="t('ingress.rules.title')"
      name="rules"
      :weight="1"
    >
      <Rules
        :value="value"
        :mode="mode"
        :service-targets="serviceTargets"
        :certificates="certificates"
        @update:value="$emit('input', $event)"
      />
    </Tab>
  </ResourceTabs>
</template>
