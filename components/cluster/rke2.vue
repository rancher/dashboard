<script>
import Loading from '@/components/Loading';
import Tabbed from '@/components/Tabbed';
import LabeledSelect from '@/components/form/LabeledSelect';
import Tab from '@/components/Tabbed/Tab';
import Ec2 from '@/components/cluster/node-template/amazonec2';
import Credential from '@/components/cluster/credential';
import { MANAGEMENT, SECRET } from '@/config/types';
import { nlToBr } from '@/utils/string';

export default {
  components: {
    Loading,
    Tabbed,
    Tab,
    Credential,
    Ec2,
    LabeledSelect,
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    provider: {
      type:    String,
      default: null,
    }
  },

  async fetch() {
    this.allSecrets = await this.$store.dispatch('management/findAll', { type: SECRET });
    this.versions = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: 'k8s-version-to-images' });
  },

  data() {
    return {
      allSecrets:    null,
      nodeComponent: null,
    };
  },

  computed: {
    credentialOptions() {
      // @TODO better thing to filter by, better display name
      return this.allSecrets.filter((obj) => {
        return obj.metadata.generateName === 'cc-';
      });
    },

    versionOptions() {
      try {
        const versions = Object.keys(JSON.parse(this.versions));

        const out = versions.map((v) => {
          return {
            label: v,
            value: v,
          };
        });

        // @TODO add existing version on edit if it's missing
        debugger;

        return out;
      } catch (err) {
        this.$store.dispatch('growl/fromError', { err });

        return [];
      }
    },
  },

  methods: { nlToBr },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <Tabbed v-else :side-tabs="true">
    <Tab name="credential" label="Credentials" :weight="10">
      <Credential
        v-model="value.credentialId"
        :mode="mode"
        :provider="provider"
      />
    </Tab>
    <Tab name="pools" label="Node Pools" :weight="9">
      <Ec2 v-if="value.credentialId" />
      <div v-else>
        Select a credential first...
      </div>
    </Tab>
    <Tab name="cluster" label="Cluster Options" :weight="8">
      Kubernetes version, etc...
      <LabeledSelect
        v-model="value.kubernetesVersion"
        label-key="cluster.kubernetesVersion.label"
      />
    </Tab>
    <Tab name="debug" label="Debug">
      <h4>{{ provider }}</h4>
      <pre><code v-html="nlToBr(JSON.stringify(value, null, 2))" /></pre>
    </Tab>
  </Tabbed>
</template>
