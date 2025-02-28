<script>
import { mapGetters } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import { CHARSET, randomStr } from '@shell/utils/string';
import { copyTextToClipboard } from '@shell/utils/clipboard';
import { _CREATE } from '@shell/config/query-params';

export default {
  emits: ['update:value', 'blur'],

  components: { LabeledInput },
  props:      {
    value: {
      default: '',
      type:    String,
    },
    isRandom: {
      default: false,
      type:    Boolean,
    },
    label: {
      default: '',
      type:    String,
    },
    name: {
      default: '',
      type:    String
    },
    autocomplete: {
      type:    String,
      default: ''
    },
    required: {
      default: false,
      type:    Boolean,
    },
    ignorePasswordManagers: {
      default: false,
      type:    Boolean,
    },
    mode: {
      type:    String,
      default: _CREATE,
    }
  },
  data() {
    return { reveal: false };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    password: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('update:value', val);
      }
    },
    attributes() {
      const attributes = { };

      if (this.name) {
        attributes.id = this.name;
        attributes.name = this.name;
      }
      if (this.autocomplete) {
        attributes.autocomplete = this.autocomplete;
      }

      return attributes;
    },
    hideShowLabel() {
      return this.reveal ? this.t('action.hide') : this.t('action.show');
    }
  },
  watch: {
    isRandom() {
      if (this.isRandom) {
        this.generatePassword();
      }
    }
  },
  created() {
    if (this.isRandom) {
      this.generatePassword();
    }
  },
  methods: {
    copyTextToClipboard,
    generatePassword() {
      this.password = randomStr(16, CHARSET.ALPHA_NUM);
    },
    show(reveal) {
      this.reveal = reveal;
    },
    focus() {
      this.$refs.input.$refs.value.focus();
    },
    hideShowFn() {
      this.reveal ? this.reveal = false : this.reveal = true;
    }
  }
};
</script>

<template>
  <div class="password">
    <LabeledInput
      ref="input"
      v-model:value="password"
      v-bind="attributes"
      :type="isRandom || reveal ? 'text' : 'password'"
      :readonly="isRandom"
      :label="label"
      :required="required"
      :disabled="isRandom"
      :ignore-password-managers="ignorePasswordManagers"
      :mode="mode"
      @blur="$emit('blur', $event)"
    >
      <template #suffix>
        <div
          v-if="isRandom"
          class="addon"
        >
          <a
            href="#"
            @click.prevent.stop="copyTextToClipboard(password)"
          >{{ t('action.copy') }}</a>
        </div>
        <div
          v-else
          class="addon"
        >
          <a
            href="#"
            tabindex="0"
            class="hide-show"
            role="button"
            @click.prevent.stop="hideShowFn"
            @keyup.space.prevent.stop="hideShowFn"
          >
            {{ hideShowLabel }}
          </a>
        </div>
      </template>
    </LabeledInput>
    <div
      v-if="isRandom"
      class="mt-10 genPassword"
    >
      <a
        href="#"
        @click.prevent.stop="generatePassword"
      ><i class="icon icon-refresh" /> {{ t('changePassword.newGeneratedPassword') }}</a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .password {
    display: flex;
    flex-direction: column;

    .labeled-input {
      .addon {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-left: 12px;
        min-width: 65px;

        .hide-show:focus-visible {
          @include focus-outline;
          outline-offset: 4px;
        }
      }
    }
    .genPassword {
      display: flex;
      justify-content: flex-end;
    }
  }

</style>
