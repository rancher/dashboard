import type { StateColor } from '@shell/utils/style';

/**
 * The field resources are counted by. Only the resource state is supported for now
 */
export type ResourceStatusWidgetProperty = 'metadata.state.name';

export const DEFAULT_RESOURCE_STATUS_WIDGET_PROPERTY: ResourceStatusWidgetProperty = 'metadata.state.name';

interface ResourceStatusWidgetBaseConfig {
  /** Defaults to `metadata.state.name` */
  property?: ResourceStatusWidgetProperty;
  /**
   * Only count resources in the namespaces picked in the namespace filter. Ignored for types that are
   * not namespaced. Defaults to true
   */
  followNamespaceFilter?: boolean;
}

/**
 * One resource type: a status bar and a row per state, each linking to the filtered list
 */
export interface ResourceStatusSummaryWidgetConfig extends ResourceStatusWidgetBaseConfig {
  kind: 'summary';
  resource: string;
  /** Defaults to the plural label of the resource type */
  title?: string;
}

/**
 * Several resource types: a row per type with a count per state color, each linking to the filtered
 * list. Types with nothing to count are left out
 */
export interface ResourceStatusBreakdownWidgetConfig extends ResourceStatusWidgetBaseConfig {
  kind: 'breakdown';
  resources: string[];
  title: string;
  /** Only count states with these colors. Defaults to all colors */
  colors?: StateColor[];
}

/**
 * Everything a ResourceStatusWidget needs to show a card. Plain data, so it can be saved and edited
 */
export type ResourceStatusWidgetConfig = ResourceStatusSummaryWidgetConfig | ResourceStatusBreakdownWidgetConfig;
