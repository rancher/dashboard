<script>
import { mapGetters } from 'vuex';
import LabeledInput from '@/components/form/LabeledInput';
import { CHARSET, randomStr } from '@/utils/string';

export default {
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
      type:     String
    },
    autocomplete: {
      type:      String,
      default:   ''
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
        this.$emit('input', val);
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
    }
  },
  created() {
    if (this.isRandom) {
      this.generatePassword();
    }
  },
  methods: {
    generatePassword() {
      this.password = randomStr(16, CHARSET.ALPHA_NUM);
    },
    show(reveal) {
      this.reveal = reveal;
    }
  }
};
</script>

<template>
  <div class="password">
    <LabeledInput
      v-model="password"
      v-bind="attributes"
      :type="isRandom || reveal ? 'text' : 'password'"
      :readonly="isRandom"
      :label="label"
      :required="!isRandom"
      :disabled="isRandom"
      @blur="$emit('blur', $event)"
    >
      <template #suffix>
        <div v-if="isRandom" class="addon">
          <a href="#" @click.prevent.stop="$copyText(password)">{{ t('action.copy') }}</a>
        </div>
        <div v-else class="addon">
          <a v-if="reveal" href="#" @click.prevent.stop="reveal = false">{{ t('action.hide') }}</a>
          <a v-else href="#" @click.prevent.stop="reveal=true">{{ t('action.show') }}</a>
        </div>
      </template>
    </LabeledInput>
    <div v-if="isRandom" class="mt-10 genPassword">
      <a href="#" @click.prevent.stop="generatePassword"><i class="icon icon-refresh" /> {{ t('changePassword.newGeneratedPassword') }}</a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .password {
    display: flex;
    flex-direction: column;
    .labeled-input {
      .addon {
          padding-left: 12px;
          min-width: 65px;
      }
    }
    .genPassword {
      display: flex;
      justify-content: flex-end;
    }
  }

</style>
