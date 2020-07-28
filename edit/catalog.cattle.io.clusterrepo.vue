<script>
import CreateEditView from '@/mixins/create-edit-view';
import Footer from '@/components/form/Footer';
import LabeledInput from '@/components/form/LabeledInput';
import NameNsDescription from '@/components/form/NameNsDescription';

export default {
  name: 'CruCatalogRepo',

  components: {
    Footer,
    LabeledInput,
    NameNsDescription,
  },

  mixins: [CreateEditView],
};
</script>

<template>
  <form>
    <NameNsDescription v-model="value" :mode="mode" />

    <LabeledInput
      v-model="value.spec.url"
      :required="true"
      :label="t('catalog.repo.url.label')"
      :placeholder="t('catalog.repo.url.placeholder', null, true)"
      :mode="mode"
    />

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
</template>
