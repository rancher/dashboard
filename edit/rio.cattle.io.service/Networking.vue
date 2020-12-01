<script>
import ArrayList from '@/components/form/ArrayList';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

const CLUSTER_FIRST = 'ClusterFirst';
const CLUSTER_FIRST_HOST = 'ClusterFirstWithHostNet';

export default {
  components: {
    ArrayList, KeyValue, LabeledInput, LabeledSelect
  },

  props: {
    spec: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
  },

  data() {
    const hostAliases = (this.spec.hostAliases || []).map((entry) => {
      return {
        ip:        entry.ip,
        hostnames: entry.hostnames.join(', ')
      };
    });

    const out = {
      dnsPolicy:   this.spec.dnsPolicy || 'Default',
      networkMode: this.spec.hostNetwork ? 'host' : 'normal',
      hostAliases,
    };

    return out;
  },

  computed: {
    dnsPolicyChoices() {
      return [
        { label: 'Default', value: 'Default' },
        { label: 'ClusterFirst', value: 'Cluster First' },
        { label: 'None', value: 'None' },
      ];
    },

    networkModeChoices() {
      return [
        { label: 'Normal', value: 'normal' },
        { label: 'Host Network', value: 'host' },
      ];
    },
  },

  watch: {
    networkMode(neu) {
      const on = neu === 'host';

      this.spec.hostNetwork = on;
      if ( this.dnsPolicy === CLUSTER_FIRST ) {
        if ( on ) {
          this.spec.dnsPolicy = CLUSTER_FIRST_HOST;
        } else {
          this.spec.dnsPolicy = CLUSTER_FIRST;
        }
      }
    },

    dnsPolicy(neu) {
      if ( neu === CLUSTER_FIRST ) {
        if ( this.networkMode === 'host' ) {
          this.spec.dnsPolicy = CLUSTER_FIRST_HOST;
        } else {
          this.spec.dnsPolicy = CLUSTER_FIRST;
        }
      } else {
        this.spec.dnsPolicy = neu;
      }
    }
  },

  created() {
    const spec = this.spec;

    if ( !spec.dnsNameservers ) {
      spec.dnsNameservers = [];
    }

    if ( !spec.searches ) {
      spec.searches = [];
    }

    if ( !spec.dnsPolicy ) {
      spec.dnsPolicy = 'Default';
    }
  },

  methods: {
    updateHostAliases(neu) {
      this.spec.hostAliases = neu.map((entry) => {
        const ip = entry.ip.trim();
        const hostnames = entry.hostnames.trim().split(/[\s,]+/).filter(x => !!x);

        return { ip, hostnames };
      }).filter(entry => entry.ip && entry.hostnames.length);
    }
  }
};
</script>
<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <LabeledSelect
          v-model="networkMode"
          :mode="mode"
          :options="networkModeChoices"
          label="Network Mode"
          placeholder="Select a Mode..."
        />
      </div>

      <div class="col span-4">
        <LabeledSelect
          v-model="dnsPolicy"
          :mode="mode"
          :options="dnsPolicyChoices"
          label="DNS Policy"
          placeholder="Select a Policy..."
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="spec.hostname"
          label="Hostname"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <ArrayList
          key="dnsNameservers"
          v-model="spec.dnsNameservers"
          title="Nameservers"
          value-placeholder="e.g. 1.1.1.1"
          add-label="Add Nameserver"
          :mode="mode"
          :protip="false"
        />
      </div>
      <div class="col span-6">
        <ArrayList
          key="dnsSearches"
          v-model="spec.dnsSearches"
          title="Search Domains"
          value-placeholder="e.g. mycompany.com"
          add-label="Add Search Domain"
          :mode="mode"
          :protip="false"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-12">
        <KeyValue
          key="hostAliases"
          v-model="hostAliases"
          :mode="mode"
          title="Host Aliases"
          protip="Additional /etc/hosts entries to be injected in the container."
          :read-allowed="false"
          :as-map="false"
          key-name="ip"
          key-label="IP Address"
          key-placeholder="e.g. 1.1.1.1"
          value-name="hostnames"
          value-label="Hostname(s)"
          value-placeholder="e.g. foo.com, bar.com"
          add-label="Add Alias"
          @input="updateHostAliases"
        />
      </div>
    </div>
  </div>
</template>
