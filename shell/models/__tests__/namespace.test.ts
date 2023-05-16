import Namespace from '@shell/models/namespace';

describe('class Namespace', () => {
  describe('checking if isSystem', () => {
    it.each([
      ['c-whatever-system', true],
      ['whatever', false]
    ])('should return true if end with "-system', (name, expectation) => {
      const namespace = new Namespace({});

      namespace.metadata = { ...namespace.metadata, name };

      expect(namespace.isSystem).toBe(expectation);
    });
  });

  it.todo('should check if isFleetManaged');

  describe('checking if isObscure', () => {
    it.each([
      ['c-whatever-system', true],
      ['whatever', false],
      ['', false]
    ])('should return a value if has or not a name in the metadata', (name, expectation) => {
      const namespace = new Namespace({});

      namespace.metadata = { ...namespace.metadata, name };

      expect(namespace.isObscure).toBe(expectation);
    });

    it.todo('should return a value if is or not system');
  });

  it.each([
    ['foo:bar', 'bar'],
    ['', null]
  ])('given %p annotation, projectId should be %p', (value, result) => {
    const namespace = new Namespace({});

    namespace.metadata = { name: '', annotations: { 'field.cattle.io/projectId': value } };

    expect(namespace.projectId).toBe(result);
  });

  it.todo('should return the project');
  it.todo('should return the groupByLabel with i18n');
  it.todo('should return the project name with i18n');
  it.todo('should return the projectNameSort');
  it.todo('should check if istioInstalled');
  it.todo('should check if injectionEnabled');

  describe('handling Istio  labels', () => {
    const save = jest.fn();

    it.each([
      { metadata: { name: '', labels: { 'istio-injection': 'whatever' } }, save },
      [{ metadata: { name: '', labels: { 'istio-injection': 'whatever' } }, save }],
    ])('should handle both data as list and single object and save', (data) => {
      const namespace = new Namespace({});

      namespace.enableAutoInjection(data as unknown as Namespace);

      expect(save).toHaveBeenCalledWith();
    });

    it('should add auto injection label as enable', () => {
      const data = { metadata: { name: '', labels: { 'istio-injection': 'whatever' } }, save };
      const namespace = new Namespace({});

      namespace.enableAutoInjection(data as unknown as Namespace);

      expect(data.metadata!.labels['istio-injection']).toBe('enabled');
    });

    it('should remove label on disable', () => {
      const data = { metadata: { name: '', labels: { 'istio-injection': 'whatever' } }, save };
      const namespace = new Namespace({});

      namespace.enableAutoInjection(data as unknown as Namespace, false);

      expect(data.metadata!.labels['istio-injection']).toBeUndefined();
    });
  });

  it.todo('should disableAutoInjection');
  it.todo('should check if confirmRemove');

  describe('handling listLocation', () => {
    it.each([
      ['c-cluster-product-projectsnamespaces', true],
      ['c-cluster-product-resource', false],
    ])('should return the name %p if is Rancher (%p)', (name, isRancher) => {
      const namespace = new Namespace({});

      jest.spyOn(namespace, '$rootGetters', 'get').mockReturnValue({
        isRancher,
        currentProduct: { inStore: '' }
      });

      expect(namespace.listLocation.name).toBe(name);
    });

    it('should return the name and resource if Harvester', () => {
      const namespace = new Namespace({});

      jest.spyOn(namespace, '$rootGetters', 'get').mockReturnValue({
        isRancher:      true,
        currentProduct: { inStore: 'harvester' }
      });

      const value = {
        name:   'harvester-c-cluster-projectsnamespaces',
        params: { resource: 'namespace' }
      };

      expect(namespace.listLocation).toStrictEqual(value);
    });
  });

  it.todo('should return _detailLocation with a name');
  it.todo('should return the resourceQuota');
  it.todo('should set the resourceQuota as reactive Vue property');
  it.todo('should reset project with cleanForNew');
});
