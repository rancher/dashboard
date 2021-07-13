<script>
import CopyToClipboardText from '@/components/CopyToClipboardText';
import LabelValue from '@/components/LabelValue';
import { getFileSize } from '@/utils/units';
import { DESCRIPTION } from '@/config/labels-annotations';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import { findBy } from '@/utils/array';
import { get } from '@/utils/object';

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
      return getFileSize(this.value?.status?.size) || '-';
    },

    url() {
      return this.value?.spec?.url || '-';
    },

    description() {
      return this.value?.metadata?.annotations?.[DESCRIPTION] || '-';
    },

    errorMessage() {
      const conditions = get(this.value, 'status.conditions');

      return findBy(conditions, 'type', 'imported')?.reason || '-';
    }
  }
};
</script>

<template>
  <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true">
    <Tab name="detail" :label="t('harvester.vmPage.detail.tabs.basics')" class="bordered-table">
      <div class="row">
        <div class="col span-12">
          <LabelValue :name="t('harvester.imagePage.url')" :value="url" class="mb-20">
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
          <LabelValue :name="t('harvester.imagePage.size')" :value="formattedValue" class="mb-20" />
        </div>
      </div>

      <div class="row">
        <div class="col span-12">
          <LabelValue :name="t('nameNsDescription.description.label')" :value="description" class="mb-20" />
        </div>
      </div>

      <div v-if="errorMessage !== '-'" class="row">
        <div class="col span-12">
          <div>Message</div>
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
