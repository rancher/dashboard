<script>
import CopyToClipboardText from '@shell/components/CopyToClipboardText';
import LabelValue from '@shell/components/LabelValue';
import { DESCRIPTION, HCI } from '@shell/config/labels-annotations';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { findBy } from '@shell/utils/array';
import { get } from '@shell/utils/object';

export default {
  components: {
    CopyToClipboardText,
    Tab,
    Tabbed,
    LabelValue
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {};
  },

  computed: {
    formattedValue() {
      return this.value?.downSize;
    },

    url() {
      return this.value?.spec?.url || '-';
    },

    description() {
      return this.value?.metadata?.annotations?.[DESCRIPTION] || '-';
    },

    errorMessage() {
      const conditions = get(this.value, 'status.conditions');

      return findBy(conditions, 'type', 'Imported')?.message || '-';
    },

    isUpload() {
      return this.value?.spec?.sourceType === 'upload';
    },

    imageName() {
      return this.value?.metadata?.annotations?.[HCI.IMAGE_NAME] || '-';
    },
  }
};
</script>

<template>
  <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true">
    <Tab name="detail" :label="t('harvester.virtualMachine.detail.tabs.basics')" class="bordered-table">
      <div class="row">
        <div class="col span-12">
          <LabelValue
            v-if="isUpload"
            :name="t('harvester.image.fileName')"
            :value="imageName"
            class="mb-20"
          />
          <LabelValue
            v-else
            :name="t('harvester.image.url')"
            :value="url"
            class="mb-20"
          >
            <template #value>
              <div v-if="url !== '-'">
                <CopyToClipboardText :text="url" />
              </div>
              <div v-else>
                {{ url }}
              </div>
            </template>
          </LabelValue>
        </div>
      </div>

      <div class="row">
        <div class="col span-12">
          <LabelValue :name="t('harvester.image.size')" :value="formattedValue" class="mb-20" />
        </div>
      </div>

      <div class="row">
        <div class="col span-12">
          <LabelValue :name="t('nameNsDescription.description.label')" :value="description" class="mb-20" />
        </div>
      </div>

      <div v-if="errorMessage !== '-'" class="row">
        <div class="col span-12">
          <div>
            {{ t('tableHeaders.message') }}
          </div>
          <div :class="{ 'error': errorMessage !== '-' }">
            {{ errorMessage }}
          </div>
        </div>
      </div>
    </Tab>
  </Tabbed>
</template>

<style lang="scss" scoped>
.error {
  color: var(--error);
}
</style>
