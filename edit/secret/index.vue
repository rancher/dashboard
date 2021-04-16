<script>
import { TYPES } from '@/models/secret';
import { NAMESPACE } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import CruResource from '@/components/CruResource';
import { _CREATE } from '@/config/query-params';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Labels from '@/components/form/Labels';
import { HIDE_SENSITIVE } from '@/store/prefs';
import { set } from '@/utils/object';

const types = [
  TYPES.OPAQUE,
  TYPES.DOCKER_JSON,
  TYPES.TLS,
  TYPES.SSH,
  TYPES.BASIC,
];

export default {
  name: 'CruSecret',

  components: {
    NameNsDescription,
    CruResource,
    Tabbed,
    Tab,
    Labels
  },

  mixins: [CreateEditView],

  data() {
    let username;
    let password;
    let key;
    let crt;

    if ( !this.value.data ) {
      set(this.value, 'data', {});
    }

    if (!this.value._type && this.mode !== _CREATE) {
      this.$set(this.value, '_type', TYPES.OPAQUE);
    }

    return {
      types,
      username,
      password,
      key,
      crt,
    };
  },

  computed: {
    typeKey() {
      switch ( this.value._type ) {
      case TYPES.TLS: return 'tls';
      case TYPES.BASIC: return 'basic';
      case TYPES.DOCKER_JSON: return 'registry';
      case TYPES.CLOUD_CREDENTIAL: return 'cloud';
      case TYPES.SSH: return 'ssh';
      }

      return 'generic';
    },

    dataComponent() {
      return require(`@/edit/secret/${ this.typeKey }`).default;
    },

    // array of id, label, description, initials for type selection step
    secretSubTypes() {
      const out = [];

      this.types.forEach((type) => {
        const displayType = this.typeDisplay(type);

        const subtype = {
          id:          type,
          label:       displayType,
          bannerAbbrv: this.initialDisplayFor(type)
        };

        out.push(subtype);
      });

      return out;
    },

    namespaces() {
      return this.$store.getters['cluster/all'](NAMESPACE).map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      });
    },

    hideSensitiveData() {
      return this.$store.getters['prefs/get'](HIDE_SENSITIVE);
    },

    dataLabel() {
      switch (this.value._type) {
      case TYPES.TLS:
        return this.t('secret.certificate.certificate');
      case TYPES.SSH:
        return this.t('secret.ssh.keys');
      case TYPES.BASIC:
        return this.t('secret.authentication');
      default:
        return this.t('secret.data');
      }
    }
  },

  methods: {
    saveSecret(buttonCb) {
      this.save(buttonCb);
    },

    selectType(type) {
      this.$set(this.value, '_type', type);
      this.$emit('set-subtype', this.typeDisplay(type));
    },

    typeDisplay(type) {
      const fallback = type.replace(/^kubernetes.io\//, '');

      return this.$store.getters['i18n/withFallback'](`secret.types."${ type }"`, null, fallback);
    },

    initialDisplayFor(type) {
      const fallback = (this.typeDisplay(type) || '').replace(/[^A-Z]/g, '') || type;

      return this.$store.getters['i18n/withFallback'](`secret.initials."${ type }"`, null, fallback);
    },
  },
};
</script>

<template>
  <form>
    <CruResource
      :mode="mode"
      :validation-passed="true"
      :selected-subtype="value._type"
      :resource="value"
      :errors="errors"
      :done-route="doneRoute"
      :subtypes="secretSubTypes"
      @finish="saveSecret"
      @select-type="selectType"
      @error="e=>errors = e"
    >
      <NameNsDescription v-model="value" :mode="mode" />

      <div class="spacer"></div>
      <Tabbed :side-tabs="true" default-tab="data">
        <Tab name="data" :label="dataLabel">
          <component :is="dataComponent" v-if="true" :value="value" :mode="mode" :hide-sensitive-data="hideSensitiveData" />
        </Tab>
        <Tab name="labels" :label="t('generic.labelsAndAnnotations')">
          <Labels v-model="value" :mode="mode" />
        </Tab>
      </Tabbed>
    </CruResource>
  </form>
</template>

<style lang='scss'>
</style>
