import { LabelSelectPaginationFunctionOptions } from '@shell/components/form/labeled-select-utils/labeled-select.utils';
import { LabelSelectPaginateFn } from '@shell/types/components/labeledSelect';

type PaginateTypeOverridesFn = (opts: LabelSelectPaginationFunctionOptions) => LabelSelectPaginationFunctionOptions;

interface SharedSettings {
  /**
   * Provide specific LabelSelect options for this mode (paginated / not paginated)
   */
  labelSelectOptions?: { [key: string]: any },
  /**
   * Map, filter, tweak, etc the resources to show in the LabelSelect
   */
  updateResources?: (resources: any[]) => any[]
}

/**
 * Settings to use when the LabelSelect is paginating
 */
export interface ResourceLabeledSelectPaginateSettings extends SharedSettings {
  /**
   * Override the convenience function which fetches a page of results
   */
  overrideRequest?: LabelSelectPaginateFn,
  /**
   * Override the default settings used in the convenience function to fetch a page of results
   */
  requestSettings?: PaginateTypeOverridesFn,
}

/**
 * Settings to use when the LabelSelect is fetching all resources (not paginating)
 */
export type ResourceLabeledSelectSettings = SharedSettings

/**
 * Force a specific mode
 */
export enum RESOURCE_LABEL_SELECT_MODE {
  /**
   * Fetch all resources
   */
  ALL_RESOURCES = 'ALL', // eslint-disable-line no-unused-vars
  /**
   * Determine if all resources are fetched given system settings
   */
  DYNAMIC = 'DYNAMIC', // eslint-disable-line no-unused-vars
}
