<script>
import CreateEditView from '@/mixins/create-edit-view';
import Footer from '@/components/form/Footer';
import NameNsDescription from '@/components/form/NameNsDescription';
import Labels from '@/components/form/Labels';
import MatchExpressions from '@/components/form/MatchExpressions';
import { set } from '@/utils/object';

export default {
  name: 'CruClusterGroup',

  components: {
    Footer,
    NameNsDescription,
    MatchExpressions,
    Labels,
  },

  mixins: [CreateEditView],

  data() {
    return { isGit: !!this.value.spec.gitRepo };
  },

  methods: { set },

};
</script>

<template>
  <form>
    <NameNsDescription v-model="value" :mode="mode" :namespaced="isNamespaced" />

    <hr class="mt-20 mb-20" />

    <h2>Select clusters which match the labels</h2>
    <MatchExpressions
      :initial-empty-row="!isView"
      :mode="mode"
      type=""
      :value="value.spec.selector.matchExpressions"
      :show-remove="false"
      @input="e=>set(value.spec.selector, 'matchExpressions', e)"
    />

    <hr class="mt-20" />

    <Labels
      default-section-class="mt-20"
      :value="value"
      :mode="mode"
      :display-side-by-side="false"
    />

    <Footer :mode="mode" :errors="errors" @save="save" @done="done" />
  </form>
</template>
