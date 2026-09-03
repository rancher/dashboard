import { ref } from 'vue';
import { useStore } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';

export interface PodSecurityAdmissionTemplate {
  id: string;
  nameDisplay: string;
  [key: string]: any;
}

/**
 * Loads the cluster-scoped Pod Security Admission configuration templates used to populate the
 * "Default Pod Security Admission" dropdown on the provisioning cluster form.
 */
export function usePodSecurityAdmissionTemplates() {
  const store = useStore();

  const allPSAs = ref<PodSecurityAdmissionTemplate[]>([]);
  const psaErrors = ref<string[]>([]);

  async function fetchAllPSAs() {
    psaErrors.value = [];

    if (!store.getters['management/canList'](MANAGEMENT.PSA)) {
      return;
    }

    try {
      allPSAs.value = await store.dispatch('management/findAll', { type: MANAGEMENT.PSA });
    } catch (e: any) {
      psaErrors.value.push(e?.message || String(e));
    }
  }

  return {
    allPSAs,
    fetchAllPSAs,
    psaErrors,
  };
}
