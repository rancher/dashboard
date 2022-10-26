<template>
  <div class="password-strength">
    <label class="password-strength__label"> <t k="changePassword.strength.label"></t> <span v-if="strengthState" :class="[strengthState ? `password-strength--${strengthState.state}` : '']">&nbsp;<t :k="strengthState.labelKey"></t></span></label>
    <div class="password-strength__content" :class="[strengthState ? `password-strength--${strengthState.state}` : '']">
      <div class="password-strength__chart"></div>
      <div class="password-strength__chart"></div>
      <div class="password-strength__chart"></div>
    </div>
    <div v-show="password.length > 0" class="text-error mt-10">
      <t v-if="password.length < minLength" k="changePassword.strength.tooltip1" :length="minLength">
      </t>
      <t v-else-if="strengthState.state === 'weak' && password.length >= minLength" k="changePassword.strength.tooltip2">
      </t>
    </div>
  </div>
</template>
<script>
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export default {
  props: {
    password: {
      type:    String,
      default: ''
    }
  },
  data() {
    const minLength = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.CATTLE_PASSWORD_MIN_LENGTH)?.value ?? 12;

    return { minLength };
  },
  computed: {
    strength() {
      const pwd = this.password ?? '';

      if (pwd.length === 0) {
        return 0;
      }
      if (pwd.length < this.minLength) {
        return 1;
      }
      let modes = 0;

      (/\d/.test(pwd)) && modes++;
      (/[a-z]/.test(pwd)) && modes++;
      (/[A-Z]/.test(pwd)) && modes++;
      (/\W/.test(pwd)) && modes++;

      return modes;
    },
    strengthState() {
      const s = this.strength;

      if (s === 0) {
        return '';
      }
      if (s === 1) {
        return {
          labelKey:  'changePassword.strength.weak',
          state:     'weak'
        };
      }

      if (s === 2) {
        return {
          textClass: 'text-warning',
          labelKey:  'changePassword.strength.good',
          state:     'good'
        };
      }

      return {
        textClass: 'text-success',
        labelKey:  'changePassword.strength.best',
        state:     'best'
      };
    }
  },
  watch: {
    strength: {
      handler(v) {
        this.$emit('strengthChange', v);
      },
      immediate: true
    }
  }
};
</script>
<style scoped>
.password-strength {
  min-height: 68px;
}
.password-strength__label {
  color: var(--input-label);
  font-size: 12px;
}
.password-strength__content {
  display: flex;
  justify-content: space-between;
}
.password-strength__chart {
  height: 8px;
  width: 32%;
  border-radius: 4px;
  background-color: var(--disabled-bg);
}

.password-strength--weak {
  color: var(--error);
}
.password-strength--good {
  color: var(--warning);
}

.password-strength--best {
  color: var(--success);
}

.password-strength--weak > .password-strength__chart:first-child {
  background-color: var(--error);
}
.password-strength--good > .password-strength__chart:nth-child(-n+2) {
  background-color: var(--warning);
}
.password-strength--best > .password-strength__chart:nth-child(-n+3) {
  background-color: var(--success);
}

</style>
