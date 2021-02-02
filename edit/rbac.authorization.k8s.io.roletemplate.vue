<script>
import { RBAC } from '@/config/types';
import CruResource from '@/components/CruResource';
import CreateEditView from '@/mixins/create-edit-view';
import RadioGroup from '@/components/form/RadioGroup';
import Select from '@/components/form/Select';
import LabeledInput from '@/components/form/LabeledInput';
import ArrayList from '@/components/form/ArrayList';
import NameNsDescription from '@/components/form/NameNsDescription';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import { SUBTYPE_MAPPING, VERBS } from '@/models/rbac.authorization.k8s.io.roletemplate';

export default {
  components: {
    ArrayList,
    CruResource,
    LabeledInput,
    RadioGroup,
    Select,
    NameNsDescription,
    Tab,
    Tabbed
  },

  mixins: [CreateEditView],

  async fetch() {
    this.templateOptions = (await this.$store.dispatch('cluster/findAll', { type: RBAC.SPOOFED.ROLE_TEMPLATE }))
      .filter(template => template.subtype !== SUBTYPE_MAPPING.GLOBAL.key)
      .map(option => ({
        label: option.nameDisplay,
        value: option.id
      }));
  },

  data() {
    const subtypes = Object.values(SUBTYPE_MAPPING).map(mapping => ({
      ...mapping,
      label:       this.t(mapping.labelKey),
      bannerAbbrv: this.t(mapping.bannerAbbrvKey)
    }));

    this.$set(this.value, 'rules', this.value.rules || []);
    this.$set(this.value, 'roleTemplateIds', this.value.roleTemplateIds || []);
    this.$set(this.value, 'newUserDefault', !!this.value.newUserDefault);
    this.$set(this.value, 'locked', !!this.value.locked);

    this.value.rules.forEach((rule) => {
      if (rule.verbs[0] === '*') {
        this.$set(rule, 'verbs', [...VERBS]);
      }
    });

    const currentSubtype = subtypes.find(subtype => subtype.id === this.value.subtype)?.key;

    this.$nextTick(() => {
      if (currentSubtype) {
        this.selectType(currentSubtype);
      }
    });

    return {
      subtypes,
      defaultRule: {
        apiGroups:       [],
        nonResourceURLs: [],
        resourceNames:   [],
        resources:       [],
        verbs:           []
      },
      verbOptions:     VERBS,
      SUBTYPE_MAPPING,
      templateOptions: []
    };
  },
  computed: {
    defaultLabel() {
      return this.t(`rbac.roletemplate.subtypes.${ this.value.subtype }.defaultLabel`);
    },
    lockedOptions() {
      return [
        {
          value: true,
          label: this.t('rbac.roletemplate.locked.yes')
        },
        {
          value: false,
          label: this.t('rbac.roletemplate.locked.no')
        }
      ];
    },
    resourceOptions() {
      return this.value.resources.map(resource => ({
        value: resource.toLowerCase(),
        label: resource
      }));
    },
    newUserDefaultOptions() {
      return [
        {
          value: true,
          label: this.t(`rbac.roletemplate.subtypes.${ this.value.subtype }.yes`)
        },
        {
          value: false,
          label: this.t('rbac.roletemplate.newUserDefault.no')
        }
      ];
    },
    isRancherSubtype() {
      return this.value.subtype !== SUBTYPE_MAPPING.GLOBAL.key;
    }
  },
  methods: {
    selectType(type) {
      this.value.updateSubtype(type);

      this.$emit('set-subtype', this.subtypes.find(subtype => subtype.id === type).label);
    },

    getVerb(verb, rule) {
      const verbs = rule.verbs || [];

      return verbs.includes(verb);
    },

    setVerb(verb, value, rule) {
      this.$set(rule.verbs, rule.verbs || []);

      if (value) {
        const index = rule.verbs.indexOf(verb);

        if (index === -1) {
          rule.verbs.push(verb);
        }
      } else {
        const index = rule.verbs.indexOf(verb);

        if (index !== -1) {
          rule.verbs.splice(index, 1);
        }
      }
    },
    setRule(key, rule, event) {
      const value = event.label ? event.label : event;

      this.$set(rule, key, [value]);
    },
    getRule(key, rule) {
      return rule[key]?.[0] || null;
    },
    updateSelectValue(row, key, event) {
      const value = event.label ? event.value : event;

      this.$set(row, key, value);
    }
  }
};
</script>

<template>
  <CruResource
    class="receiver"
    :can-yaml="!isCreate"
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :selected-subtype="value.subtype"
    :subtypes="subtypes"
    :errors="errors"
    @select-type="selectType"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      v-model="value"
      :namespaced="false"
      :mode="mode"
      label="Name"
    />
    <div class="row">
      <div v-if="isRancherSubtype" class="col span-6">
        <RadioGroup
          v-model="value.locked"
          name="storageSource"
          :label="t('rbac.roletemplate.locked.label')"
          class="mb-10"
          :options="lockedOptions"
        />
      </div>
      <div class="col span-6">
        <RadioGroup
          :value="value.default"
          name="storageSource"
          :label="defaultLabel"
          class="mb-10"
          :options="newUserDefaultOptions"
          @input="value.updateDefault"
        />
      </div>
    </div>
    <div class="spacer"></div>
    <Tabbed :side-tabs="true">
      <Tab
        name="grant-resources"
        label="Grant Resources"
        :weight="1"
      >
        <ArrayList
          v-model="value.rules"
          label="Resources"
          :default-add-value="defaultRule"
          :initial-empty-row="true"
          :show-header="true"
          add-label="Add Resource"
        >
          <template #column-headers>
            <div class="column-headers row">
              <div class="col span-3">
                <label class="text-label">Verbs</label>
              </div>
              <div class="col span-3">
                <label class="text-label">Resources</label>
              </div>
              <div class="col span-3">
                <label class="text-label">Non-Resource URLS</label>
              </div>
              <div class="col span-3">
                <label class="text-label">API Groups</label>
              </div>
            </div>
          </template>
          <template #columns="props">
            <div class="columns row">
              <div class="col span-3">
                <Select
                  :value="props.row.value.verbs"
                  class="lg"
                  :taggable="true"
                  :searchable="true"
                  :options="verbOptions"
                  :multiple="true"
                  @input="updateSelectValue(props.row.value, 'verbs', $event)"
                />
              </div>
              <div class="col span-3">
                <Select
                  :value="getRule('resources', props.row.value)"
                  :options="resourceOptions"
                  :searchable="true"
                  :taggable="true"
                  :mode="mode"
                  @input="setRule('resources', props.row.value, $event)"
                />
              </div>
              <div class="col span-3">
                <LabeledInput
                  :value="getRule('nonResourceURLs', props.row.value)"
                  :mode="mode"
                  @input="setRule('nonResourceURLs', props.row.value, $event)"
                />
              </div>
              <div class="col span-3">
                <LabeledInput
                  :value="getRule('apiGroups', props.row.value)"
                  :mode="mode"
                  @input="setRule('apiGroups', props.row.value, $event)"
                />
              </div>
            </div>
          </template>
        </ArrayList>
      </Tab>
      <Tab
        v-if="isRancherSubtype"
        name="inherit-from"
        label="Inherit From"
        :weight="0"
      >
        <ArrayList
          v-model="value.roleTemplateIds"
          label="Resources"
          add-label="Add Resource"
        >
          <template #columns="props">
            <div class="columns row">
              <div class="col span-12">
                <Select
                  v-model="props.row.value"
                  class="lg"
                  :taggable="false"
                  :searchable="true"
                  :options="templateOptions"
                  option-key="value"
                  option-label="label"
                />
              </div>
            </div>
          </template>
        </ArrayList>
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<style lang="scss" scoped>
  ::v-deep {
    .column-headers {
      margin-right: 75px;
    }

    .box {
      align-items: initial;

      .remove button {
        margin-top: $input-height / 4;
      }
    }

    .columns {
      & > .col {
        &:not(:first-of-type) {
          height: $input-height;
        }

        &:first-of-type {
          min-height: $input-height;
        }

        & > * {
          height: 100%;
        }
      }
    }
  }
</style>
