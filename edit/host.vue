<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Footer from '@/components/form/Footer';
import InfoBox from '@/components/InfoBox';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import CreateEditView from '@/mixins/create-edit-view';
import { allHash } from '@/utils/promise';
import { HOST_CUSTOM_NAME } from '@/config/labels-annotations';
import { HCI } from '@/config/types';
import { get } from '@/utils/object';

export default {
  name:       'EditNode',
  components: {
    Footer,
    Tabbed,
    InfoBox,
    Tab,
    LabeledInput,
    LabeledSelect,
    NameNsDescription
  },
  mixins: [CreateEditView],
  props:  {
    value: {
      type:     Object,
      required: true,
    }
  },
  async fetch() {
    const hash = await allHash({ hostNetworks: this.$store.dispatch('cluster/findAll', { type: HCI.NODE_NETWORK }) });
    const hostNetowrkResource = hash.hostNetworks.find( O => this.value.id === O.attachNodeName);

    if (hostNetowrkResource) {
      this.hostNetowrkResource = hostNetowrkResource;
      this.nic = hostNetowrkResource.spec?.nic;
      this.type = hostNetowrkResource.spec?.type;
      this.physicalNics = hostNetowrkResource.physicalNics;
    }
  },
  data() {
    const customName = get(this.value, `metadata.annotations."${ HOST_CUSTOM_NAME }"`) || '';

    return {
      hostNetowrkResource: null,
      customName,
      type:                'vlan',
      nic:                 '',
      physicalNics:        []
    };
  },
  computed: {
    nicsOptions() {
      return this.physicalNics.map( (N) => {
        const isRecommended = N.usedByManagementNetwork ? '  (Not recommended)' : '';

        return {
          value: N.name,
          label: `${ N.name } ${ isRecommended } `
        };
      });
    }
  },
  watch: {
    customName(neu) {
      this.value.setAnnotation(HOST_CUSTOM_NAME, neu);
    },
  },
  created() {
    if (this.registerAfterHook) {
      this.registerAfterHook(this.saveHostNetwork);
    }
  },
  methods: {
    saveHostNetwork() {
      if (this.hostNetowrkResource) {
        this.hostNetowrkResource.save();
      }
    },
    update() {
      this.$set(this.hostNetowrkResource.spec, 'nic', this.nic);
    }
  },
};
</script>
<template>
  <div class="node">
    <NameNsDescription
      :value="value"
      :namespaced="false"
      :mode="mode"
    />
    <Tabbed ref="tabbed" class="mt-15" :side-tabs="true">
      <Tab name="basics" :weight="100" :label="t('harvester.vmPage.detail.tabs.basics')">
        <LabeledInput
          v-model="customName"
          :label="t('harvester.hostPage.detail.customName')"
          class="mb-20"
          :mode="mode"
        />
      </Tab>
      <Tab name="network" :weight="90" :label="t('harvester.hostPage.tabs.network')">
        <InfoBox class="wrapper">
          <div class="row warpper">
            <div class="col span-6">
              <LabeledInput
                v-model="type"
                label="Type"
                class="mb-20"
                :mode="mode"
                :disabled="true"
              />
            </div>
            <div class="col span-6">
              <LabeledSelect
                v-model="nic"
                :options="nicsOptions"
                :label="t('harvester.fields.PhysicalNic')"
                class="mb-20"
                :mode="mode"
                :disabled="!hostNetowrkResource"
                @input="update"
              />
            </div>
          </div>
        </InfoBox>
      </Tab>
    </Tabbed>
    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </div>
</template>
<style lang="scss" scoped>
.wrapper{
  position: relative;
}
</style>
