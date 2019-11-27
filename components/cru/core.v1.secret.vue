<script>
import CreateEditView from '@/mixins/create-edit-view';
import NameNsDescription from '@/components/form/NameNsDescription';
import Footer from '@/components/form/Footer';
import KeyValue from '@/components/form/KeyValue';

export default {
  name: 'CruSecret',

  components: {
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
      name-label="Secret Name"
      :register-before-hook="registerBeforeHook"
    />

    <div class="row">
      <div class="col span-12">
        <KeyValue
          key="data"
          v-model="value.data"
          :mode="mode"
          title="Data"
          :initial-empty-row="true"
          :value-base64="true"
        />
      </div>
    </div>

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
</template>
