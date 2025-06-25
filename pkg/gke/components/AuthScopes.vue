<script lang='ts'>
import { _CREATE } from '@shell/config/query-params';
import { PropType, defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import isEqual from 'lodash/isEqual';

import {
  addGKEAuthScope, GKEOauthScopeFormOptions, GKEOauthScopeOptions, googleFullAuthUrl, getGoogleAuthDefaultURLs, getValueFromGKEOauthScopes,
} from '../util/oauth';

export default defineComponent({
  name: 'GKEAuthScopes',

  emits: ['update:value'],

  components: {
    RadioGroup,
    LabeledSelect
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    disabled: {
      type:    Boolean,
      default: false
    },

    value: {
      type:    Array as PropType<string[]>,
      default: () => []
    }
  },

  created() {
    if (this.mode !== _CREATE) {
      if (this.value && this.value.length === 1 && this.value[0] === googleFullAuthUrl) {
        this['scopeMode'] = GKEOauthScopeOptions.FULL;
      } else if (isEqual(this.value, getGoogleAuthDefaultURLs())) {
        this['scopeMode'] = GKEOauthScopeOptions.DEFAULT;
      }
    }
  },

  data() {
    const t = this.$store.getters['i18n/t'];

    return {
      formOptions:      GKEOauthScopeFormOptions,
      scopeModeOptions: Object.values(GKEOauthScopeOptions).map((opt) => {
        return {
          label: t(`gke.authScopes.modes.${ opt }`),
          value: opt
        };
      }),
      scopeMode: GKEOauthScopeOptions.DEFAULT
    };
  },

  watch: {
    scopeMode(neu) {
      switch (neu) {
      case GKEOauthScopeOptions.DEFAULT:
        this.$emit('update:value', getGoogleAuthDefaultURLs());
        break;
      case GKEOauthScopeOptions.FULL:
        this.$emit('update:value', [googleFullAuthUrl]);
        break;
      default:
        this.$emit('update:value', []);
      }
    }
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods: {
    getScopeValue(scopeKey:keyof typeof GKEOauthScopeFormOptions): string {
      return getValueFromGKEOauthScopes(this.value, scopeKey);
    },

    setScopeValue(scopeKey: keyof typeof GKEOauthScopeFormOptions, neu: string) {
      const newScopes = addGKEAuthScope(this.value, scopeKey, neu);

      this.$emit('update:value', newScopes);
    },

    nextScopeKey(index: number) {
      if (index <= Object.keys(this.formOptions).length - 2) {
        return Object.keys(this.formOptions)[index + 1];
      }
    }
  }
});
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <RadioGroup
          v-model:value="scopeMode"
          :label="t('gke.authScopes.modeLabel')"
          name="scope-mode"
          :mode="mode"
          :options="scopeModeOptions"
          :disabled="disabled"
        />
      </div>
    </div>
    <div v-if="scopeMode==='custom'">
      <template
        v-for="(scopeKey, index) in Object.keys(formOptions)"
        :key="index"
      >
        <div
          v-if="!(index%2)"
          :key="scopeKey"
          class="row mb-10"
        >
          <div class="col span-6">
            <LabeledSelect
              :value="getScopeValue(scopeKey)"
              :get-option-label="opt=> t(opt.labelKey)"
              :options="formOptions[scopeKey]"
              :mode="mode"
              :label-key="`gke.authScopes.scopes.&quot;${scopeKey}&quot;`"
              :disabled="disabled"
              @selecting="setScopeValue(scopeKey, $event)"
            />
          </div>
          <div
            v-if="nextScopeKey(index)"
            class="col span-6"
          >
            <LabeledSelect
              :value="getScopeValue(nextScopeKey(index))"
              :get-option-label="opt=> t(opt.labelKey)"
              :options="formOptions[nextScopeKey(index)]"
              :mode="mode"
              :label-key="`gke.authScopes.scopes.&quot;${nextScopeKey(index)}&quot;`"
              :disabled="disabled"
              @selecting="setScopeValue(nextScopeKey(index), $event)"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
