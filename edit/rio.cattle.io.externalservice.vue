<script>
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
import ArrayList from '@/components/form/ArrayList';
import Footer from '@/components/form/Footer';
import Target from '@/components/form/Target';
import { clone } from '@/utils/object';

const KIND_LABELS = {
  router:      'A router',
  app:         'A service',
  ipAddresses:      'A list of IP Addresses',
  fqdn:        'A DNS name',
};

export default {
  name: 'CruExternalService',

  components: {
    NameNsDescription,
    LabeledInput,
    Target,
    ArrayList,
    Footer,
  },
  mixins: [CreateEditView],

  data() {
    const spec = this.value.spec ? clone(this.value.spec) : {};
    let kind = 'app';

    if ( spec.ipAddresses ) {
      kind = 'ip';
    } else if ( spec.fqdn ) {
      kind = 'fqdn';
    }

    return {
      spec,
      kind,
      ipAddresses: spec.ipAddresses,
      fqdn:        spec.fqdn,
    };
  },
  computed: {
    kindLabels() {
      return KIND_LABELS;
    }
  },
  methods: {
    update(spec) {
      const targetNS = spec.targetNamespace;

      if (targetNS) {
        delete spec.targetNamespace;
        spec.targetServiceNamespace = targetNS;
      }
      this.value.spec = spec;
    }
  }
};
</script>

<template>
  <form>
    <NameNsDescription
      :value="value"
      :mode="mode"
      label="Name"
      :register-before-hook="registerBeforeHook"
    />

    <div class="spacer"></div>

    <Target v-model="spec" :kind-labels="kindLabels" @input="update">
      <template v-slot:fqdn="slotProps">
        <LabeledInput v-model="fqdn" :mode="mode" label="DNS FQDN" @input="e=>slotProps.update(e)" />
      </template>
      <template v-slot:ipAddresses="slotProps">
        <ArrayList
          v-model="ipAddresses"
          title="IP Addresses"
          value-placeholder="e.g. 1.1.1.1"
          add-label="Add Address"
          :mode="mode"
          :protip="false"
          @input="e=>slotProps.update(e)"
        />
      </template>
    </Target>

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
</template>
