import {
  computed, inject, provide, toValue, type ComputedRef, type InjectionKey, type MaybeRefOrGetter
} from 'vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import type { RcFieldMode, RcFieldState, RcFieldStateProps } from './types';

export const RC_FIELD_STATE_KEY: InjectionKey<ComputedRef<RcFieldState>> = Symbol('rc-field-state');

const DEFAULT_STATE: RcFieldState = { mode: _EDIT, disabled: false };

/**
 * Provides a mode and disabled state to fields below the calling component.
 *
 * Groups can disable one section of a form that is otherwise in edit mode.
 *
 * Example:
 *
 * const props = defineProps<{ mode: RcFieldMode }>();
 *
 * provideFieldState({ mode: () => props.mode, disabled: isSaving });
 *
 * @param state - The mode and disabled state, as values, refs or getters.
 * @returns The resolved state that descendants receive.
 */
export const provideFieldState = (state: {
  mode?: MaybeRefOrGetter<RcFieldMode | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
}): ComputedRef<RcFieldState> => {
  const parent = inject(RC_FIELD_STATE_KEY, null);

  const resolved = computed<RcFieldState>(() => ({
    mode:     toValue(state.mode) ?? parent?.value.mode ?? DEFAULT_STATE.mode,
    disabled: toValue(state.disabled) ?? parent?.value.disabled ?? DEFAULT_STATE.disabled,
  }));

  provide(RC_FIELD_STATE_KEY, resolved);

  return resolved;
};

/**
 * Resolves a field's mode and disabled state. Props explicitly set on an
 * individual component take precedence.
 *
 * By default, the value comes from the nearest {@link provideFieldState}.
 *
 * Declare `disabled` with a default of `undefined` so the provided value is
 * easily traced.
 *
 * @param props - The field's own `mode` and `disabled` props.
 */
export const useFieldState = (props: RcFieldStateProps) => {
  const provided = inject(RC_FIELD_STATE_KEY, null);

  const mode = computed<RcFieldMode>(() => props.mode ?? provided?.value.mode ?? DEFAULT_STATE.mode);
  const disabled = computed<boolean>(() => props.disabled ?? provided?.value.disabled ?? DEFAULT_STATE.disabled);
  const isView = computed(() => mode.value === _VIEW);

  return {
    mode, disabled, isView
  };
};
