<script>
/*
  Fallback component to display if there is no custom detail page defined in '@/detail'
  Contains tabs for:
    * Conditions
    * OwnerReferences
    * Finalizers
    * Labels
    * Annotations
*/
import ResourceTabs from '@/components/form/ResourceTabs';
import ResourceYaml from '@/components/ResourceYaml';
import { get } from '@/utils/object';

export default {
  components: {
    ResourceTabs,
    ResourceYaml
  },

  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
  },

  data() {
    return { owners: [], yaml: '' };
  },

  mounted() {
    this.findOwners();
    this.findYaml();
  },

  methods: {
    async findOwners() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      /*
        all we have is api version, kind, and uid, but we can't query by uid :(
        find all of each kind of ownerref present, then find each specific ownerref by metadata.uid
      */
      for ( const kind in this.value.ownersByType) {
        const schema = this.$store.getters[`${ inStore }/schema`](kind);

        if (schema) {
          const type = schema.id;
          const allOfResourceType = await this.$store.dispatch(`${ inStore }/findAll`, { type });

          this.value.ownersByType[kind].forEach((resource, idx) => {
            const resourceInstance = allOfResourceType.filter(resource => resource?.metdata?.uid === resource.uid)[0];

            this.owners.push(resourceInstance);
          });
        }
      }
    },

    async findYaml() {
      const link = this.value.hasLink('rioview') ? 'rioview' : 'view';

      const yaml = (await this.value.followLink(link, { headers: { accept: 'application/yaml' } })).data;

      this.yaml = yaml;
    },

    get
  }
};
</script>
<template>
  <div id="generic-container">
    <div class="spacer"></div>
    <div id="yaml-container">
      <h2>
        YAML
      </h2>
      <ResourceYaml v-if="yaml.length" :value="value" mode="view" :yaml="yaml" :show-footer="false" />
    </div>
    <div class="spacer"></div>
    <ResourceTabs v-model="value" mode="view" />
  </div>
</template>

<style lang='scss'>
#generic-container {
  display: flex;
  flex-direction:column;
  flex-grow:1;

  & .resource-yaml{
    flex-grow:1;
    flex-basis: auto;
    -ms-overflow-style: none;
    overflow: scroll;
    max-height: 75vh;
    min-height:0px;

    &::-webkit-scrollbar {
    display: none;
    }
  }

    & .code-mirror .CodeMirror{
      position:relative;
      height: auto;
    }
}
</style>
