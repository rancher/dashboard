import jsyaml from 'js-yaml';
import resourceTemplateUtils from '@shell/utils/resource-template';
import { CATTLE_UI_RESOURCE_TEMPLATE, CATTLE_UI_RESOURCE_TEMPLATE_APPLIED } from '@shell/config/labels-annotations';
import { CONFIG_MAP } from '@shell/config/types';

describe('resourceTemplateUtils', () => {
  describe('dataKey', () => {
    it('should be the ConfigMap.data key used to store the template yaml', () => {
      expect(resourceTemplateUtils.dataKey).toBe('template.yaml');
    });
  });

  describe('fetchTemplates', () => {
    it('should dispatch findLabelSelector scoped to the resource type label, without watching', async() => {
      const dispatch = jest.fn().mockResolvedValue(['a', 'b']);
      const store = { dispatch };

      const result = await resourceTemplateUtils.fetchTemplates(store, 'apps.deployment');

      expect(dispatch).toHaveBeenCalledWith('cluster/findLabelSelector', {
        type:     CONFIG_MAP,
        matching: { labelSelector: { matchLabels: { [CATTLE_UI_RESOURCE_TEMPLATE]: 'apps.deployment' } } },
        opt:      { watch: false },
      });
      expect(result).toStrictEqual(['a', 'b']);
    });
  });

  describe('applyTemplate', () => {
    it('should return the template yaml and label the resource with the source ConfigMap', () => {
      const setLabel = jest.fn();
      const resource = { setLabel };
      const configMap = {
        metadata: { namespace: 'default', name: 'my-template' },
        data:     { [resourceTemplateUtils.dataKey]: 'kind: Deployment' },
      };

      const yaml = resourceTemplateUtils.applyTemplate(resource, configMap);

      expect(yaml).toBe('kind: Deployment');
      expect(setLabel).toHaveBeenCalledWith(CATTLE_UI_RESOURCE_TEMPLATE_APPLIED, 'default/my-template');
    });

    it('should return an empty string when the ConfigMap has no template data', () => {
      const setLabel = jest.fn();
      const resource = { setLabel };
      const configMap = { metadata: { namespace: 'default', name: 'my-template' }, data: {} };

      const yaml = resourceTemplateUtils.applyTemplate(resource, configMap);

      expect(yaml).toBe('');
      expect(setLabel).toHaveBeenCalledWith(CATTLE_UI_RESOURCE_TEMPLATE_APPLIED, 'default/my-template');
    });
  });

  describe('stageFormApply / consumeStagedFormApply', () => {
    afterEach(() => {
      sessionStorage.clear();
    });

    it('should stage the current yaml and the template under the storage key, and consuming it clears storage', () => {
      const configMap = {
        metadata: { namespace: 'default', name: 'my-template' },
        data:     { [resourceTemplateUtils.dataKey]: 'kind: Deployment' },
      };

      resourceTemplateUtils.stageFormApply('kind: Deployment\nmetadata:\n  name: my-edits', configMap);

      expect(sessionStorage.getItem(resourceTemplateUtils.formApplyStorageKey)).not.toBeNull();

      const staged = resourceTemplateUtils.consumeStagedFormApply();

      expect(staged).toStrictEqual({
        currentYaml:       'kind: Deployment\nmetadata:\n  name: my-edits',
        templateYaml:      'kind: Deployment',
        templateNamespace: 'default',
        templateName:      'my-template',
      });
      expect(sessionStorage.getItem(resourceTemplateUtils.formApplyStorageKey)).toBeNull();
    });

    it('should return null when nothing is staged', () => {
      expect(resourceTemplateUtils.consumeStagedFormApply()).toBeNull();
    });

    it('should return null and still clear storage when the staged value is corrupt', () => {
      sessionStorage.setItem(resourceTemplateUtils.formApplyStorageKey, 'not json');

      expect(resourceTemplateUtils.consumeStagedFormApply()).toBeNull();
      expect(sessionStorage.getItem(resourceTemplateUtils.formApplyStorageKey)).toBeNull();
    });
  });

  describe('applyStagedFormApply', () => {
    it('should merge the current edits first, then the template on top, and label the resource', () => {
      const setLabel = jest.fn();
      const resource: any = {
        setLabel, metadata: { name: 'original' }, spec: { replicas: 1 }
      };
      const staged = {
        currentYaml:       'metadata:\n  name: from-edits\nspec:\n  replicas: 2\n',
        templateYaml:      'spec:\n  replicas: 3\n',
        templateNamespace: 'default',
        templateName:      'my-template',
      };

      resourceTemplateUtils.applyStagedFormApply(resource, staged);

      expect(resource.metadata.name).toBe('from-edits');
      expect(resource.spec.replicas).toBe(3);
      expect(setLabel).toHaveBeenCalledWith(CATTLE_UI_RESOURCE_TEMPLATE_APPLIED, 'default/my-template');
    });

    it('should not set the applied label when there is no template yaml', () => {
      const setLabel = jest.fn();
      const resource: any = { setLabel, metadata: { name: 'original' } };
      const staged = {
        currentYaml:       'metadata:\n  name: from-edits\n',
        templateYaml:      '',
        templateNamespace: 'default',
        templateName:      'my-template',
      };

      resourceTemplateUtils.applyStagedFormApply(resource, staged);

      expect(resource.metadata.name).toBe('from-edits');
      expect(setLabel).not.toHaveBeenCalled();
    });

    it('should do nothing when both yamls are empty', () => {
      const setLabel = jest.fn();
      const resource: any = { setLabel, metadata: { name: 'original' } };
      const staged = {
        currentYaml: '', templateYaml: '', templateNamespace: 'default', templateName: 'my-template'
      };

      resourceTemplateUtils.applyStagedFormApply(resource, staged);

      expect(resource.metadata.name).toBe('original');
      expect(setLabel).not.toHaveBeenCalled();
    });

    it('should not throw when a staged yaml fails to parse', () => {
      const setLabel = jest.fn();
      const resource: any = { setLabel, metadata: { name: 'original' } };
      const staged = {
        currentYaml: ':: not valid yaml ::', templateYaml: '', templateNamespace: 'default', templateName: 'my-template'
      };

      expect(() => resourceTemplateUtils.applyStagedFormApply(resource, staged)).not.toThrow();
    });
  });

  describe('mergeTemplateOntoYaml', () => {
    const configMap = {
      metadata: { namespace: 'default', name: 'my-template' },
      data:     { [resourceTemplateUtils.dataKey]: 'spec:\n  type: LoadBalancer\n  ports:\n    - port: 443\n' },
    };

    it('should merge the template onto the current yaml, with the template winning field conflicts', () => {
      const currentYaml = 'apiVersion: v1\nkind: Service\nmetadata:\n  name: my-svc\n  namespace: default\nspec:\n  type: ClusterIP\n';

      const merged = jsyaml.load(resourceTemplateUtils.mergeTemplateOntoYaml(currentYaml, configMap)) as any;

      expect(merged.spec.type).toBe('LoadBalancer');
      expect(merged.spec.ports).toStrictEqual([{ port: 443 }]);
    });

    it('should preserve fields the template does not mention', () => {
      const currentYaml = 'apiVersion: v1\nkind: Service\nmetadata:\n  name: my-svc\n  namespace: default\nspec:\n  type: ClusterIP\n';

      const merged = jsyaml.load(resourceTemplateUtils.mergeTemplateOntoYaml(currentYaml, configMap)) as any;

      expect(merged.apiVersion).toBe('v1');
      expect(merged.kind).toBe('Service');
      expect(merged.metadata.name).toBe('my-svc');
    });

    it('should set the applied label in the merged yaml', () => {
      const currentYaml = 'metadata:\n  name: my-svc\n';

      const merged = jsyaml.load(resourceTemplateUtils.mergeTemplateOntoYaml(currentYaml, configMap)) as any;

      expect(merged.metadata.labels[CATTLE_UI_RESOURCE_TEMPLATE_APPLIED]).toBe('default/my-template');
    });

    it('should just label the current yaml unchanged when the ConfigMap has no template data', () => {
      const currentYaml = 'metadata:\n  name: my-svc\nspec:\n  type: ClusterIP\n';
      const emptyConfigMap = { metadata: { namespace: 'default', name: 'my-template' }, data: {} };

      const merged = jsyaml.load(resourceTemplateUtils.mergeTemplateOntoYaml(currentYaml, emptyConfigMap)) as any;

      expect(merged.spec.type).toBe('ClusterIP');
      expect(merged.metadata.labels[CATTLE_UI_RESOURCE_TEMPLATE_APPLIED]).toBe('default/my-template');
    });

    it('should fall back to an empty object and still label it when the current yaml fails to parse', () => {
      const merged = jsyaml.load(resourceTemplateUtils.mergeTemplateOntoYaml(':: not valid yaml ::', configMap)) as any;

      expect(merged.spec.type).toBe('LoadBalancer');
      expect(merged.metadata.labels[CATTLE_UI_RESOURCE_TEMPLATE_APPLIED]).toBe('default/my-template');
    });

    it('should skip the merge and still label it when the template yaml fails to parse', () => {
      const currentYaml = 'metadata:\n  name: my-svc\nspec:\n  type: ClusterIP\n';
      const badConfigMap = {
        metadata: { namespace: 'default', name: 'my-template' },
        data:     { [resourceTemplateUtils.dataKey]: ':: not valid yaml ::' },
      };

      const merged = jsyaml.load(resourceTemplateUtils.mergeTemplateOntoYaml(currentYaml, badConfigMap)) as any;

      expect(merged.spec.type).toBe('ClusterIP');
      expect(merged.metadata.labels[CATTLE_UI_RESOURCE_TEMPLATE_APPLIED]).toBe('default/my-template');
    });
  });
});
