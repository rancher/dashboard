<script>
import LoadDeps from '@/mixins/load-deps';
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
import ArrayList from '@/components/form/ArrayList';
import Footer from '@/components/form/Footer';
import Target from '@/components/form/Target';

const KIND_LABELS = {
  'router':      'A router',
  'app':         'A service',
  'ipAddresses':      'A list of IP Addresses',
  'fqdn':        'A DNS name',
};

export default {
  name: 'CruExternalService',

  components: {
    Loading,
    NameNsDescription,
    LabeledInput,
    Target,
    ArrayList,
    Footer,
  },
  mixins:     [CreateEditView, LoadDeps],

  data() {
    let spec = this.value.spec;
    let kind = 'app';

    if ( !this.value.spec ) {
      spec = {};
      this.value.spec = spec;
    }

    if ( spec.ipAddresses ) {
      kind = 'ip';
    } else if ( spec.fqdn ) {
      kind = 'fqdn';
    }

    return {
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
};
</script>

<template>
  <form>
    <Loading ref="loader" />
    <div v-if="loading">
    </div>
    <template v-else>
      <NameNsDescription
        :value="value"
        :mode="mode"
        name-label="Name"
        :register-before-hook="registerBeforeHook"
      />

      <div class="spacer"></div>

      <Target v-model="value.spec" :kind-labels="kindLabels">
        <template v-slot:fqdn="slotProps">
          <LabeledInput v-model="fqdn" :mode="mode" label="DNS FQDN" @input="e=>slotProps.update(e)" />
        </template>
        <template v-slot:ipAddresses="slotProps">
          <ArrayList
            v-model="ipAddresses"
            title="IP Addresses"
            value-placeholder="e.g. 1.1.1.1"
            add-label="Add Address"
            :value-multiline="false"
            :mode="mode"
            :pad-left="false"
            :protip="false"
            @input="e=>slotProps.update(e)"
          />
        </template>
      </Target>

      <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
    </template>
  </form>
</template>
