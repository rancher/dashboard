<script>
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import Tip from '@shell/components/Tip';
import ArrayList from '@shell/components/form/ArrayList';
import KeyValue from '@shell/components/form/KeyValue';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { mapGetters } from 'vuex';
import { NAMESPACE } from '@shell/config/types';
import { PROJECT } from '@shell/config/labels-annotations';

const CLUSTER_FIRST = 'ClusterFirst';
const CLUSTER_FIRST_HOST = 'ClusterFirstWithHostNet';
const DUAL_NETWORK_CARD = '[{"name":"static-macvlan-cni-attach","interface":"eth1"}]';
const SINGLE_NETWORK_CARD = '[{"name":"static-macvlan-cni-attach","interface":"eth0"}]';

export default {
  components: {
    RadioGroup, Tip, ArrayList, KeyValue, LabeledInput, LabeledSelect
  },

  props: {
    namespace: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      required: true,
    },
  },

  async fetch() {
    await this.fetchVlansubnets();
  },

  data() {
    const t = this.$store.getters['i18n/t'];
    const hostAliases = (this.value.hostAliases || []).map((entry) => {
      return {
        ip:        entry.ip,
        hostnames: entry.hostnames.join(', ')
      };
    });
    const {
      dnsConfig = {}, hostname, subdomain, vlansubnet = {}
    } = this.value;
    const { nameservers, searches, options } = dnsConfig;
    const {
      network: vlansubnetNetwork, ip: vlansubnetIp, mac: vlansubnetMac, subnet: vlansubnetName, allowVlansubnet
    } = vlansubnet;

    const out = {
      dnsPolicy:   this.value.dnsPolicy || 'ClusterFirst',
      networkMode: this.value.hostNetwork ? { label: t('workload.networking.networkMode.options.hostNetwork'), value: true } : { label: t('workload.networking.networkMode.options.normal'), value: false },
      hostAliases,
      nameservers,
      searches,
      hostname,
      subdomain,
      options,

      allowVlansubnet,
      vlansubnetNetwork:   vlansubnetNetwork || DUAL_NETWORK_CARD,
      vlansubnetIp,
      vlansubnetMac,
      vlansubnetName,
      vlansubnetChoices:   [],
      unsupportVlansubnet: true,
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

    vlansubnetNetworkChoices() {
      return [{
        label: 'eth1',
        value: DUAL_NETWORK_CARD,
      }, {
        label: 'eth0',
        value: SINGLE_NETWORK_CARD,
      }];
    },

    ...mapGetters({ t: 'i18n/t', currentCluster: 'currentCluster' })
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
    },

    namespace() {
      this.vlansubnetName = null;
      this.fetchVlansubnets();
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

    async fetchVlansubnets() {
      const clusterId = this.currentCluster.id;

      if (clusterId) {
        const inStore = this.$store.getters['currentStore'](NAMESPACE);
        const namespace = this.$store.getters[`${ inStore }/byId`](NAMESPACE, this.namespace);
        const projectId = namespace?.metadata?.annotations[PROJECT];
        const query = {
          labelSelector: encodeURIComponent(`project in (${ projectId.replace(/[:]/g, '-') }, )`),
          limit:         50
        };
        const q = Object.entries(query).map(e => `${ e[0] }=${ e[1] }`).join('&');

        await this.$store.dispatch('management/request', { url: `/k8s/clusters/${ clusterId }/apis/macvlan.cluster.cattle.io/v1/namespaces/kube-system/macvlansubnets${ q ? `?${ q }` : '' }` }).then((resp) => {
          const items = resp.items.map(item => ({
            label: `${ item.metadata.name }(${ item.spec.cidr })`,
            value: item.metadata.name
          }));

          this.vlansubnetChoices = items;
          this.unsupportVlansubnet = false;
        });
      }
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
        hostNetwork: this.networkMode.value,
        vlansubnet:  {
          ip:              this.vlansubnetIp,
          mac:             this.vlansubnetMac,
          subnet:          this.vlansubnetName,
          network:         this.vlansubnetNetwork,
          allowVlansubnet: this.allowVlansubnet,
        }
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
    <div class="spacer"></div>

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
    <div class="spacer"></div>

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
    <div class="spacer"></div>

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
    <div class="spacer"></div>

    <div class="mt-20">
      <div class="row">
        <div class="col span-12">
          <RadioGroup
            v-model="allowVlansubnet"
            name="vlansubnet"
            :label="t('workload.networking.vlansubnet.label')"
            :options="[false,true]"
            :labels="[t('generic.disabled'), t('generic.enabled')]"
            :mode="mode"
            :disabled="unsupportVlansubnet"
            @input="update"
          />
        </div>
      </div>
      <div v-if="allowVlansubnet">
        <div class="row mt-20">
          <div class="col span-6">
            <LabeledSelect
              v-model="vlansubnetNetwork"
              :mode="mode"
              :options="vlansubnetNetworkChoices"
              :label="t('workload.networking.vlansubnet.network.label')"
              :placeholder="t('workload.networking.network.placeholder')"
              :required="true"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <LabeledInput
              v-model="vlansubnetIp"
              :mode="mode"
              :label="t('workload.networking.vlansubnet.ip.label')"
              :placeholder="t('workload.networking.vlansubnet.ip.placeholder')"
              @input="update"
            />
          </div>
        </div>
        <div class="row mt-20">
          <div class="col span-6">
            <LabeledInput
              v-model="vlansubnetMac"
              :mode="mode"
              :label="t('workload.networking.vlansubnet.mac.label')"
              :placeholder="t('workload.networking.vlansubnet.mac.placeholder')"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <LabeledSelect
              v-model="vlansubnetName"
              :mode="mode"
              :options="vlansubnetChoices"
              :label="t('workload.networking.vlansubnet.subnet.label')"
              :placeholder="t('workload.networking.vlansubnet.subnet.placeholder')"
              :required="true"
              @input="update"
            />
          </div>
        </div>

        <Tip icon="icon icon-info" class="text-info mt-10" :text="t('workload.networking.vlansubnet.tip')" />
      </div>
    </div>
  </div>
</template>
