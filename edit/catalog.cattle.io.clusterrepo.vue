<script>
import CreateEditView from '@/mixins/create-edit-view';
import Footer from '@/components/form/Footer';
import LabeledInput from '@/components/form/LabeledInput';
import RadioGroup from '@/components/form/RadioGroup';
import NameNsDescription from '@/components/form/NameNsDescription';

export default {
  name: 'CruCatalogRepo',

  components: {
    Footer,
    RadioGroup,
    LabeledInput,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  data() {
    return { isGit: !!this.value.spec.gitRepo };
  },

};
</script>

<template>
  <form>
    <NameNsDescription v-model="value" :mode="mode" :namespaced="isNamespaced" />

    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-model="isGit"
          :options="[false, true]"
          :labels="[t('catalog.repo.target.http'), t('catalog.repo.target.git')]"
          :mode="mode"
        />
      </div>
    </div>

    <div v-if="isGit" class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.gitRepo"
          :required="true"
          :label="t('catalog.repo.gitRepo.label')"
          :placeholder="t('catalog.repo.gitRepo.placeholder', null, true)"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.gitBranch"
          :required="true"
          :label="t('catalog.repo.gitBranch.label')"
          :placeholder="t('catalog.repo.gitBranch.placeholder', null, true)"
          :mode="mode"
        />
      </div>
    </div>
    <LabeledInput
      v-else
      v-model="value.spec.url"
      :required="true"
      :label="t('catalog.repo.url.label')"
      :placeholder="t('catalog.repo.url.placeholder', null, true)"
      :mode="mode"
    />

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
</template>
