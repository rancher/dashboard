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
import Tab from '@/components/Tabbed/Tab';
import Conditions from '@/components/form/Conditions';
import DetailTop from '@/components/DetailTop';
import LinkDetail from '@/components/formatter/LinkDetail';
import LiveDate from '@/components/formatter/LiveDate';
import ResourceYaml from '@/components/ResourceYaml';
import { get } from '../utils/object';

export default {
  components: {
    ResourceTabs,
    Tab,
    Conditions,
    DetailTop,
    LinkDetail,
    LiveDate,
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
    const { metadata:{ ownerReferences = [] } } = this.value;

    const ownersByType = {};

    // gather ownerrefs by 'kind' field
    ownerReferences.forEach((owner) => {
      if (!ownersByType[owner.kind]) {
        ownersByType[owner.kind] = [owner];
      } else {
        ownersByType[owner.kind].push(owner);
      }
    });

    return {
      ownersByType, owners: [], yaml: ''
    };
  },

  computed: {
    detailTopColumns() {
      const t = this.$store.getters['i18n/t'];

      const out = [
        {
          title:   t('resourceDetail.detailTop.created'),
          content: get(this.value, 'metadata.creationTimestamp'),
          name:    'created'
        }];

      if (get(this.value, 'metadata.deletionTimestamp')) {
        out.push( {
          title:   t('resourceDetail.detailTop.deleted'),
          content: get(this.value, 'metadata.deletionTimestamp'),
          name:    'deleted'
        });
      }

      if (this.owners.length) {
        out.unshift({
          title: t('resourceDetail.detailTop.ownerReferences'),
          name:  'ownerReferences'
        });
      }

      return out;
    },
  },
  mounted() {
    this.findOwners();
    this.findYaml();
  },

  methods: {
    async findOwners() {
      /*
        all we have is api version, kind, and uid, but we can't query by uid :(
        find all of each kind of ownerref present, then find each specific ownerref by metadata.uid
      */
      for ( const kind in this.ownersByType) {
        const schema = this.$store.getters['cluster/schema'](kind);

        if (schema) {
          const type = schema.id;
          const allOfResourceType = await this.$store.dispatch('cluster/findAll', { type });

          this.ownersByType[kind].forEach((resource, idx) => {
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
    <DetailTop :columns="detailTopColumns">
      <template #ownerReferences>
        <LinkDetail v-for="owner in owners" :key="owner.id" :row="owner" :col="{}" :value="value.metadata.name" />
      </template>
      <template #created>
        <LiveDate :value="get(value, 'metadata.creationTimestamp')" :add-suffix="true" />
      </template>
      <template #deleted>
        <LiveDate :value="get(value, 'metadata.deletionTimestamp')" :add-suffix="true" />
      </template>
    </DetailTop>
    <ResourceTabs v-model="value" class="mt-20" mode="view">
      <template #before>
        <Tab v-if="!!(value.status||{}).conditions" label="Conditions" name="conditions">
          <Conditions :value="value" />
        </Tab>
      </template>
    </ResourceTabs>
    <div id="yaml-container">
      <h3 class="mb-10 mt-20">
        YAML
      </h3>
      <ResourceYaml v-if="yaml.length" :value="value" mode="view" :yaml="yaml" :show-footer="false" />
    </div>
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
