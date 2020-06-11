<script>
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Footer from '@/components/form/Footer';
import KeyValue from '@/components/form/KeyValue';
import ResourceTabs from '@/components/form/ResourceTabs';
import Tab from '@/components/Tabbed/Tab';

export default {
  name: 'CruConfigMap',

  components: {
    NameNsDescription,
    KeyValue,
    Footer,
    ResourceTabs,
    Tab,
  },
  mixins: [CreateEditView],
};
</script>

<template>
  <form>
    <NameNsDescription
      :value="value"
      :mode="mode"
      name-label="Name"
      :register-before-hook="registerBeforeHook"
    />

    <div class="spacer"></div>
    
    <div v-if="!isView || Object.keys(value.data||{}).length" class="row">
      <KeyValue
        key="data"
        v-model="value.data"
        :mode="mode"
        :title="t('configmapPage.data.title')"
        :protip="t('configmapPage.data.protip')"
        :initial-empty-row="true"
      />
    </div>

    <div class="spacer"></div>

    <ResourceTabs v-model="value" :mode="mode">
      <template #before>
        <Tab :label="t('configmapPage.tabs.binaryData.label')" name="binary-data">
          <KeyValue
            key="binaryData"
            v-model="value.binaryData"
            :protip="false"
            :mode="mode"
            :add-allowed="false"
            :read-accept="'*'"
            :read-multiple="true"
            :value-binary="true"
            :value-base64="true"
            :value-can-be-empty="true"
            :initial-empty-row="false"
          />
        </Tab>
      </template>
    </ResourceTabs>

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
</template>
