<script>
import ArrayList from '@shell/components/form/ArrayList';
import KeyValue from '@shell/components/form/KeyValue';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { mapGetters } from 'vuex';

const CLUSTER_FIRST = 'ClusterFirst';
const CLUSTER_FIRST_HOST = 'ClusterFirstWithHostNet';

export default {
  components: {
    ArrayList, KeyValue, LabeledInput, LabeledSelect
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      required: true,
    },
  },

  data() {
    const t = this.$store.getters['i18n/t'];
    const hostAliases = (this.value.hostAliases || []).map((entry) => {
      return {
        ip:        entry.ip,
        hostnames: entry.hostnames.join(', ')
      };
    });
    const { dnsConfig = {}, hostname, subdomain } = this.value;
    const { nameservers, searches, options } = dnsConfig;

    const out = {
      dnsPolicy:   this.value.dnsPolicy || 'ClusterFirst',
      networkMode: this.value.hostNetwork ? { label: t('workload.networking.networkMode.options.hostNetwork'), value: true } : { label: t('workload.networking.networkMode.options.normal'), value: false },
      hostAliases,
      nameservers,
      searches,
      hostname,
      subdomain,
      options
    };

    return out;
  },

  computed: {
    dnsPolicyChoices() {
      return [
        {
          label: this.t('workload.networking.dnsPolicy.options.default'),
          value: 'Default'
        },
        {
          label: this.t('workload.networking.dnsPolicy.options.clusterFirst'),
          value: 'ClusterFirst'
        },
        {
          label: this.t('workload.networking.dnsPolicy.options.clusterFirstWithHostNet'),
          value: 'ClusterFirstWithHostNet'
        },
        {
          label: this.t('workload.networking.dnsPolicy.options.none'),
          value: 'None'
        },
      ];
    },

    networkModeChoices() {
      return [
        { label: this.t('workload.networking.networkMode.options.normal'), value: false },
        { label: this.t('workload.networking.networkMode.options.hostNetwork'), value: true },
      ];
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    networkMode(neu) {
      const on = neu;

      this.value.hostNetwork = on;
      if ( this.dnsPolicy === CLUSTER_FIRST ) {
        if ( on ) {
          this.value.dnsPolicy = CLUSTER_FIRST_HOST;
        } else {
          this.value.dnsPolicy = CLUSTER_FIRST;
        }
      }
    },

    dnsPolicy(neu) {
      if ( neu === CLUSTER_FIRST ) {
        if ( this.networkMode ) {
          this.value.dnsPolicy = CLUSTER_FIRST_HOST;
        } else {
          this.value.dnsPolicy = CLUSTER_FIRST;
        }
      } else {
        this.value.dnsPolicy = neu;
      }
    }
  },

  methods: {
    updateHostAliases(neu) {
      this.hostAliases = neu.map((entry) => {
        const ip = entry.ip.trim();
        const hostnames = entry.hostnames.trim().split(/[\s,]+/).filter(x => !!x);

        return { ip, hostnames };
      }).filter(entry => entry.ip && entry.hostnames.length);
      this.update();
    },

    update() {
      const dnsConfig = {
        ...this.dnsConfig,
        nameservers: this.nameservers,
        searches:    this.searches,
        options:     this.options
      };
      const out = {
        ...this.value,
        dnsConfig,
        dnsPolicy:   this.dnsPolicy,
        hostname:    this.hostname,
        hostAliases: this.hostAliases,
        subdomain:   this.subdomain,
        hostNetwork: this.networkMode.value
      };

      this.$emit('input', out);
    }
  }
};
</script>
<template>
  <div>
    <div>
      <h3>{{ t('workload.container.titles.networkSettings') }}</h3>
      <div class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="networkMode"
            :mode="mode"
            :options="networkModeChoices"
            :label="t('workload.networking.networkMode.label')"
            :placeholder="t('workload.networking.networkMode.placeholder')"
            @input="update"
          />
        </div>

        <div class="col span-6">
          <LabeledSelect
            v-model="dnsPolicy"
            :mode="mode"
            :options="dnsPolicyChoices"
            :label="t('workload.networking.dnsPolicy.label')"
            :placeholder="t('workload.networking.dnsPolicy.placeholder')"
            @input="update"
          />
        </div>
      </div>

      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model="hostname"
            :mode="mode"
            :label="t('workload.networking.hostname.label')"
            :placeholder="t('workload.networking.hostname.placeholder')"
            @input="update"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="subdomain"
            :mode="mode"
            :label="t('workload.networking.subdomain.label')"
            :placeholder="t('workload.networking.subdomain.placeholder')"
            @input="update"
          />
        </div>
      </div>
    </div>
    <div class="spacer" />

    <div>
      <h3>{{ t('workload.networking.dns') }}</h3>
      <div class="row">
        <div class="col span-6">
          <ArrayList
            key="dnsNameservers"
            v-model="nameservers"
            :title="t('workload.networking.nameservers.label')"
            :value-placeholder="t('workload.networking.nameservers.placeholder')"
            :add-label="t('workload.networking.nameservers.add')"
            :mode="mode"
            :protip="false"
            @input="update"
          />
        </div>
        <div class="col span-6">
          <ArrayList
            key="dnsSearches"
            v-model="searches"
            :title="t('workload.networking.searches.label')"
            :value-placeholder="t('workload.networking.searches.placeholder')"
            :add-label="t('workload.networking.searches.add')"
            :mode="mode"
            :protip="false"
            @input="update"
          />
        </div>
      </div>
    </div>
    <div class="spacer" />

    <div class="mt-20">
      <div class="row">
        <KeyValue
          v-model="options"
          :key-label="t('generic.name')"
          key-name="name"
          :mode="mode"
          :title="t('workload.networking.resolver.label')"
          :add-label="t('workload.networking.resolver.add')"
          :read-allowed="false"
          :as-map="false"
          :value-label="t('generic.value')"
          @input="update"
        />
      </div>
    </div>
    <div class="spacer" />

    <div class="row mt-20">
      <div class="col span-12">
        <KeyValue
          key="hostAliases"
          v-model="hostAliases"
          :mode="mode"
          :title="t('workload.networking.hostAliases.label')"
          :protip="t('workload.networking.hostAliases.tip')"
          :read-allowed="false"
          :as-map="false"
          key-name="ip"
          :key-label="t('workload.networking.hostAliases.keyLabel')"
          :key-placeholder="t('workload.networking.hostAliases.keyPlaceholder')"
          value-name="hostnames"
          :value-label="t('workload.networking.hostAliases.valueLabel')"
          :value-placeholder="t('workload.networking.hostAliases.valuePlaceholder')"
          :add-label="t('workload.networking.hostAliases.add')"
          @input="updateHostAliases"
        >
          <template #title>
            <h3>{{ t('workload.networking.hostAliases.label') }}</h3>
          </template>
        </KeyValue>
      </div>
    </div>
  </div>
</template>
