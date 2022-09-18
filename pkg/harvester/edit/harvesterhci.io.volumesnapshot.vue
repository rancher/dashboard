<script>
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import { LabeledInput } from '@components/Form/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { get } from '@shell/utils/object';
import { HCI } from '../types';
import CreateEditView from '@shell/mixins/create-edit-view';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';

export default {
  name:       'HarvesterSnapshot',
  components: {
    LabeledInput,
    Tab,
    ResourceTabs,
    CruResource,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  computed: {
    volume() {
      return this.volumes.find((V) => {
        return V.metadata.name === this.targetVolume;
      });
    },

    size() {
      return this.value?.status?.restoreSize;
    },

    isImageVolume() {
      return !!get(this.value, `metadata.annotations."${ HCI_ANNOTATIONS.IMAGE_ID }"`);
    },

    imageName() {
      const image = this.$store.getters['harvester/all'](HCI.IMAGE).find((I) => {
        return I.id === get(this.value, `metadata.annotations."${ HCI_ANNOTATIONS.IMAGE_ID }"`);
      });

      return image?.spec?.displayName;
    },

    targetVolume() {
      return this.value?.spec?.source?.persistentVolumeClaimName;
    },
  },
};
</script>
<template>
  <div>
    <CruResource
      :done-route="doneRoute"
      :resource="value"
      :mode="mode"
      :errors="errors"
      :apply-hooks="applyHooks"
      @finish="save"
    >
      <NameNsDescription :value="value" :namespaced="true" :mode="mode" />
      <ResourceTabs
        v-model="value"
        class="mt-15"
        :need-conditions="false"
        :need-related="false"
        :side-tabs="true"
        :mode="mode"
      >
        <Tab name="basics" :label="t('harvester.virtualMachine.detail.tabs.basics')" class="bordered-table">
          <div class="row">
            <div class="col span-12">
              <LabeledInput v-model="size" :label="t('harvester.snapshot.size')" class="mt-20" :disabled="true" />
            </div>
          </div>
          <div class="row">
            <div class="col span-12">
              <LabeledInput v-model="targetVolume" :label="t('harvester.snapshot.targetVolume')" class="mt-20" :disabled="true" />
            </div>
          </div>
          <div v-if="isImageVolume" class="row">
            <div class="col span-12">
              <LabeledInput v-model="imageName" :label="t('harvester.snapshot.image')" class="mt-20" :disabled="true" />
            </div>
          </div>
        </Tab>
      </ResourceTabs>
    </CruResource>
  </div>
</template>
