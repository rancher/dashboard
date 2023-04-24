<script>
// Added by Verrazzano
import ApplicationComponentsTab from '@pkg/components/ApplicationComponentsTab';
import CruResource from '@shell/components/CruResource';
import KeyValue from '@shell/components/form/KeyValue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import TreeTabbed from '@pkg/components/TreeTabbed';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'VzApplication',
  components: {
    ApplicationComponentsTab,
    CruResource,
    KeyValue,
    LabeledInput,
    NameNsDescription,
    TreeTab,
    TreeTabbed,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
};
</script>

<template>
  <form class="tree-tabbed-form">
    <CruResource
      :validation-passed="true"
      :resource="value"
      :mode="mode"
      :errors="errors"
      :done-route="doneRoute"
      :apply-hooks="applyHooks"
      @finish="save"
      @error="e=>errors = e"
    >
      <div class="row">
        <div class="col span-12">
          <NameNsDescription
            :value="value"
            :extra-columns="[]"
            :mode="mode"
            description-key="metadata.annotations.description"
            @change="name=value.metadata.name"
          />
        </div>
      </div>
      <TreeTabbed>
        <template #nestedTabs>
          <TreeTab
            :label="t('verrazzano.common.tabs.metadata')"
            name="metadata"
          >
            <template #default>
              <div class="row">
                <div class="col span-4">
                  <LabeledInput
                    :value="getField('metadata.annotations.version')"
                    :mode="mode"
                    :placeholder="getNotSetPlaceholder(value, 'metadata.annotations.version')"
                    :label="t('verrazzano.common.fields.version')"
                    @input="setFieldIfNotEmpty('metadata.annotations.version', $event)"
                  />
                </div>
              </div>
              <div class="spacer" />
              <div>
                <KeyValue
                  :value="getField('metadata.labels')"
                  :mode="mode"
                  :read-allowed="false"
                  :title="t('verrazzano.common.titles.labels')"
                  :add-label="t('verrazzano.common.buttons.addLabel')"
                  @input="setFieldIfNotEmpty('metadata.labels', $event)"
                />
              </div>
            </template>
          </TreeTab>
          <ApplicationComponentsTab
            :value="getField('spec.components')"
            :mode="mode"
            :namespaced-object="value"
            tab-name="components"
            @input="setFieldIfNotEmpty('spec.components', $event)"
          />
        </template>
      </TreeTabbed>
    </CruResource>
  </form>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
