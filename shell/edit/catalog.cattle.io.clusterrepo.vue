<script>
import Vue from 'vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import Footer from '@shell/components/form/Footer';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Labels from '@shell/components/form/Labels';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import { MANAGEMENT, NAMESPACE } from '@shell/config/types';

export default {
  name: 'CruCatalogRepo',

  components: {
    Footer,
    RadioGroup,
    LabeledInput,
    NameNsDescription,
    Labels,
    SelectOrCreateAuthSecret,
  },

  mixins: [CreateEditView],

  data() {
    return { isGit: !!this.value.spec.gitRepo };
  },

  computed: {
    inStore() {
      return this.$store.getters['currentProduct']?.inStore || MANAGEMENT;
    },
    secretNamespace() {
      const tryNames = ['cattle-system', 'default'];

      for ( const name of tryNames ) {
        if ( this.$store.getters['cluster/byId'](NAMESPACE, name) ) {
          return name;
        }
      }

      return this.$store.getters[`${ this.inStore }/all`](NAMESPACE)[0]?.id;
    }
  },

  methods: {
    onTargetChange(isGit) {
      // reset entered value when switching options
      if (isGit) {
        Vue.set(this.value.spec, 'url', '');
      } else {
        Vue.set(this.value.spec, 'gitRepo', '');

        if (!!this.value.spec.gitBranch) {
          Vue.set(this.value.spec, 'gitBranch', '');
        }
      }
    }
  },
};
</script>

<template>
  <form>
    <NameNsDescription
      v-model="value"
      :mode="mode"
      :namespaced="isNamespaced"
    />

    <h2>{{ t('catalog.repo.target.label') }}</h2>
    <div class="row mb-10">
      <div class="col span-6">
        <RadioGroup
          v-model="isGit"
          name="isGit"
          :options="[false, true]"
          :labels="[t('catalog.repo.target.http'), t('catalog.repo.target.git')]"
          :mode="mode"
          data-testid="clusterrepo-radio-input"
          @input="onTargetChange"
        />
      </div>
    </div>

    <div
      v-if="isGit"
      class="row mb-10"
    >
      <div class="col span-6">
        <LabeledInput
          v-model.trim="value.spec.gitRepo"
          :required="true"
          :label="t('catalog.repo.gitRepo.label')"
          :placeholder="t('catalog.repo.gitRepo.placeholder', null, true)"
          :mode="mode"
          data-testid="clusterrepo-git-repo-input"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model.trim="value.spec.gitBranch"
          :sub-label="!value.spec.gitBranch ? t('catalog.repo.gitBranch.defaultMessage', null, true) : undefined"
          :label="t('catalog.repo.gitBranch.label')"
          :placeholder="t('catalog.repo.gitBranch.placeholder', null, true)"
          :mode="mode"
          data-testid="clusterrepo-git-branch-input"
        />
      </div>
    </div>

    <LabeledInput
      v-else
      v-model.trim="value.spec.url"
      :required="true"
      :label="t('catalog.repo.url.label')"
      :placeholder="t('catalog.repo.url.placeholder', null, true)"
      :mode="mode"
      data-testid="clusterrepo-helm-url-input"
    />

    <SelectOrCreateAuthSecret
      v-model="value.spec.clientSecret"
      data-testid="clusterrepo-auth-secret"
      :register-before-hook="registerBeforeHook"
      :namespace="secretNamespace"
      :limit-to-namespace="false"
      :in-store="inStore"
      generate-name="clusterrepo-auth-"
    />

    <Labels
      default-section-class="mt-20"
      :value="value"
      :mode="mode"
      :display-side-by-side="false"
    />

    <Footer
      :mode="mode"
      :errors="errors"
      @save="save"
      @done="done"
    />
  </form>
</template>
