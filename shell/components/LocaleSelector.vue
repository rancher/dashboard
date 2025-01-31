<script>
import { mapGetters } from 'vuex';
import Select from '@shell/components/form/Select.vue';

export default {
  name: 'LocalSelector',

  components: { Select },

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
      return (this.availableLocales && Object.keys(this.availableLocales).length > 1) || this.dev;
    },

    showNone() {
      return !!process.env.dev && this.dev;
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
      <div
        v-if="showLocale"
        role="menu"
        :aria-label="t('locale.menu')"
        class="locale-login-container"
        tabindex="0"
        @click="openLocaleSelector"
        @blur.capture="closeLocaleSelector"
        @keyup.enter="openLocaleSelector"
        @keyup.space="openLocaleSelector"
      >
        <v-dropdown
          popperClass="localeSelector"
          :shown="isLocaleSelectorOpen"
          placement="top"
          distance="8"
          skidding="12"
          :triggers="[]"
          :autoHide="false"
          :flip="false"
          :container="false"
          @focus.capture="openLocaleSelector"
        >
          <a
            data-testid="locale-selector"
            class="locale-chooser"
          >
            {{ selectedLocaleLabel }}
            <i
              v-if="showIcon"
              class="icon icon-fw icon-sort-down"
            />
          </a>
          <template #popper>
            <ul
              class="list-unstyled dropdown"
              style="margin: -1px;"
            >
              <li
                v-if="showNone"
                v-t="'locale.none'"
                class="hand"
                tabindex="0"
                role="menuitem"
                @click.stop="switchLocale('none')"
                @keyup.enter.stop="switchLocale('none')"
                @keyup.space.stop="switchLocale('none')"
              />
              <li
                v-for="(label, name) in availableLocales"
                :key="name"
                tabindex="0"
                role="menuitem"
                class="hand"
                @click.stop="switchLocale(name)"
                @keyup.enter.stop="switchLocale(name)"
                @keyup.space.stop="switchLocale(name)"
              >
                {{ label }}
              </li>
            </ul>
          </template>
        </v-dropdown>
      </div>
    </div>
    <div v-else>
      <Select
        :value="selectedOption"
        :options="localesOptions"
        @update:value="switchLocale($event)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.advanced {
  user-select: none;
  padding: 0 5px;
  line-height: 40px;
  font-size: 15px;
  font-weight: 500;
}
.content {
  background: var(--nav-active);
  padding: 10px;
  margin-top: 6px;
  border-radius: 4px;
}

.hand:focus-visible {
  @include focus-outline;
  outline-offset: 4px;
}

.locale-chooser {
  cursor: pointer;

  &:hover {
    text-decoration: none;
  }
}

.locale-login-container:focus-visible {
  @include focus-outline;
  outline-offset: 2px;
}
</style>
