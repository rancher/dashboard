<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import DynamicTabHelper from '@pkg/mixins/dynamic-tab-helper';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { randomStr } from '@shell/utils/string';
import debounce from 'lodash/debounce';

export default {
  name:       'IngressTraitTab',
  components: {
    ArrayListGrouped,
    LabeledArrayList,
    LabeledInput,
    LabeledSelect,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper, DynamicTabHelper],
  props:  {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
    tabName: {
      type:     String,
      required: true,
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    const rules = (this.value.trait?.spec?.rules || []).map((rule) => {
      const newRule = this.clone(rule);

      newRule._id = randomStr(4);

      return newRule;
    });

    return {
      isLoading:       true,
      fetchInProgress: true,
      namespace:       this.namespacedObject.metadata.namespace,
      allSecrets:      {},
      secrets:         [],
      treeTabName:     this.tabName,
      treeTabLabel:    this.tabLabel,
      rules,
    };
  },
  async fetch() {
    const requests = {};

    if ( this.$store.getters['cluster/schemaFor'](SECRET) ) {
      requests.secrets = this.$store.dispatch('management/findAll', { type: SECRET });
    }

    const hash = await allHash(requests);

    if (hash.secrets) {
      this.sortObjectsByNamespace(hash.secrets, this.allSecrets);
    }
    this.fetchInProgress = false;
  },
  computed: {
    pathTypeOptions() {
      return [
        { value: 'prefix', label: this.t('verrazzano.common.types.pathType.prefix') },
        { value: 'exact', label: this.t('verrazzano.common.types.pathType.exact') },
        { value: 'regex', label: this.t('verrazzano.common.types.pathType.regex') },
      ];
    },
  },
  methods: {
    update() {
      const rules = [];

      this.rules.forEach((rule) => {
        const newRule = this.clone(rule);

        delete newRule._id;

        rules.push(newRule);
      });
      this.setFieldIfNotEmpty('trait.spec.rules', rules);
    },
    resetSecrets() {
      this.secrets = this.allSecrets[this.namespace] || [];
    },
    getRuleLabel(index) {
      return `${ this.t('verrazzano.common.titles.rule') } ${ index + 1 }`;
    },
    getRuleTabName(index) {
      return this.createTabName(this.treeTabName, `rule${ index + 1 }`);
    },
    addRule() {
      this.rules.push({ _id: randomStr(4) });
    },
    removeRule(index) {
      this.rules.splice(index, 1);
      this.queueUpdate();
    },
    setNestedFieldIfNotEmpty(nestedValue, field, value) {
      this.setDynamicTabFieldIfNotEmpty(nestedValue, field, value);
      this.queueUpdate();
    },
    setNestedNumberField(nestedValue, field, value) {
      this.setDynamicTabNumberField(nestedValue, field, value);
      this.queueUpdate();
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.ingressTrait');
    }

    this.queueUpdate = debounce(this.update, 500);
  },
  mounted() {
    this.isLoading = false;
  },
  watch: {
    fetchInProgress() {
      this.resetSecrets();
    },
    'value.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetSecrets();
    },
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :button-label="t('verrazzano.common.messages.removeTypeFromComponent', { type: 'IngressTrait' })"
        :mode="mode"
        @click="$emit('deleteTrait', 'IngressTrait')"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('trait.kind')"
            :mode="mode"
            disabled
            :label="t('verrazzano.common.fields.kind')"
            @input="setFieldIfNotEmpty('trait.kind', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            :value="getField('trait.spec.tls.secretName')"
            :mode="mode"
            :options="secrets"
            option-label="metadata.name"
            :reduce="secret => secret.metadata.name"
            :placeholder="getNotSetPlaceholder(value, 'trait.spec.tls.secretName')"
            :label="t('verrazzano.common.fields.secretName')"
            @input="setFieldIfNotEmpty('trait.spec.tls.secretName', $event)"
          />
        </div>
      </div>
      <div v-if="!isView">
        <div class="spacer" />
        <div class="row">
          <div class="col span-4">
            <button
              type="button"
              class="btn role-tertiary add"
              @click="addRule()"
            >
              {{ t('verrazzano.common.buttons.addIngressRule') }}
            </button>
          </div>
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <!-- insert tabs for the list of rules.  Name will be derived from their position in the list. -->
      <TreeTab
        v-for="(rule, idx) in rules"
        :key="rule._id"
        :label="getRuleLabel(idx)"
        :name="getRuleTabName(idx)"
      >
        <template #beside-header>
          <TabDeleteButton
            :element-name="t('verrazzano.common.tabs.ingressTraitRule')"
            :mode="mode"
            @click="removeRule(idx)"
          />
        </template>
        <template #default>
          <div>
            <div>
              <h3>{{ t('verrazzano.common.titles.hosts') }}</h3>
              <LabeledArrayList
                key="hosts"
                :value="getDynamicTabField(rule, 'hosts')"
                :mode="mode"
                :value-label="t('verrazzano.common.fields.host')"
                :add-label="t('verrazzano.common.buttons.addHost')"
                :protip="false"
                @input="setNestedFieldIfNotEmpty(rule, 'hosts', $event)"
              />
            </div>
            <div class="spacer" />
            <div>
              <ArrayListGrouped
                v-model="rule.paths"
                :mode="mode"
                :title="t('verrazzano.common.titles.paths')"
                :add-label="t('verrazzano.common.buttons.addPath')"
                :default-add-value="{}"
              >
                <template #default="props">
                  <div class="row">
                    <div class="col span-4">
                      <LabeledSelect
                        :value="props.row.value.pathType"
                        :mode="mode"
                        :options="pathTypeOptions"
                        option-key="value"
                        option-label="label"
                        :placeholder="getNotSetPlaceholder(props.row.value, 'pathType')"
                        :label="t('verrazzano.common.fields.pathType')"
                        @input="setNestedFieldIfNotEmpty(props.row.value, 'pathType', $event)"
                      />
                    </div>
                    <div class="col span-8">
                      <LabeledInput
                        :value="props.row.value.path"
                        :mode="mode"
                        :placeholder="getNotSetPlaceholder(props.row.value, 'path')"
                        :label="t('verrazzano.common.fields.pathExpression')"
                        @input="setNestedFieldIfNotEmpty(props.row.value, 'path', $event)"
                      />
                    </div>
                  </div>
                </template>
              </ArrayListGrouped>
            </div>
            <div class="spacer" />
            <div>
              <h3>{{ t('verrazzano.common.titles.destination') }}</h3>
              <div class="row">
                <div class="col span-6">
                  <LabeledInput
                    :value="getDynamicTabField(rule, 'destination.host')"
                    :mode="mode"
                    :placeholder="getNotSetPlaceholder(rule, 'destination.host')"
                    :label="t('verrazzano.common.fields.host')"
                    @input="setNestedFieldIfNotEmpty(rule, 'destination.host', $event)"
                  />
                </div>
                <div class="col span-6">
                  <LabeledInput
                    :value="getDynamicTabField(rule, 'destination.port')"
                    :mode="mode"
                    type="Number"
                    :min="minPortNumber"
                    :max="maxPortNumber"
                    :placeholder="getNotSetPlaceholder(rule, 'destination.port')"
                    :label="t('verrazzano.common.fields.port')"
                    @input="setNestedNumberField(rule, 'destination.port', $event)"
                  />
                </div>
              </div>
              <div class="spacer-small" />
              <div class="row">
                <div class="col span-4">
                  <LabeledInput
                    :value="getDynamicTabField(rule, 'destination.httpCookie.name')"
                    :mode="mode"
                    :placeholder="getNotSetPlaceholder(rule, 'destination.httpCookie.name')"
                    :label="t('verrazzano.common.fields.httpCookieName')"
                    @input="setNestedFieldIfNotEmpty(rule, 'destination.httpCookie.name', $event)"
                  />
                </div>
                <div class="col span-4">
                  <LabeledInput
                    :value="getDynamicTabField(rule, 'destination.httpCookie.path')"
                    :mode="mode"
                    :placeholder="getNotSetPlaceholder(rule, 'destination.httpCookie.path')"
                    :label="t('verrazzano.common.fields.httpCookiePath')"
                    @input="setNestedFieldIfNotEmpty(rule, 'destination.httpCookie.path', $event)"
                  />
                </div>
                <div class="col span-4">
                  <LabeledInput
                    :value="getDynamicTabField(rule, 'destination.httpCookie.ttl')"
                    :mode="mode"
                    type="Number"
                    :min="0"
                    :placeholder="getNotSetPlaceholder(rule, 'destination.httpCookie.ttl')"
                    :label="t('verrazzano.common.fields.httpCookieTTL')"
                    @input="setNestedFieldIfNotEmpty(rule, 'destination.httpCookie.ttl', $event)"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </TreeTab>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
