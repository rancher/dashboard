<script>
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import { RcHeading } from '@components/RcHeading';
import { mapGetters } from 'vuex';
export default {
  name:       'Setting',
  components: { ActionMenu, RcHeading },
  props:      {
    value: {
      type:     Object,
      required: true,
    },
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    ...mapGetters({ options: 'action-menu/optionsArray' }),
    ...mapGetters({ i18nExists: 'i18n/exists' }),

    descriptionKey() {
      return `advancedSettings.descriptions.${ this.value.id }`;
    },
  },
};
</script>

<template>
  <div
    class="advanced-setting mb-20"
    :data-testid="`advanced-setting__option-${value.id}`"
  >
    <div class="header">
      <div class="title">
        <RcHeading
          :size="1"
          class="id"
        >
          {{ value.id }}
          <span
            v-if="value.fromEnv"
            class="modified"
            :data-testid="`advanced-setting-env-label-${value.id}`"
          >{{ t('advancedSettings.setEnv') }}</span>
          <span
            v-else-if="value.customized"
            class="modified"
          >{{ t('advancedSettings.modified') }}</span>
        </RcHeading>
        <RcHeading
          v-if="i18nExists(descriptionKey)"
          :size="2"
          class="description"
        >
          {{ t(descriptionKey) }}
        </RcHeading>
      </div>
      <div
        v-if="value.hasActions"
        class="action"
      >
        <action-menu
          :resource="value.data"
          :button-aria-label="t('advancedSettings.edit.label')"
          data-testid="action-button"
          button-variant="tertiary"
        />
      </div>
    </div>
    <div value>
      <div v-if="value.canHide">
        <button
          class="btn btn-sm role-primary"
          role="button"
          :aria-label="t('advancedSettings.hideShow')"
          @click="value.hide = !value.hide"
        >
          {{ value.hide ? t('advancedSettings.show') : t('advancedSettings.hide') }} {{ value.id }}
        </button>
      </div>
      <div
        v-show="!value.canHide || (value.canHide && !value.hide)"
        class="settings-value"
      >
        <pre v-if="value.kind === 'json'">{{ value.json }}</pre>
        <pre v-else-if="value.kind === 'multiline'">{{ value.data.value || value.data.default }}</pre>
        <pre v-else-if="value.kind === 'enum'">{{ t(value.enum) }}</pre>
        <pre v-else-if="value.data.value || value.data.default">{{ value.data.value || value.data.default }}</pre>
        <pre
          v-else
          class="text-muted"
        >&lt;{{ t('advancedSettings.none') }}&gt;</pre>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.settings-value pre {
  margin: 0;
}
.advanced-setting {
  border: 1px solid var(--border);
  padding: 20px;
  border-radius: var(--border-radius);

  .id {
    font-size: 14px;
  }

  .description {
    font-size: 12px;
    margin-bottom: 0;
    opacity: 0.8;
  }
}

.header {
  display: flex;
  margin-bottom: 20px;
}

.title {
  flex: 1;
}

.modified {
  margin-left: 10px;
  border: 1px solid var(--primary);
  border-radius: 5px;
  padding: 2px 10px;
  font-size: 12px;
}
</style>
