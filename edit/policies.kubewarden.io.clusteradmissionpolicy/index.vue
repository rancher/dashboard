<script>
import { KUBEWARDEN, SCHEMA } from '@/config/types';
import { _EDIT } from '@/config/query-params';
import { clone } from '@/utils/object';
import { createYaml } from '@/utils/create-yaml';
import Loading from '@/components/Loading';
import CruResource from '@/components/CruResource';
import questions from '@/.questions/questions.json';
import ClusterAdmissionPolicy from './ClusterAdmissionPolicy';

export default {
  name: 'CruClusterAdmissionPolicy',

  props: {
    value: {
      type:     Object,
      required: true
    },

    mode: {
      type:    String,
      default: 'create'
    }
  },

  components: {
    Loading, CruResource, ClusterAdmissionPolicy
  },

  data() {
    let type = this.$route.params.resource;

    if (type === KUBEWARDEN.CLUSTER_ADMISSION_POLICY) {
      type = null;
    }

    return { type };
  },

  computed: {

    isEdit() {
      return this.mode === _EDIT;
    },

    capSubtypes() {
      const out = [];

      for (const key in KUBEWARDEN.SPOOFED) {
        const type = KUBEWARDEN.SPOOFED[key];

        if (type !== KUBEWARDEN.SPOOFED.POLICY) {
          const shortType = type.replace(`${ KUBEWARDEN.SPOOFED.POLICY }.`, '');

          // console.log('subtype key: ', key, '|| shortType: ', shortType);

          const subtype = {
            key,
            id:          type,
            description: `kubewarden.policyCharts.${ shortType }`,
            label:       shortType,
            bannerAbbrv: shortType.charAt(0)
          };

          out.push(subtype);
        }
      }

      return out;
    },

    // ************************************************************
    //
    // I need to get the subtypes to show up in the store... ie. /k8s/clusters/<cluster-id>/v1/<subtype>
    // right now none of them exist, which is odd. I need to figure out how to create the types correctly it seems.
    //
    // ************************************************************

    generateYaml() {
      return () => {
        // console.log('generateYaml this.value: ', JSON.parse(JSON.stringify(this.value)), this.type);
        const resource = this.value;

        const schemas = [questions];
        const clonedResource = clone(resource);

        delete clonedResource.isSpoofed;

        if (this.type) {
          const out = createYaml(schemas, this.type, clonedResource);

          console.log('generateYaml out: ', out);

          return out;
        }
      };
    },
  },

  methods: {

    // ************************************************************
    //
    // what I need to do here is to pass the subtype to the generateYaml() function.
    //
    // base cluster admission policy type:
    // /k8s/clusters/<cluster-id>/v1/schemas/policies.kubewarden.io.clusteradmissionpolicy
    // /k8s/clusters/<cluster-id>/v1/schemas/policies.kubewarden.io.v1alpha2.clusteradmissionpolicy.spec
    // /k8s/clusters/<cluster-id>/v1/schemas/policies.kubewarden.io.v1alpha2.clusteradmissionpolicy.rules
    //
    // ************************************************************

    selectType(type) {
      if (!this.type && type) {
        this.$router.replace({ params: { resource: type } });
      } else {
        this.type = type;
      }
    },
  }
};
</script>

<template>
  <!-- <Loading v-if="$fetchState.pending" /> -->

  <form>
    <!-- <CruResource
      :mode="mode"
      :selected-subtype="type"
      :resource="value"
      :subtypes="capSubtypes"
      :generate-yaml="generateYaml"
      @select-type="selectType"
    > -->
    <CruResource
      :mode="mode"
      :selected-subtype="type"
      :resource="value"
      :subtypes="capSubtypes"
      @select-type="selectType"
    >
      <ClusterAdmissionPolicy
        :value="value"
        :mode="mode"
        :resource="type"
      />
    </CruResource>
  </form>
</template>
