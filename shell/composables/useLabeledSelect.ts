import { computed, ComputedRef, Ref, nextTick } from 'vue';
import { getWidth, setWidth } from '@shell/utils/width';

interface LabeledSelectProps {
  options?: Array<any>;
  searchable?: boolean;
  filterable?: boolean;
}

interface UseLabeledSelect {
  isSearchable: ComputedRef<boolean>;
  isFilterable: ComputedRef<boolean>;
  resizeHandler: (selectRef: Ref<HTMLElement | null>) => void;
}

export const useLabeledSelect = (props: LabeledSelectProps, canPaginate?: ComputedRef<boolean>): UseLabeledSelect => {
  const isSearchable = computed(() => {
    if (canPaginate?.value) {
      return true;
    }
    const options = props.options || [];

    if (props.searchable || options.length >= 10) {
      return true;
    }

    return false;
  });

  const isFilterable = computed(() => {
    if (canPaginate?.value) {
      return false;
    }

    return props.filterable ?? true;
  });

  const resizeHandler = (selectRef: Ref<HTMLElement | null>) => {
    // since the DD is positioned there is no way to 'inherit' the size of the input, this calcs the size of the parent and set the dd width if it is smaller. If not let it grow with the regular styles
    nextTick(() => {
      if (!selectRef.value) {
        return;
      }

      const DD = selectRef.value.querySelector('ul.vs__dropdown-menu');
      const selectWidth = getWidth(selectRef.value) || 0;
      const dropWidth = getWidth(DD as Element) || 0;

      if (dropWidth < selectWidth) {
        setWidth(DD as Element, selectWidth);
      }
    });
  };

  return {
    isSearchable,
    isFilterable,
    resizeHandler
  };
};
