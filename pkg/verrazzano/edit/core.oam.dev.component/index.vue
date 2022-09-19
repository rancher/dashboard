<script>
// Added by Verrazzano
import ConfigMap from '@pkg/edit/core.oam.dev.component/ConfigMap';
import Deployment from '@pkg/edit/core.oam.dev.component/Deployment';
import ContainerizedWorkload from '@pkg/edit/core.oam.dev.component/ContainerizedWorkload';
import CruResource from '@shell/components/CruResource';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Service from '@pkg/edit/core.oam.dev.component/Service';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import VerrazzanoCoherenceWorkload from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';
import VerrazzanoHelidonWorkload from '@pkg/edit/core.oam.dev.component/VerrazzanoHelidonWorkload';
import VerrazzanoWebLogicWorkload from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload';
import Secret from '@pkg/edit/core.oam.dev.component/Secret';

const TAB_WEIGHT_MAP = {
  general:              99,
  containers:           98,
};

const creatableTypes = [
  'VerrazzanoCoherenceWorkload',
  'VerrazzanoHelidonWorkload',
  'VerrazzanoWebLogicWorkload',
  'ContainerizedWorkload',
  'ConfigMap',
  'Secret',
  'Deployment',
  'Service',
];

export default {
  name:       'VzComponent',
  components: {
    ConfigMap,
    ContainerizedWorkload,
    CruResource,
    Deployment,
    LabeledInput,
    LabeledSelect,
    Loading,
    NameNsDescription,
    Service,
    Tab,
    Tabbed,
    VerrazzanoCoherenceWorkload,
    VerrazzanoHelidonWorkload,
    VerrazzanoWebLogicWorkload,
    Secret,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:    String,
      default: 'create'
    }
  },
  data() {
    return {
      componentType: this.value.spec?.workload?.kind || '',
      tabWeightMap:  TAB_WEIGHT_MAP,
    };
  },
  computed: {
    // array of id, label, description, initials for type selection step
    componentSubTypes() {
      const out = [];

      for (const creatableType of creatableTypes) {
        out.push({
          id:          creatableType,
          label:       this.t(`verrazzano.types.${ creatableType }`),
          bannerAbbrv: this.t(`verrazzano.typeAbbreviations.${ creatableType }`),
          description: this.t(`verrazzano.typeDescriptions.${ creatableType }.description`),
          docLink:     this.t(`verrazzano.typeDescriptions.${ creatableType }.docLink`)
        });
      }

      return out;
    },
  },
  methods: {
    selectType(creatableType) {
      this.componentType = creatableType;
    }
  }
};
</script>

<template>
  <form class="tree-tabbed-form">
    <CruResource
      :mode="mode"
      :validation-passed="true"
      :selected-subtype="componentType"
      :resource="value"
      :errors="errors"
      :subtypes="componentSubTypes"
      :done-route="doneRoute"
      @finish="save"
      @select-type="selectType"
      @error="e => errors = e"
    >
      <NameNsDescription v-model="value" :mode="mode" />
      <component :is="componentType" :value="value" :mode="mode" />
    </CruResource>
  </form>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
