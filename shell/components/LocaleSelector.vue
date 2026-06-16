<script>
import { mapGetters } from 'vuex';
import Select from '@shell/components/form/Select.vue';
import { RcDropdown, RcDropdownTrigger, RcDropdownItem } from '@components/RcDropdown';

export default {
  name: 'LocaleSelector',

  components: {
    Select,
    RcDropdown,
    RcDropdownItem,
    RcDropdownTrigger,
  },

  props: {
    mode: {
      type:    String,
      default: ''
    },
    showIcon: {
      type:    Boolean,
      default: true
    }
  },

  data() {
    return { isLocaleSelectorOpen: false };
  },

  computed: {
    ...mapGetters('i18n', ['selectedLocaleLabel', 'availableLocales']),

    localesOptions() {
      return Object.keys(this.availableLocales).map((value) => {
        return {
          label: this.t(`locale.${ value }`),
          value
        };
      });
    },

    selectedOption() {
      return Object.keys(this.availableLocales)[Object.values(this.availableLocales).indexOf(this.selectedLocaleLabel)];
    },

    showLocale() {
      return (this.availableLocales && Object.keys(this.availableLocales).length > 1) || this.showNone;
    },

    showNone() {
      return !!process.env.dev;
    },
  },

  methods: {
    openLocaleSelector() {
      this.isLocaleSelectorOpen = true;
    },
    closeLocaleSelector() {
      this.isLocaleSelectorOpen = false;
    },
    switchLocale($event) {
      this.$store.dispatch('i18n/switchTo', $event);
      this.closeLocaleSelector();
    },
  }
};
</script>

<template>
  <div>
    <div v-if="mode === 'login'">
      <rc-dropdown
        v-if="showLocale"
        :aria-label="$attrs['aria-label'] || undefined"
        :aria-labelledby="$attrs['aria-labelledby'] || undefined"
        :aria-describedby="$attrs['aria-describedby'] || undefined"
      >
        <rc-dropdown-trigger
          data-testid="locale-selector"
          variant="link"
          class="baseline locale-selector-btn"
          :aria-label="t('locale.menu')"
        >
          {{ selectedLocaleLabel }}
          <template
            v-if="showIcon"
            #after
          >
            <i class="ml-5 icon icon-chevron-down" />
          </template>
        </rc-dropdown-trigger>
        <template #dropdownCollection>
          <rc-dropdown-item
            v-if="showNone"
            v-t="'locale.none'"
            @click="switchLocale('none')"
          />
          <rc-dropdown-item
            v-for="(label, name) in availableLocales"
            :key="name"
            :lang="name"
            @click.stop="switchLocale(name)"
          >
            {{ label }}
          </rc-dropdown-item>
        </template>
      </rc-dropdown>
    </div>
    <div v-else>
      <Select
        :aria-label="$attrs['aria-label'] || undefined"
        :aria-labelledby="$attrs['aria-labelledby'] || undefined"
        :aria-describedby="$attrs['aria-describedby'] || undefined"
        :value="selectedOption"
        :options="localesOptions"
        :is-lang-select="true"
        @update:value="switchLocale($event)"
      />
    </div>
  </div>
</template>

<style lang="scss">
  .baseline {
    align-items: baseline;
  }

  .locale-selector-btn {
    align-items: center;
    display: flex;
  }
</style>
