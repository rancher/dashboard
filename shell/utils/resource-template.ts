import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import { CATTLE_UI_RESOURCE_TEMPLATE, CATTLE_UI_RESOURCE_TEMPLATE_APPLIED } from '@shell/config/labels-annotations';
import { CONFIG_MAP } from '@shell/config/types';

/**
 * Data staged in sessionStorage across a page reload triggered by "apply template to form"
 */
interface StagedFormApply {
  currentYaml: string;
  templateYaml: string;
  templateNamespace: string;
  templateName: string;
}

/**
 * Helper functions for saving/loading resource YAML templates stored as labeled ConfigMaps
 */
class ResourceTemplateUtils {
  /**
   * ConfigMap.data key holding the saved template YAML
   */
  readonly dataKey = 'template.yaml';

  /**
   * sessionStorage key used to stage a form-view "apply template" across a page reload
   */
  readonly formApplyStorageKey = 'rancher-ui-resource-template-form-apply';

  /**
   * Fetch ConfigMaps labeled as a resource template for the given resource type
   */
  async fetchTemplates(store: any, resourceType: string) {
    return store.dispatch('cluster/findLabelSelector', {
      type:     CONFIG_MAP,
      matching: { labelSelector: { matchLabels: { [CATTLE_UI_RESOURCE_TEMPLATE]: resourceType } } },
      opt:      { watch: false },
    });
  }

  /**
   * Apply a template ConfigMap's YAML to a resource, labeling the resource with the ConfigMap it came from
   */
  applyTemplate(resource: any, configMap: any): string {
    const yaml = configMap.data?.[this.dataKey] || '';

    resource.setLabel(
      CATTLE_UI_RESOURCE_TEMPLATE_APPLIED,
      `${ configMap.metadata.namespace }/${ configMap.metadata.name }`
    );

    return yaml;
  }

  /**
   * Stage the current form's in-progress edits and the selected template ahead of a page
   * reload, so both can be reapplied once the page has freshly reloaded (see
   * consumeStagedFormApply/applyStagedFormApply). Applying a template to a live form isn't
   * reliable - many custom edit components copy props into local state on creation and won't
   * react to the resource object being mutated later - so instead we reload the page and merge
   * both YAMLs onto the freshly created/fetched resource before the form ever mounts.
   */
  stageFormApply(currentYaml: string, configMap: any) {
    const payload: StagedFormApply = {
      currentYaml,
      templateYaml:      configMap.data?.[this.dataKey] || '',
      templateNamespace: configMap.metadata.namespace,
      templateName:      configMap.metadata.name,
    };

    try {
      sessionStorage.setItem(this.formApplyStorageKey, JSON.stringify(payload));
    } catch (e) {}
  }

  /**
   * Read back (and always clear, even on parse failure) a staged form-apply payload.
   * Returns null when there's nothing staged.
   */
  consumeStagedFormApply(): StagedFormApply | null {
    let staged: StagedFormApply | null = null;

    try {
      const raw = sessionStorage.getItem(this.formApplyStorageKey);

      if (raw) {
        staged = JSON.parse(raw);
      }
    } catch (e) {
      staged = null;
    } finally {
      try {
        sessionStorage.removeItem(this.formApplyStorageKey);
      } catch (e) {}
    }

    return staged;
  }

  /**
   * Merge a staged payload's YAML(s) onto a freshly created/fetched resource, in place. The
   * user's prior in-progress edits are applied first, then the template on top, so the template
   * (the newer, more deliberate action) wins where the two conflict.
   */
  applyStagedFormApply(resource: any, staged: StagedFormApply) {
    if (staged.currentYaml) {
      this.mergeYamlOnto(resource, staged.currentYaml);
    }

    if (staged.templateYaml) {
      this.mergeYamlOnto(resource, staged.templateYaml);

      resource.setLabel(
        CATTLE_UI_RESOURCE_TEMPLATE_APPLIED,
        `${ staged.templateNamespace }/${ staged.templateName }`
      );
    }
  }

  /**
   * Parse a YAML string and deep-merge its fields onto a resource, in place. Merging (rather
   * than replacing) preserves fields the yaml doesn't mention, along with the resource's own
   * class/prototype (lodash's merge only touches own enumerable properties).
   */
  private mergeYamlOnto(resource: any, yaml: string) {
    try {
      const parsed = jsyaml.load(yaml);

      if (parsed && typeof parsed === 'object') {
        merge(resource, parsed);
      }
    } catch (e) {}
  }
}

export default new ResourceTemplateUtils();
