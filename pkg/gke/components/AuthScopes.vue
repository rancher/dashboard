<script lang='ts'>
import { _CREATE } from '@shell/config/query-params';
import { PropType, defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import isEqual from 'lodash/isEqual';

import {
  addAuthScope, oauthScopeFormOptions, oauthScopeOptions, googleFullAuthUrl, getGoogleAuthDefaultURLs, getValueFromOauthScopes, googleAuthURLPrefix
} from '../util/oauth';

export default defineComponent({
  name: 'GKEAuthScopes',

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
        this.$set(this, 'scopeMode', oauthScopeOptions.FULL);
      } else if (isEqual(this.value, getGoogleAuthDefaultURLs())) {
        this.$set(this, 'scopeMode', oauthScopeOptions.DEFAULT);
      }
    }
  },

  data() {
    const t = this.$store.getters['i18n/t'];

    return {
      formOptions:      oauthScopeFormOptions,
      scopeModeOptions: Object.values(oauthScopeOptions).map((opt) => {
        return {
          label: t(`gke.authScopes.modes.${ opt }`),
          value: opt
        };
      }),
      scopeMode: oauthScopeOptions.DEFAULT
    };
  },

  watch: {
    scopeMode(neu) {
      switch (neu) {
      case oauthScopeOptions.DEFAULT:
        this.$emit('input', getGoogleAuthDefaultURLs());
        break;
      case oauthScopeOptions.FULL:
        this.$emit('input', [googleFullAuthUrl]);
        break;
      default:
        this.$emit('input', []);
      }
    }
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods: {
    getScopeValue(scopeKey:keyof typeof oauthScopeFormOptions): string {
      return getValueFromOauthScopes(this.value, scopeKey);
    },

    setScopeValue(scopeKey: keyof typeof oauthScopeFormOptions, neu: string) {
      const newScopes = addAuthScope(this.value, scopeKey, neu);

      this.$emit('input', newScopes);
    }
  }
});
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <RadioGroup
          v-model="scopeMode"
          :label="t('gke.authScopes.modeLabel')"
          name="scope-mode"
          :mode="mode"
          :options="scopeModeOptions"
          :disabled="disabled"
        />
      </div>
    </div>
    <div v-if="scopeMode==='custom'">
      <template v-for="(options, scopeKey) in formOptions">
        <div
          :key="scopeKey"
          class="row mb-10"
        >
          <div class="col span-6">
            <LabeledSelect
              :value="getScopeValue(scopeKey)"
              :get-option-label="opt=> t(opt.labelKey)"
              :options="options"
              :mode="mode"
              :label-key="`gke.authScopes.scopes.&quot;${scopeKey}&quot;`"
              :disabled="disabled"
              @selecting="setScopeValue(scopeKey, $event.value)"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
