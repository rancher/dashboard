<script>
import { cleanUp } from '@/utils/object';
import LoadDeps from '@/mixins/load-deps';
import Loading from '@/components/Loading';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
// import LabeledSelect from '@/components/form/LabeledSelect';
import ArrayList from '@/components/form/ArrayList';
import Footer from '@/components/form/Footer';
import { RIO } from '@/config/types';
import { groupAndFilterOptions } from '@/utils/group';

const KIND_LABELS = {
  'service':  'Another service',
  'ip':      'A list of IP Addresses',
  'fqdn':    'A DNS name',
};

export default {
  name: 'CruExternalService',

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

    if ( !spec.ipAddresses ) {
      spec.ipAddresses = [];
    }

    if ( spec.ipAddresses.length ) {
      kind = 'ip';
    } else if ( spec.fqdn ) {
      kind = 'fqdn';
    }

    let targetService = null;

    if ( spec.targetServiceNamespace && spec.targetServiceName ) {
      targetService = `${ spec.targetServiceNamespace }/${ spec.targetServiceName }`;
    }

    return {
      kind,
      allServices: null,
      targetService,
      ipAddresses: spec.ipAddresses,
      fqdn:        spec.fqdn,
    };
  },

  computed: {
    serviceOptions() {
      // return groupAndFilterOptions(this.allServices);
      return this.allServices.map(service => service.id);
    },

    kindLabels() {
      return KIND_LABELS;
    },

    kindOptions() {
      return Object.keys(KIND_LABELS).map((k) => {
        return { label: KIND_LABELS[k], value: k };
      });
    }
  },

  watch: {
    kind() {
      this.update();
    },

    targetService() {
      this.update();
    }
  },

  methods: {
    async loadDeps() {
      const services = await this.$store.dispatch('cluster/findAll', { type: RIO.SERVICE });

      this.allServices = services;
    },

    update() {
      const spec = this.value.spec;

      spec.targetServiceNamespace = null;
      spec.targetServiceName = null;
      spec.ipAddresses = null;
      spec.fqdn = null;

      switch ( this.kind ) {
      case 'service':
        if ( this.targetService ) {
          const [namespace, name] = this.targetService.split('/', 2);

          spec.targetServiceNamespace = namespace;
          spec.targetServiceName = name;
        }
        break;
      case 'ip':
        spec.ipAddresses = this.ipAddresses;
        break;
      case 'fqdn':
        spec.fqdn = this.fqdn;
        break;
      }
      this.value.spec = cleanUp(spec);
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

      <div class="row">
        <div class="col span-12">
          <h4>Target</h4>
          <div v-if="mode === 'view'">
            {{ kindLabels[kind] }}
          </div>
          <div v-else class="row">
            <div v-for="opt in kindOptions" :key="opt.value" class="col">
              <label class="radio">
                <input v-model="kind" type="radio" :value="opt.value" />
                {{ opt.label }}
              </label>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div v-if="kind === 'service'" class="col span-6">
          <template v-if="isView">
            {{ targetService }}
          </template>
          <v-select v-else v-model="targetService" :options="serviceOptions" :clearable="false" />
          <!-- <select v-else v-model="targetService">
            <option disabled value="">
              Select a Service...
            </option>
            <optgroup v-for="grp in serviceOptions" :key="grp.group" :label="grp.group">
              <option v-for="opt in grp.items" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </optgroup>
          </select> -->
        </div>
        <div v-if="kind === 'fqdn'" class="col span-6">
          <LabeledInput v-model="fqdn" :mode="mode" label="DNS FQDN" @input="update" />
        </div>
        <div v-if="kind === 'ip'" class="col span-6">
          <ArrayList
            v-model="ipAddresses"
            title="IP Addresses"
            value-placeholder="e.g. 1.1.1.1"
            add-label="Add Address"
            :value-multiline="false"
            :mode="mode"
            :pad-left="false"
            :protip="false"
            @input="update"
          />
        </div>
      </div>

      <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
    </template>
  </form>
</template>
