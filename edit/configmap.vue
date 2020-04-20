<script>
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Footer from '@/components/form/Footer';
import KeyValue from '@/components/form/KeyValue';
import Labels from '@/components/form/Labels';

export default {
  name: 'CruConfigMap',

  components: {
    Labels,
    NameNsDescription,
    KeyValue,
    Footer,
  },
  mixins:     [CreateEditView],
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
      <div class="col span-6">
        <KeyValue
          key="data"
          v-model="value.data"
          :mode="mode"
          title="Values"
          protip="Use this area for anything that's UTF-8 text data"
          :initial-empty-row="true"
        />
      </div>
    </div>

    <div class="spacer"></div>

    <div v-if="!isView || Object.keys(value.binaryData||{}).length" class="row">
      <div class="col span-6">
        <KeyValue
          key="binaryData"
          v-model="value.binaryData"
          title="Binary Values"
          protip="Use this area for binary or other data that is not UTF-8 text"
          :mode="mode"
          :add-allowed="false"
          :read-accept="'*'"
          :read-multiple="true"
          :value-binary="true"
          :value-base64="true"
          :value-can-be-empty="true"
          :initial-empty-row="false"
        />
      </div>
    </div>

    <Labels :spec="value" :mode="mode" />

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
</template>
