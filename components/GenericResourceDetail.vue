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
import { get } from '../utils/object';
import ResourceTabs from '@/components/form/ResourceTabs';
import Tab from '@/components/Tabbed/Tab';
import Conditions from '@/components/form/Conditions';
import DetailTop from '@/components/DetailTop';
import OwnerReferences from '@/components/form/OwnerReferences';

export default {
  components: {
    ResourceTabs,
    Tab,
    Conditions,
    DetailTop,
    OwnerReferences
  },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
  },
  computed: {
    detailTopColumns() {
      return [
        {
          title:   'Created',
          content: get(this.value, 'metadata.creationTimestamp')
        },
        {
          title:   'Deleted',
          content: get(this.value, 'metadata.deletionTimestamp')
        }
      ];
    },

    finalizers() {
      return this.value?.metadata?.finalizers || [];
    }
  }
};
</script>
<template>
  <div>
    <DetailTop :columns="detailTopColumns" />
    <ResourceTabs v-model="value" mode="view">
      <template #before>
        <Tab label="Conditions" name="conditions">
          <Conditions v-model="value" />
        </Tab>
        <Tab label="Owner References" name="ownerReferences">
          <OwnerReferences v-model="value" />
        </Tab>
        <Tab label="Finalizers" name="finalizers">
          <table>
            <tbody>
              <tr v-for="string in finalizers" :key="string">
                <td> {{ string }}</td>
              </tr>
            </tbody>
          </table>
        </Tab>
      </template>
    </ResourceTabs>
  </div>
</template>
