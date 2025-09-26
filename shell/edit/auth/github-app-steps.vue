<script setup lang="ts">
import InfoBox from '@shell/components/InfoBox';
import CopyToClipboard from '@shell/components/CopyToClipboard';

type TArgs = {
  baseUrl: string;
  serverUrl: string;
  provider: string;
  username: string;
}

defineProps<{
  name: string;
  tArgs: TArgs;
}>();

</script>

<template>
  <InfoBox
    :step="1"
    class="step-box"
  >
    <ul class="step-list">
      <li v-clean-html="t(`authConfig.${name}.form.prefix.1`, tArgs, true)" />
      <li v-clean-html="t(`authConfig.${name}.form.prefix.2`, tArgs, true)" />
      <li v-clean-html="t(`authConfig.${name}.form.prefix.3`, tArgs, true)" />
      <li v-clean-html="t(`authConfig.${name}.form.prefix.4`, tArgs, true)" />
    </ul>
  </InfoBox>
  <InfoBox
    :step="2"
    class="step-box"
  >
    <ul class="step-list">
      <li>
        {{ t(`authConfig.${name}.form.instruction`, tArgs, true) }}
        <ul class="mt-10">
          <li>
            <b>
              {{ t(`authConfig.${name}.form.app.label`) }}
            </b>:
            <span v-clean-html="t(`authConfig.${name}.form.app.value`, tArgs, true)" />
          </li>
          <li>
            <b>
              {{ t(`authConfig.${name}.form.homepage.label`) }}
            </b>: {{ tArgs.serverUrl }}
            <CopyToClipboard
              label-as="tooltip"
              :text="tArgs.serverUrl"
              class="icon-btn"
              action-color="bg-transparent"
            />
          </li>
          <li>
            <b>
              {{ t(`authConfig.${name}.form.description.label`) }}
            </b>:
            <span v-clean-html="t(`authConfig.${name}.form.description.value`, tArgs, true)" />
          </li>
          <li>
            <b>
              {{ t(`authConfig.${name}.form.callback.label`) }}
            </b>:
            {{ t(`authConfig.${name}.form.callback.value`, tArgs, true) }}
            <CopyToClipboard
              :text="tArgs.serverUrl"
              label-as="tooltip"
              class="icon-btn"
              action-color="bg-transparent"
            />
          </li>
        </ul>
      </li>
      <li>
        {{ t(`authConfig.${name}.form.create`, tArgs, true) }}
      </li>
    </ul>
  </InfoBox>
  <InfoBox
    :step="3"
    class="mb-20"
  >
    <ul class="step-list">
      <li v-clean-html="t(`authConfig.${name}.form.suffix.1`, tArgs, true)" />
      <li v-clean-html="t(`authConfig.${name}.form.suffix.2`, tArgs, true)" />
      <li v-clean-html="t(`authConfig.${name}.form.suffix.3`, tArgs, true)" />
    </ul>
  </InfoBox>
</template>

<style lang="scss" scoped>
  .step-list li:not(:last-child) {
    margin-bottom: 8px;
  }
</style>
