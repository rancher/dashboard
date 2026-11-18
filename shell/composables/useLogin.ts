import { computed, onMounted, type ComputedRef, type Ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { providerKey } from '@shell/models/management.cattle.io.authconfig';

export interface LoginProps {
  focusOnMount: boolean;
  /** The authconfig's name, which an admin is free to choose. */
  name: string;
  /** The provider the config is for, e.g. `githubProvider`. */
  type: string;
}

type Translate = (key: string) => string | undefined;

interface Focusable {
  focus: () => void;
}

/**
 * The label for a login control. A config named after its provider is labelled
 * with the vendor's name; one an admin has named is labelled with that name,
 * which is the only thing telling it apart from its siblings.
 */
export const loginDisplayName = (t: Translate, name: string, type: string): string => {
  const key = providerKey(type);
  const providerString = t(`model.authConfig.provider.${ key }`) || key;

  return name?.toLowerCase() === key ? providerString : name;
};

/**
 * Composition API counterpart of the `@shell/mixins/login` mixin.
 *
 * @param props - The login component's props.
 * @param focusTarget - The control to focus; may be absent, e.g. while SAML rejects a CLI login.
 */
export const useLogin = (
  props: LoginProps,
  focusTarget: Ref<Focusable | null | undefined>
): { displayName: ComputedRef<string>, focus: () => void } => {
  const store = useStore();
  const { t } = useI18n(store);

  const displayName = computed(() => loginDisplayName(t, props.name, props.type));

  const focus = () => {
    focusTarget.value?.focus();
  };

  onMounted(() => {
    if (props.focusOnMount) {
      focus();
    }
  });

  return { displayName, focus };
};
