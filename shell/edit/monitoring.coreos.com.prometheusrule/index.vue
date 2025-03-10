<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import { removeAt } from '@shell/utils/array';
import { Banner } from '@components/Banner';
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import UnitInput from '@shell/components/form/UnitInput';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import GroupRules from './GroupRules';
import { toSeconds } from '@shell/utils/duration';

export default {
  components: {
    Banner,
    CruResource,
    GroupRules,
    LabeledInput,
    NameNsDescription,
    Tab,
    Tabbed,
    UnitInput,
  },

  mixins: [CreateEditView, FormValidation],

  inheritAttrs: false,

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },

  data() {
    return {
      fvFormRuleSets:      [{ path: 'metadata.name', rules: ['dnsLabel'] }],
      closedErrorMessages: []
    };
  },

  computed: {
    filteredGroups() {
      return this.value?.spec?.groups || [];
    },
    errorMessages() {
      if (this.mode === _VIEW && (this.value?.metadata?.name || '').includes('.')) {
        return [this.t('validation.prometheusRule.noEdit')];
      }

      return this.fvUnreportedValidationErrors.filter((e) => !this.closedErrorMessages.includes(e));
    }
  },

  mounted() {
    if (this.isCreate) {
      this.value['spec'] = { groups: [] };
      this.addRuleGroup();
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');

    if (this.mode === _CREATE) {
      this.value.metadata['namespace'] = 'cattle-monitoring-system';
    }
  },

  methods: {
    addRuleGroup() {
      this.value.spec.groups.push({
        name:     '',
        interval: null,
        rules:    [],
      });
    },
    removeGroupRule(idx) {
      removeAt(this.value.spec.groups, idx);
    },
    ruleGroupLabel(idx) {
      return this.t('prometheusRule.groups.groupRowLabel', { index: idx + 1 });
    },
    willSave() {
      this.value.spec.groups.forEach((group) => {
        if (isEmpty(group.interval)) {
          delete group.interval;
        } else {
          const interval = group.interval;

          if (isString(interval)) {
            group['interval'] = interval.includes('s') ? interval : `${ interval }s`;
          } else {
            group['interval'] = `${ interval }s`;
          }
        }
      });

      this.closedErrorMessages = [];

      return true;
    },

    updateGroupInterval(group, interval) {
      group['interval'] = [null, undefined].includes(interval) ? undefined : `${ interval }s`;
    },

    getGroupInterval(interval) {
      if (![null, undefined].includes(interval)) {
        // see:
        // https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/#rule
        // https://prometheus.io/docs/prometheus/latest/configuration/configuration/#duration
        return toSeconds(interval);
      }
    }
  },
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :errors="errorMessages"
    :mode="mode"
    :resource="value"
    :validation-passed="fvFormIsValid"
    @error="(_, closedError) => closedErrorMessages.push(closedError)"
    @finish="save"
  >
    <div class="row">
      <div class="col span-12">
        <NameNsDescription
          v-if="!isView"
          :value="value"
          :mode="mode"
          :rules="{ name: fvGetAndReportPathRules('metadata.name'), namespace: [], description: [] }"
          @change="name = value.metadata.name"
        />
      </div>
    </div>
    <div>
      <Tabbed
        v-if="filteredGroups.length > 0"
        :side-tabs="true"
        :show-tabs-add-remove="mode !== 'view'"
        @addTab="addRuleGroup"
        @removeTab="removeGroupRule"
      >
        <Tab
          v-for="(group, idx) in filteredGroups"
          :key="idx"
          :name="'group-' + idx"
          :label="ruleGroupLabel(idx)"
          class="container-group"
        >
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                v-model:value="group.name"
                :label="t('prometheusRule.groups.name')"
                :mode="mode"
                :required="true"
                :data-testid="`v2-monitoring-prom-rules-group-name-${idx}`"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-6">
              <UnitInput
                :value="getGroupInterval(group.interval)"
                :suffix="t('suffix.seconds', {count: group.interval})"
                :placeholder="
                  t('prometheusRule.groups.groupInterval.placeholder')
                "
                :label="t('prometheusRule.groups.groupInterval.label')"
                :mode="mode"
                :data-testid="`v2-monitoring-prom-rules-group-interval-${idx}`"
                @update:value="(e) => updateGroupInterval(filteredGroups[idx], e)"
              />
            </div>
          </div>
          <GroupRules
            v-model:value="group.rules"
            class="mb-20"
            :mode="mode"
          />
        </Tab>
      </Tabbed>
      <Banner
        v-else
        color="warning"
        :label="t('prometheusRule.groups.none')"
      />
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
.container-group {
  position: relative;

  .remove {
    position: absolute;
    top: -40px;
    right: 5px;
  }

  .row:not(:first-child) {
    margin-top: 20px;
  }
}
</style>
