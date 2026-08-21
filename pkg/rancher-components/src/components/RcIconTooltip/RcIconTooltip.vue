<script setup lang="ts">
/**
 * An icon that reveals a tooltip on hover, focus and activation.
 *
 * The icon itself is decorative and the button carries a generic accessible
 * name, so the tooltip text is announced as the button's description rather
 * than as its name.
 *
 * Example:
 *
 * <rc-icon-tooltip :content="t('workload.container.ports.toolTip')" />
 */
import { computed } from 'vue';
import RcButton from '@components/RcButton/RcButton.vue';
import RcIcon from '@components/RcIcon/RcIcon.vue';
import { RcIconType } from '@components/RcIcon/types';
import type { IconTooltipContent } from './types';

const TOOLTIP_TRIGGERS = ['hover', 'touch', 'focus', 'click'];

const props = withDefaults(defineProps<{
  /**
   * The tooltip content. No tooltip is shown when this is empty, but the icon
   * still renders.
   */
  content?: IconTooltipContent,

  /**
   * The accessible name for the control. Defaults to a generic label, since
   * naming it after the message would have the message announced twice.
   */
  label?: string,

  /**
   * The icon to draw.
   */
  iconType?: RcIconType,
}>(), {
  content:  null,
  label:    undefined,
  iconType: 'info',
});

const tooltip = computed(() => {
  if (!props.content) {
    return '';
  }

  const options = typeof props.content === 'string' ? { content: props.content } : { ...props.content };

  return { ...options, triggers: TOOLTIP_TRIGGERS };
});
</script>

<template>
  <rc-button
    v-clean-tooltip="tooltip"
    type="button"
    variant="ghost"
    size="small"
    class="rc-icon-tooltip"
    :aria-label="label || t('generic.moreInfo')"
  >
    <rc-icon :type="iconType" />
  </rc-button>
</template>

<style lang="scss" scoped>
.rc-icon-tooltip {
  color: inherit;
}

.rc-icon-tooltip.rc-button.btn.btn-small {
  --rc-button-padding: 0;

  min-height: 0;
  font-size: inherit;
  line-height: inherit;
  vertical-align: baseline;
}
</style>
