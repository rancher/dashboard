import { computed, ComputedRef } from 'vue';

interface CompactInputProps {
  compact?: boolean;
  label?: string;
  labelKey?: string;
}

interface UseCompactInput {
  isCompact: ComputedRef<boolean>;
}

export const useCompactInput = (props: CompactInputProps): UseCompactInput => {
  const isCompact = computed(() => {
    // Compact if explicitly set - otherwise compact if there is no label
    return props.compact !== null ? !!props.compact : !(props.label || props.labelKey);
  });

  return { isCompact };
};
