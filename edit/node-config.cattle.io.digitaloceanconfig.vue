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
import { addParam, addParams } from '@/utils/url';
import { exceptionToErrorsArray } from '@/utils/error';
import { sortBy } from '@/utils/sort';

export default {
  components: {
    Loading, CruResource, Tabbed, Tab, Credential, NameNsDescription, LabeledSelect, Banner,
  },

  mixins: [CreateEditView],

  async fetch() {
    if ( !this.value.defaultCredentialId ) {
      return;
    }

    this.credential = await this.$store.dispatch('management/find', { type: SECRET, id: this.value.defaultCredentialId });

    const region = this.value.region || this.credential.defaultRegion || 'sfo3';

    try {
      if ( !this.regions ) {
        this.regions = await this.request('regions');
      }

      if ( !this.sizes ) {
        this.sizes = await this.request('sizes');
      }

      this.images = await this.request('images', { params: { type: 'distribution' } });

      if ( !this.value.region ) {
        this.value.region = region;
      }
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }
  },

  data() {
    return {
      errors:     null,
      credential:   null,
      regions:    null,
      images:     null,
      sizes:      null,
    };
  },

  computed: {
    instanceOptions() {
      const planSorts = {
        s:        1,
        g:        2,
        gd:       2,
        c:        3,
        m:        4,
        so:       5,
        standard: 98,
        other:    99,
      };

      const regionInfo = this.regions.regions.find(x => x.slug === this.value.region);
      const available = this.sizes.sizes.filter(size => regionInfo.sizes.includes(size.slug)).map((size) => {
        const match = size.slug.match(/^(so|gd|g|c|m|s).*-/);
        const plan = match ? match[1] : (size.slug.includes('-') ? 'standard' : 'other');

        const out = {
          plan,
          planSort: planSorts[plan],
          memoryGb: size.memory / 1024,
          disk:     size.disk,
          vcpus:    size.vcpus,
          value:    size.slug
        };

        out.label = this.t('cluster.nodeConfig.digitalocean.sizeLabel', out);

        return out;
      }).filter(size => size.plan !== 'other');

      return sortBy(available, ['planSort', 'memoryGb', 'vcpus', 'disk']);
    },

    regionOptions() {
      const out = this.regions.regions.filter((region) => {
        return region.available && region.features.includes('metadata');
      }).map((region) => {
        return {
          label: region.name,
          value: region.slug,

        };
      });

      return out;
    },
  },

  watch: {
    'value.defaultCredentialId'() {
      this.$fetch();
      this.$refs.tabbed.select('basics');
    },
  },

  methods: {
    async request(command, opt = {}, out) {
      let url = '/meta/proxy/';

      opt.redirectUnauthorized = false;
      opt.headers = opt.headers || {};
      opt.headers['accept'] = 'application/json';
      opt.headers['x-api-cattleauth-header'] = `Bearer credID=${ this.credential.id.replace('/', ':') } passwordField=accessToken`;

      if ( opt.url ) {
        url += opt.url.replace(/^http[s]?\/\//, '');
      } else {
        url += `api.digitalocean.com/v2/${ command }`;
        url = addParam(url, 'per_page', opt.per_page || 100);
        url = addParams(url, opt.params || {});
      }

      opt.url = url;

      const res = await this.$store.dispatch('management/request', opt);

      if ( out ) {
        out[command].pushObjects(res[command]);
      } else {
        out = res;
      }

      // De-paging
      if ( res && res.links && res.links.pages && res.links.pages.next ) {
        opt.url = res.links.pages.next;

        await this.request(command, opt, out);
      }

      return out;
    }
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
          provider="digitalocean"
        />
        <Banner color="info" label="Note: This is only used for talking to the DigitalOcean API to display this form.  You can choose a different Node Credential to use actually creating a cluster." />
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
                v-model="value.size"
                :options="instanceOptions"
                :searchable="true"
                label="Size"
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
