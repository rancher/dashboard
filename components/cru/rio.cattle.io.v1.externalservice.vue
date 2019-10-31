<script>
import LoadDeps from '@/mixins/load-deps';
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
// import LabeledSelect from '@/components/form/LabeledSelect';
import ArrayList from '@/components/form/ArrayList';
import Footer from '@/components/form/Footer';
import { RIO } from '@/config/types';

export default {
  name: 'CruConfigMap',

  components: {
    Loading,
    NameNsDescription,
    LabeledInput,
    // LabeledSelect,
    ArrayList,
    Footer,
  },
  mixins:     [CreateEditView, LoadDeps],

  data() {
    let spec = this.value.spec;
    let kind = 'service';

    if ( !this.value.spec ) {
      spec = {};
      this.value.spec = spec;
    }

    if ( spec.ipAddresses.length ) {
      kind = 'ip';
    } else if ( spec.fqdn ) {
      kind = 'fqdn';
    }

    if ( spec.targetServiceNamespace && spec.targetServiceName ) {

    }

    return {
      kind,
      allServices: null
    };
  },

  methods: {
    async loadDeps() {
      const services = await this.$store.dispatch('cluster/findAll', { type: RIO.SERVICE });

      this.allServices = services;
    },
  }
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
        name-label="External Service Name"
      />

      <div class="row">
        <div class="col span-4">
          <div>
            <label class="radio">
              <input v-model="kind" type="radio" value="service" /> Another service
            </label>
          </div>
          <div>
            <label class="radio">
              <input v-model="kind" type="radio" value="fqdn" /> A DNS name
            </label>
          </div>
          <div>
            <label class="radio">
              <input v-model="kind" type="radio" value="ip" /> One or more IP addresses
            </label>
          </div>
        </div>

        <div v-if="kind === 'service'" class="col span-8">
        </div>
        <div v-if="kind === 'fqdn'" class="col span-8">
          <LabeledInput v-model="value.spec.fqdn" label="DNS FQDN" />
        </div>
        <div v-if="kind === 'ip'" class="col span-8">
          <ArrayList
            v-model="spec.ipAddresses"
            title="IP Addresses"
            value-placeholder="e.g. 1.1.1.1"
            add-label="Add Address"
            :value-multiline="false"
            :mode="mode"
            :pad-left="false"
            :protip="false"
          />
        </div>
      </div>

      <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
    </template>
  </form>
</template>
