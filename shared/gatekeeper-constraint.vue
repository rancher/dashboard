<script>
import LabelSelector from '@/components/form/LabelSelector';
import MatchKinds from '@/components/form/MatchKinds';
import NamespaceSelector from '@/components/form/NamespaceSelector';
import NameNsDescription from '@/components/form/NameNsDescription';
import CreateEditView from '@/mixins/create-edit-view';
import KeyValue from '@/components/form/KeyValue';
import NamespaceList from '@/components/form/NamespaceList';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import Footer from '@/components/form/Footer';

export default {
  components: {
    Footer,
    KeyValue,
    LabelSelector,
    MatchKinds,
    NameNsDescription,
    NamespaceList,
    NamespaceSelector,
    Tab,
    Tabbed
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true
    }
  },

  data() {
    return { localValue: this.value };
  },

  created() {
    const value = this.value;

    value.spec = value.spec || {};
    value.spec.parameters = value.spec.parameters || {};
    value.spec.match = value.spec.match || {};
    value.spec.match.kinds = value.spec.match.kinds || [];
    value.spec.match.namespaces = value.spec.match.namespaces || [];
    value.spec.match.excludedNamespaces = value.spec.match.excludedNamespaces || [];
    value.spec.match.labelSelector = value.spec.match.labelSelector || {};
    value.spec.match.labelSelector.matchExpressions = value.spec.match.labelSelector.matchExpressions || [];
    value.spec.match.namespaceSelector = value.spec.match.namespaceSelector || {};
    value.spec.match.namespaceSelector.matchExpressions = value.spec.match.namespaceSelector.matchExpressions || [];

    this.$emit('input', value);
  }
};
</script>
<template>
  <div>
    <div>
      <NameNsDescription :value="value" :mode="mode" :namespaced="false" />
    </div>
    <br />
    <div>
      <h2>Parameters</h2>
      <KeyValue
        v-model="localValue.spec.parameters"
        :value-multiline="false"
        :mode="mode"
        :pad-left="false"
        :read-allowed="false"
        :as-map="true"
        add-label="Add Parameter"
        :protip="false"
      />
    </div>
    <br />
    <br />
    <div class="match">
      <h2>Match</h2>
      <Tabbed default-tab="labels">
        <Tab name="namespaces" label="Namespaces">
          <div class="row">
            <div class="col span-6">
              <h4>Namespaces</h4>
              <NamespaceList v-model="localValue.spec.match.namespaces" :mode="mode" />
            </div>
            <div class="col span-6">
              <h4>Excluded Namespaces</h4>
              <NamespaceList v-model="localValue.spec.match.excludedNamespaces" :mode="mode" />
            </div>
          </div>
        </Tab>
        <Tab name="selectors" label="Selectors">
          <div class="row">
            <div class="col span-6">
              <h4>Label Selector</h4>
              <LabelSelector v-model="localValue.spec.match.labelSelector.matchExpressions" :mode="mode" />
            </div>
            <div class="col span-6">
              <h4>Namespace Selector</h4>
              <NamespaceSelector v-model="localValue.spec.match.namespaceSelector.matchExpressions" :mode="mode" />
            </div>
          </div>
        </Tab>
        <Tab name="kinds" label="Kinds">
          <MatchKinds v-model="localValue.spec.match.kinds" :mode="mode" />
        </Tab>
      </Tabbed>
    </div>
    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </div>
</template>
