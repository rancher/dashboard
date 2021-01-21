<script>
import Loading from '@/components/Loading';
import Banner from '@/components/Banner';
import Credential from '@/components/cluster/Credential';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledSelect from '@/components/form/LabeledSelect';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import { SECRET } from '@/config/types';
import CruResource from '@/components/CruResource';

export default {
  components: {
    Loading, CruResource, Tabbed, Tab, Credential, NameNsDescription, LabeledSelect, Banner,
  },

  mixins: [CreateEditView],

  async fetch() {
    if ( !this.instanceInfo ) {
      this.instanceInfo = await this.$store.dispatch('aws/instanceInfo');
    }

    if ( !this.value.defaultCredentialId ) {
      return;
    }

    this.credential = await this.$store.dispatch('management/find', { type: SECRET, id: this.value.defaultCredentialId });

    const region = this.value.region || this.credential.defaultRegion || 'us-east-1';

    this.client = await this.$store.dispatch('aws/ec2', {
      region,
      cloudCredentialId: this.value.defaultCredentialId,
    });

    if ( !this.regionInfo ) {
      this.regionInfo = await this.client.describeRegions({});
    }

    if ( !this.value.region ) {
      this.value.region = region;
    }
  },

  data() {
    return {
      client:       null,
      credential:   null,
      instanceInfo: null,
      regionInfo:   null,
    };
  },

  computed: {
    instanceOptions() {
      return this.instanceInfo.map((obj) => {
        return {
          label: `${ obj['API Name'] } (${ obj['vCPUs'] } / ${ obj['Memory'] })`,
          value: obj['API Name'],
        };
      });
    },

    regionOptions() {
      return this.regionInfo.Regions.map((obj) => {
        return obj.RegionName;
      }).sort();
    },
  },

  watch: {
    'value.defaultCredentialId'() {
      this.$fetch();
      this.$refs.tabbed.select('basics');
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :validation-passed="!!value.defaultCredentialId"
    :done-route="doneRoute"
    :resource="value"
    :mode="mode"
    :errors="errors"
    @finish="save"
    @error="e=>errors = e"
  >
    <NameNsDescription v-model="value" :mode="mode" :namespaced="isNamespaced" />

    <Tabbed ref="tabbed" :side-tabs="true" default-tab="credential" class="mt-20">
      <Tab name="credential" label="Credential" :weight="10">
        <Credential
          v-model="value.defaultCredentialId"
          :mode="mode"
          provider="amazonec2"
        />
        <Banner color="info" label="Note: This is only used for talking to the Amazon API to display this form.  You can choose a different Node Credential to use actually creating a cluster." />
      </Tab>

      <Tab name="basics" label="Basics" :weight="9">
        <template v-if="value.defaultCredentialId">
          <div class="row">
            <div class="col span-6">
              <LabeledSelect
                v-model="value.region"
                :options="regionOptions"
                :searchable="true"
                label="Region"
              />
            </div>
            <div class="col span-6">
              <LabeledSelect
                v-model="value.instanceType"
                :options="instanceOptions"
                :searchable="true"
                label="Instance Type"
              />
            </div>
          </div>
        </template>

        <template v-else>
          Select a Credential above first&hellip;
        </template>
      </Tab>
    </Tabbed>
  </CruResource>
</template>
