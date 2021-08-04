<script>
import { mapGetters } from 'vuex';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Footer from '@/components/form/Footer';
import InfoBox from '@/components/InfoBox';
import NameNsDescription from '@/components/form/NameNsDescription';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import CreateEditView from '@/mixins/create-edit-view';
import { HCI as HCI_LABELS_ANNOTATIONS } from '@/config/labels-annotations';
import { HCI } from '@/config/types';

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
    const hostNetworks = await this.$store.dispatch('virtual/findAll', { type: HCI.NODE_NETWORK });
    const hostNetowrkResource = hostNetworks.find( O => this.value.id === O.attachNodeName);

    if (hostNetowrkResource) {
      this.hostNetowrkResource = hostNetowrkResource;
      this.nic = hostNetowrkResource.spec?.nic;
      this.type = hostNetowrkResource.spec?.type;
      this.nics = hostNetowrkResource.nics;
    }
  },
  data() {
    const customName = this.value.metadata?.annotations?.[HCI_LABELS_ANNOTATIONS.HOST_CUSTOM_NAME] || '';

    return {
      hostNetowrkResource: null,
      customName,
      type:                'vlan',
      nic:                 '',
      nics:                []
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    nicsOptions() {
      return this.nics.map( (N) => {
        const isRecommended = N.usedByManagementNetwork ? this.$store.getters['i18n/t']('harvester.host.detail.notRecommended') : '';

        return {
          value:                   N.name,
          label:                   `${ N.name }    (${ isRecommended })`,
          state:                   N.state,
          usedByManagementNetwork: N.usedByManagementNetwork,
        };
      });
    }
  },
  watch: {
    customName(neu) {
      this.value.setAnnotation(HCI_LABELS_ANNOTATIONS.HOST_CUSTOM_NAME, neu);
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
      <Tab name="basics" :weight="100" :label="t('harvester.host.tabs.basics')">
        <LabeledInput
          v-model="customName"
          :label="t('harvester.host.detail.customName')"
          class="mb-20"
          :mode="mode"
        />
      </Tab>
      <Tab name="network" :weight="90" :label="t('harvester.host.tabs.network')">
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
              >
                <template v-slot:option="option">
                  <template>
                    <div class="nicOption">
                      <span>{{ option.value }} </span><span>{{ option.state }}</span> <span class="pull-right">{{ option.usedByManagementNetwork ? t('harvester.host.detail.notRecommended') : '' }}</span>
                    </div>
                  </template>
                </template>
              </LabeledSelect>
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
.nicOption {
  display: flex;
  justify-content: space-between;
}
</style>
