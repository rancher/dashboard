import { CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { SUB_TYPE, _EDIT, _CONFIG, _VIEW } from '@shell/config/query-params';

const IMPORTED = 'imported';
const LOCAL = 'local';

export interface SubTypeDetectionParams {
  query: Record<string, string>;
  value: {
    id?: string;
    isImported?: boolean;
    isLocal?: boolean;
    isRke2?: boolean;
    isCustom?: boolean;
    provisioner?: string;
    machineProvider?: string;
    annotations?: Record<string, string>;
  };
  extensions: Array<{ id: string }>;
  realMode: string;
  as?: string;
}

/**
 * Resolves the subType for the cluster edit page.
 *
 * Priority order:
 * 1. SUB_TYPE query parameter (explicit navigation)
 * 2. UI_CUSTOM_PROVIDER annotation with a matching loaded extension
 * 3. isImported → 'imported' (with provisioner-to-extension override for hosted providers)
 * 4. isLocal → 'local'
 * 5. Auto-detect from RKE2/provisioner for existing clusters
 */
export function resolveSubType({
  query, value, extensions, realMode, as
}: SubTypeDetectionParams): string | null {
  let subType: string | null = query[SUB_TYPE] || null;
  const subTypeFromAnnotation = value?.annotations?.[CAPI_ANNOTATIONS.UI_CUSTOM_PROVIDER];

  if (query[SUB_TYPE]) {
    subType = query[SUB_TYPE];
  } else if (subTypeFromAnnotation && extensions.some((ext) => ext.id === subTypeFromAnnotation)) {
    // Check the UI_CUSTOM_PROVIDER annotation - used to load custom provisioning
    // forms when value.provisioner can't/shouldn't be overwritten
    subType = subTypeFromAnnotation;
  } else if (value.isImported) {
    // Default imported clusters to the generic imported subType.
    // Imported clusters (e.g. AKS, EKS, GKE) that have an extension-provided
    // component will be overridden below to load the correct custom form.
    subType = IMPORTED;
  } else if (value.isLocal) {
    subType = LOCAL;
  }

  // For imported clusters, check if the provisioner has a matching extension
  // component and override the subType so the correct custom form loads instead of
  // the generic imported configuration page.
  if (subType === IMPORTED && value?.id && value.provisioner) {
    const provisionerLower = value.provisioner.toLowerCase();
    const hasExtension = extensions.some((ext) => ext.id === provisionerLower);

    if (hasExtension) {
      subType = provisionerLower;
    }
  }

  // Auto-detect subType for existing clusters being edited
  if (!subType && value?.id) {
    if (value.isRke2) {
      // For custom RKE2 clusters
      if (value.isCustom && (realMode === _EDIT || (as === _CONFIG && realMode === _VIEW))) {
        subType = 'custom';
      } else if (value.machineProvider) {
        // For RKE2/K3s clusters provisioned in Rancher, use the machine pool provisioner
        subType = value.machineProvider;
      }
    } else if (value.provisioner) {
      // For non-RKE2 clusters, try to match against extension-provided subtypes
      subType = value.provisioner.toLowerCase();
    }
  }

  return subType;
}
