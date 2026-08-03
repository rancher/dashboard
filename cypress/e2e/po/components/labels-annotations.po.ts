import ComponentPo from '@/cypress/e2e/po/components/component.po';
import KeyValuePo from '@/cypress/e2e/po/components/key-value.po';

/**
 * Page object for the Labels.vue component (shell/components/form/Labels.vue).
 * Returns KeyValuePo instances for the labels and annotations sections.
 */
export default class LabelsAnnotationsPo extends ComponentPo {
  labels(): KeyValuePo {
    return new KeyValuePo(`[data-testid="labels-keyvalue"]`, true);
  }

  annotations(): KeyValuePo {
    return new KeyValuePo(`[data-testid="annotations-keyvalue"]`, true);
  }
}
