<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import { PROVIDER, REGISTER, _FLAGGED } from '@/config/query-params';
import Rke2 from '@/components/cluster/rke2';

export default {
  name: 'CruCluster',

  components: {
    CruResource,
    Loading,
    NameNsDescription,
    Rke2,
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:     String,
      required: true,
    },
  },

  fetch() {
    return Promise.resolve();
  },

  data() {
    const subType = this.$route.query[PROVIDER] || null;
    const isRegister = this.$route.query[REGISTER] === _FLAGGED;

    if ( subType ) {
      this.selectType(subType);
    }

    return {
      subType,
      isRegister
    };
  },

  computed: {
    subTypes() {
      const out = [];

      // @TODO come from somewhere dynamic...
      const createTypes = ['amazonec2', 'amazoneks', 'custom'];
      const registerTypes = ['amazoneks', 'googlegke', 'azureaks'];

      const types = this.isRegister ? registerTypes : createTypes;

      types.forEach((type) => {
        const label = this.$store.getters['i18n/withFallback'](`cluster.provider."${ type }"`, null, type);

        const subtype = {
          id:          type,
          bannerAbbrv: type,
          label,
        };

        out.push(subtype);
      });

      return out;
    },
  },

  methods: {
    selectType(type) {
      this.subType = type;
      this.$emit('set-subtype', this.$store.getters['i18n/withFallback'](`cluster.provider."${ type }"`, null, type));
    },

    save() {
      debugger;
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :mode="mode"
    :validation-passed="true"
    :selected-subtype="subType"
    :resource="value"
    :errors="errors"
    :done-route="doneRoute"
    :subtypes="subTypes"
    @finish="save"
    @select-type="selectType"
    @error="e=>errors = e"
  >
    <NameNsDescription v-if="!isView" v-model="value" :mode="mode" :namespaced="isNamespaced" />

    <Rke2
      v-model="value"
      :mode="mode"
      :provider="subType"
    />
  </CruResource>
</template>
