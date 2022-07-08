<script>
import { _CREATE } from '@shell/config/query-params';

import ArrayList from '@shell/components/form/ArrayList';
import { Banner } from '@components/Banner';

import SourceAuthorities from './SourceAuthorities';

export default {
  name: 'Registry',

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    // chartValues.spec
    value: {
      type:     Object,
      required: true
    }
  },

  components: {
    ArrayList,
    Banner,
    SourceAuthorities
  },

  fetch() {
    this.insecureSources = this.value?.insecureSources || [];
    this.sourceAuthorities = this.value?.sourceAuthorities || {};
  },

  data() {
    return {
      insecureSources:   null,
      sourceAuthorities: null
    };
  },

  methods: {
    update() {
      this.$set(this.value, 'sourceAuthorities', this.sourceAuthorities);
    }
  }
};
</script>

<template>
  <div class="mt-10 mb-20">
    <div class="row">
      <Banner
        class="type-banner mb-20 mt-0"
        color="info"
        :label="t('kubewarden.policyServerConfig.registry.description')"
      />
    </div>

    <template>
      <h3 class="mb-20">
        {{ t('kubewarden.policyServerConfig.registry.title') }}
      </h3>
      <div class="row">
        <div class="col span-6">
          <ArrayList
            v-model="insecureSources"
            :mode="mode"
            :add-allowed="true"
            :add-label="t('kubewarden.policyServerConfig.registry.addLabel')"
            :value-placeholder="t('kubewarden.policyServerConfig.registry.placeholder')"
          />
        </div>
      </div>
    </template>

    <div class="spacer"></div>

    <template>
      <div class="row mb-20">
        <div class="col span-12">
          <SourceAuthorities ref="sourceAuthorities" v-model="sourceAuthorities" :mode="mode" @update="update" />
        </div>
      </div>
    </template>
  </div>
</template>
