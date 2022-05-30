<script>
import ProgressBarMulti from '@shell/components/ProgressBarMulti';

export default {
  components: { ProgressBarMulti },

  props: {
    row: {
      type:     Object,
      required: true
    },
  },
};
</script>

<template>
  <v-popover
    class="text-center hand"
    placement="top"
    :open-group="row.id"
    trigger="click"
    offset="1"
  >
    <ProgressBarMulti v-if="row.stateParts" :values="row.stateParts" class="mb-5" />
    <span v-if="row.desired === row.ready">{{ row.ready }}</span>
    <span v-else>{{ row.ready }} of {{ row.desired }}</span>

    <template #popover>
      <table class="fixed">
        <tbody>
          <tr v-for="obj in row.stateParts" :key="obj.label">
            <td class="text-left pr-20" :class="{[obj.textColor]: true}">
              {{ obj.label }}
            </td>
            <td class="text-right">
              {{ obj.value }}
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </v-popover>
</template>
