import { schemaForReference, schemaReferencesIn, schemasByKind } from '@shell/utils/schema-references';

type ResourceField = { type: string, subtype?: string };
type Definition = { type: string, resourceFields: { [field: string]: ResourceField } };

const CORE = 'io.k8s.api.core.v1.';
const OBJECT_META = 'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta';
const OWNER_REFERENCE = 'io.k8s.apimachinery.pkg.apis.meta.v1.OwnerReference';
const OBJECT_REFERENCE = `${ CORE }ObjectReference`;
const LOCAL_OBJECT_REFERENCE = `${ CORE }LocalObjectReference`;
const TYPED_LOCAL_OBJECT_REFERENCE = `${ CORE }TypedLocalObjectReference`;
const TYPED_OBJECT_REFERENCE = `${ CORE }TypedObjectReference`;
const CROSS_VERSION_V1 = 'io.k8s.api.autoscaling.v1.CrossVersionObjectReference';
const CROSS_VERSION_V2 = 'io.k8s.api.autoscaling.v2.CrossVersionObjectReference';
const GATEWAY_ROUTE = 'io.k8s.networking.gateway.v1.HTTPRoute';

/** A field holding a value of `type`, or an `array` or `map` of `subtype` */
const field = (type: string, subtype?: string): ResourceField => (subtype ? { type, subtype } : { type });

const STRING = field('string');

/** A definition, as steve sends it from `/v1/schemaDefinitions/<type>` */
const definition = (type: string, resourceFields: { [field: string]: ResourceField }): Definition => ({ type, resourceFields });

/** A resource definition, with the fields every kubernetes resource has */
const resourceDefinition = (type: string, extra: { [field: string]: ResourceField } = {}): Definition => definition(type, {
  apiVersion: STRING,
  kind:       STRING,
  metadata:   field(OBJECT_META),
  spec:       field(`${ type }Spec`),
  status:     field(`${ type }Status`),
  ...extra,
});

/** Built-in definitions, with the fields steve sends for them, read from a rancher server */
const BUILT_IN: Definition[] = [
  definition(OBJECT_META, {
    name: STRING, namespace: STRING, ownerReferences: field('array', OWNER_REFERENCE)
  }),
  definition(OWNER_REFERENCE, {
    apiVersion: STRING, kind: STRING, name: STRING, uid: STRING
  }),
  definition(OBJECT_REFERENCE, {
    apiVersion: STRING, fieldPath: STRING, kind: STRING, name: STRING, namespace: STRING, resourceVersion: STRING, uid: STRING
  }),
  definition(TYPED_LOCAL_OBJECT_REFERENCE, {
    apiGroup: STRING, kind: STRING, name: STRING
  }),
  definition(TYPED_OBJECT_REFERENCE, {
    apiGroup: STRING, kind: STRING, name: STRING, namespace: STRING
  }),
  definition(CROSS_VERSION_V1, {
    apiVersion: STRING, kind: STRING, name: STRING
  }),
  definition(CROSS_VERSION_V2, {
    apiVersion: STRING, kind: STRING, name: STRING
  }),
  definition('io.k8s.api.rbac.v1.RoleRef', {
    apiGroup: STRING, kind: STRING, name: STRING
  }),
  definition('io.k8s.api.rbac.v1.Subject', {
    apiGroup: STRING, kind: STRING, name: STRING, namespace: STRING
  }),
  definition(LOCAL_OBJECT_REFERENCE, { name: STRING }),
  definition(`${ CORE }SecretReference`, { name: STRING, namespace: STRING }),
  definition(`${ CORE }SecretKeySelector`, { key: STRING, name: STRING }),
  definition(`${ CORE }SecretEnvSource`, { name: STRING }),
  definition(`${ CORE }SecretProjection`, { name: STRING }),
  definition(`${ CORE }SecretVolumeSource`, { defaultMode: field('int'), secretName: STRING }),
  definition(`${ CORE }ConfigMapKeySelector`, { key: STRING, name: STRING }),
  definition(`${ CORE }ConfigMapEnvSource`, { name: STRING }),
  definition(`${ CORE }ConfigMapProjection`, { name: STRING }),
  definition(`${ CORE }ConfigMapVolumeSource`, { defaultMode: field('int'), name: STRING }),
  definition(`${ CORE }PersistentVolumeClaimVolumeSource`, { claimName: STRING, readOnly: field('boolean') }),
  definition('io.k8s.api.admissionregistration.v1.ServiceReference', {
    name: STRING, namespace: STRING, path: STRING, port: field('int')
  }),
  definition('io.k8s.kube-aggregator.pkg.apis.apiregistration.v1.ServiceReference', {
    name: STRING, namespace: STRING, port: field('int')
  }),

  // pods
  definition(`${ CORE }PodTemplateSpec`, { metadata: field(OBJECT_META), spec: field(`${ CORE }PodSpec`) }),
  definition(`${ CORE }PodSpec`, {
    containers:         field('array', `${ CORE }Container`),
    initContainers:     field('array', `${ CORE }Container`),
    volumes:            field('array', `${ CORE }Volume`),
    imagePullSecrets:   field('array', LOCAL_OBJECT_REFERENCE),
    serviceAccountName: STRING,
    serviceAccount:     STRING,
  }),
  definition(`${ CORE }Container`, {
    name: STRING, env: field('array', `${ CORE }EnvVar`), envFrom: field('array', `${ CORE }EnvFromSource`)
  }),
  definition(`${ CORE }EnvVar`, {
    name: STRING, value: STRING, valueFrom: field(`${ CORE }EnvVarSource`)
  }),
  definition(`${ CORE }EnvVarSource`, { configMapKeyRef: field(`${ CORE }ConfigMapKeySelector`), secretKeyRef: field(`${ CORE }SecretKeySelector`) }),
  definition(`${ CORE }EnvFromSource`, {
    configMapRef: field(`${ CORE }ConfigMapEnvSource`), prefix: STRING, secretRef: field(`${ CORE }SecretEnvSource`)
  }),
  definition(`${ CORE }Volume`, {
    name:                  STRING,
    configMap:             field(`${ CORE }ConfigMapVolumeSource`),
    secret:                field(`${ CORE }SecretVolumeSource`),
    persistentVolumeClaim: field(`${ CORE }PersistentVolumeClaimVolumeSource`),
    projected:             field(`${ CORE }ProjectedVolumeSource`),
    csi:                   field(`${ CORE }CSIVolumeSource`),
    ephemeral:             field(`${ CORE }EphemeralVolumeSource`),
  }),
  definition(`${ CORE }ProjectedVolumeSource`, { sources: field('array', `${ CORE }VolumeProjection`) }),
  definition(`${ CORE }VolumeProjection`, { configMap: field(`${ CORE }ConfigMapProjection`), secret: field(`${ CORE }SecretProjection`) }),
  definition(`${ CORE }CSIVolumeSource`, { driver: STRING, nodePublishSecretRef: field(LOCAL_OBJECT_REFERENCE) }),
  definition(`${ CORE }EphemeralVolumeSource`, { volumeClaimTemplate: field(`${ CORE }PersistentVolumeClaimTemplate`) }),

  // storage
  definition(`${ CORE }PersistentVolumeClaimTemplate`, { metadata: field(OBJECT_META), spec: field(`${ CORE }PersistentVolumeClaimSpec`) }),
  resourceDefinition(`${ CORE }PersistentVolumeClaim`),
  definition(`${ CORE }PersistentVolumeClaimSpec`, {
    storageClassName:          STRING,
    volumeAttributesClassName: STRING,
    volumeName:                STRING,
    dataSource:                field(TYPED_LOCAL_OBJECT_REFERENCE),
    dataSourceRef:             field(TYPED_OBJECT_REFERENCE),
  }),
  resourceDefinition(`${ CORE }PersistentVolume`),
  definition(`${ CORE }PersistentVolumeSpec`, {
    claimRef:                  field(OBJECT_REFERENCE),
    csi:                       field(`${ CORE }CSIPersistentVolumeSource`),
    storageClassName:          STRING,
    volumeAttributesClassName: STRING,
  }),
  definition(`${ CORE }CSIPersistentVolumeSource`, { driver: STRING, nodePublishSecretRef: field(`${ CORE }SecretReference`) }),

  // workloads
  resourceDefinition('io.k8s.api.apps.v1.Deployment'),
  definition('io.k8s.api.apps.v1.DeploymentSpec', { replicas: field('int'), template: field(`${ CORE }PodTemplateSpec`) }),
  resourceDefinition('io.k8s.api.apps.v1.StatefulSet'),
  definition('io.k8s.api.apps.v1.StatefulSetSpec', { template: field(`${ CORE }PodTemplateSpec`), volumeClaimTemplates: field('array', `${ CORE }PersistentVolumeClaim`) }),
  resourceDefinition('io.k8s.api.batch.v1.CronJob'),
  definition('io.k8s.api.batch.v1.CronJobSpec', { jobTemplate: field('io.k8s.api.batch.v1.JobTemplateSpec'), schedule: STRING }),
  definition('io.k8s.api.batch.v1.JobTemplateSpec', { metadata: field(OBJECT_META), spec: field('io.k8s.api.batch.v1.JobSpec') }),
  definition('io.k8s.api.batch.v1.JobSpec', { template: field(`${ CORE }PodTemplateSpec`) }),

  // autoscaling
  resourceDefinition('io.k8s.api.autoscaling.v2.HorizontalPodAutoscaler'),
  definition('io.k8s.api.autoscaling.v2.HorizontalPodAutoscalerSpec', {
    maxReplicas:    field('int'),
    metrics:        field('array', 'io.k8s.api.autoscaling.v2.MetricSpec'),
    scaleTargetRef: field(CROSS_VERSION_V2),
  }),
  definition('io.k8s.api.autoscaling.v2.MetricSpec', { object: field('io.k8s.api.autoscaling.v2.ObjectMetricSource'), type: STRING }),
  definition('io.k8s.api.autoscaling.v2.ObjectMetricSource', { describedObject: field(CROSS_VERSION_V2), metric: field('io.k8s.api.autoscaling.v2.MetricIdentifier') }),
  definition('io.k8s.api.autoscaling.v2.MetricIdentifier', { name: STRING }),

  // networking
  resourceDefinition('io.k8s.api.networking.v1.Ingress'),
  definition('io.k8s.api.networking.v1.IngressSpec', {
    ingressClassName: STRING,
    defaultBackend:   field('io.k8s.api.networking.v1.IngressBackend'),
    tls:              field('array', 'io.k8s.api.networking.v1.IngressTLS'),
    rules:            field('array', 'io.k8s.api.networking.v1.IngressRule'),
  }),
  definition('io.k8s.api.networking.v1.IngressBackend', { resource: field(TYPED_LOCAL_OBJECT_REFERENCE), service: field('io.k8s.api.networking.v1.IngressServiceBackend') }),
  definition('io.k8s.api.networking.v1.IngressServiceBackend', { name: STRING, port: field('io.k8s.api.networking.v1.ServiceBackendPort') }),
  definition('io.k8s.api.networking.v1.ServiceBackendPort', { name: STRING, number: field('int') }),
  definition('io.k8s.api.networking.v1.IngressTLS', { hosts: field('array', 'string'), secretName: STRING }),
  definition('io.k8s.api.networking.v1.IngressRule', { host: STRING, http: field('io.k8s.api.networking.v1.HTTPIngressRuleValue') }),
  definition('io.k8s.api.networking.v1.HTTPIngressRuleValue', { paths: field('array', 'io.k8s.api.networking.v1.HTTPIngressPath') }),
  definition('io.k8s.api.networking.v1.HTTPIngressPath', { backend: field('io.k8s.api.networking.v1.IngressBackend'), path: STRING }),
];

/** A steve schema whose definitions have been fetched, with `root` as the definition of its type */
const schemaWith = (root: string, extra: Definition[] = []) => {
  const byName = Object.fromEntries([...BUILT_IN, ...extra].map((d) => [d.type, d]));

  return {
    id: root, requiresResourceFields: true, schemaDefinition: byName[root], schemaDefinitions: byName
  };
};

const referencesIn = (root: string, resource: any, extra: Definition[] = []) => schemaReferencesIn(schemaWith(root, extra), resource, jest.fn());

/** A custom resource, whose definitions are named after their path */
const THING = 'io.example.v1.Thing';

/** The definitions of a custom resource whose `spec` and `status` have `fields` */
const thing = (fields: { [field: string]: ResourceField }, extra: Definition[] = []): Definition[] => [
  definition(THING, {
    apiVersion: STRING, kind: STRING, metadata: field(OBJECT_META), spec: field(`${ THING }.spec`), status: field(`${ THING }.status`)
  }),
  definition(`${ THING }.spec`, fields),
  definition(`${ THING }.status`, fields),
  ...extra,
];

/** The references in the `spec` of a custom resource, whose `spec` has `fields` */
const specReferences = (fields: { [field: string]: ResourceField }, spec: any, extra: Definition[] = []) => referencesIn(THING, { spec }, thing(fields, extra));

/** The references in `spec.ref` of a custom resource, where `ref` has its own definition with `fields` */
const customReferences = (fields: { [field: string]: ResourceField }, ref: any) => specReferences({ ref: field(`${ THING }.spec.ref`) }, { ref }, [definition(`${ THING }.spec.ref`, fields)]);

describe('utils: schema-references', () => {
  describe('schemaReferencesIn', () => {
    describe('input', () => {
      it('should return no references when the definitions of the schema have not been fetched', () => {
        const schema = {
          id: THING, requiresResourceFields: true, schemaDefinition: null, schemaDefinitions: null
        };

        expect(schemaReferencesIn(schema, { spec: { ref: { kind: 'Secret', name: 's' } } }, jest.fn())).toStrictEqual([]);
      });

      it('should return no references when there is no resource', () => {
        expect(schemaReferencesIn(schemaWith(THING, thing({ ref: field(OBJECT_REFERENCE) })), null, jest.fn())).toStrictEqual([]);
      });

      it('should read the definitions of a schema with `requiresResourceFields` from `schemaDefinition` and `schemaDefinitions`', () => {
        const schemaFor = jest.fn();
        const references = schemaReferencesIn(
          schemaWith(THING, thing({ ref: field(OBJECT_REFERENCE) })),
          { spec: { ref: { kind: 'Secret', name: 's' } } },
          schemaFor
        );

        expect(references).toStrictEqual([{
          kind: 'Secret', group: undefined, name: 's', namespace: undefined, path: '.spec.ref'
        }]);
        expect(schemaFor).toHaveBeenCalledTimes(0);
      });

      it('should find the types of the fields of a schema with `resourceFields` of its own with `schemaFor`', () => {
        const objectReference = BUILT_IN.find((d) => d.type === OBJECT_REFERENCE);
        const schemas: { [type: string]: any } = {
          'legacy.thing.spec': { resourceFields: { refs: field(`array[${ OBJECT_REFERENCE }]`) } },
          [OBJECT_REFERENCE]:  objectReference,
        };
        const schemaFor = jest.fn((type: string) => schemas[type]);
        const schema = {
          id: 'legacy.thing', requiresResourceFields: false, resourceFields: { spec: field('legacy.thing.spec') }
        };

        const references = schemaReferencesIn(schema, { spec: { refs: [{ kind: 'Secret', name: 's' }] } }, schemaFor);

        expect(references).toStrictEqual([{
          kind: 'Secret', group: undefined, name: 's', namespace: undefined, path: '.spec.refs[0]'
        }]);
        expect(schemaFor).toHaveBeenCalledWith('legacy.thing.spec');
      });
    });

    describe('search', () => {
      it('should skip searching for references in `metadata` and `status` of the resource itself', () => {
        const root = definition('io.example.v1.Root', {
          metadata: field(OBJECT_REFERENCE), spec: field(OBJECT_REFERENCE), status: field(OBJECT_REFERENCE)
        });
        const resource = {
          metadata: { kind: 'Secret', name: 'in-metadata' },
          spec:     { kind: 'Secret', name: 'in-spec' },
          status:   { kind: 'Secret', name: 'in-status' },
        };

        expect(referencesIn('io.example.v1.Root', resource, [root]).map((r) => r.name)).toStrictEqual(['in-spec']);
      });

      it('should search in a field named `metadata` or `status` below the resource itself, such as `spec.template.metadata`', () => {
        const references = specReferences(
          { metadata: field(OBJECT_REFERENCE), status: field(OBJECT_REFERENCE) },
          { metadata: { kind: 'Secret', name: 'a' }, status: { kind: 'Secret', name: 'b' } }
        );

        expect(references.map((r) => r.path)).toStrictEqual(['.spec.metadata', '.spec.status']);
      });

      it('should search each item of an array field, recording its index in the path', () => {
        const references = specReferences({ refs: field('array', OBJECT_REFERENCE) }, { refs: [{ kind: 'Secret', name: 'a' }, { kind: 'Secret', name: 'b' }] });

        expect(references.map((r) => [r.path, r.name])).toStrictEqual([['.spec.refs[0]', 'a'], ['.spec.refs[1]', 'b']]);
      });

      it('should search each value of a map field, recording its key in the path', () => {
        const references = specReferences({ refs: field('map', OBJECT_REFERENCE) }, { refs: { first: { kind: 'Secret', name: 'a' }, second: { kind: 'Secret', name: 'b' } } });

        expect(references.map((r) => [r.path, r.name])).toStrictEqual([['.spec.refs.first', 'a'], ['.spec.refs.second', 'b']]);
      });

      it.each([
        ['null', null],
        ['undefined', undefined],
      ])('should skip a field whose value is %s', (_label, value) => {
        const references = specReferences(
          {
            single: field(OBJECT_REFERENCE), list: field('array', OBJECT_REFERENCE), name: STRING, kept: field(OBJECT_REFERENCE)
          },
          {
            single: value, list: value, name: value, kept: { kind: 'Secret', name: 'kept' }
          }
        );

        expect(references.map((r) => r.name)).toStrictEqual(['kept']);
      });

      it('should skip `StatefulSetSpec.volumeClaimTemplates` and `EphemeralVolumeSource.volumeClaimTemplate`', () => {
        const claimSpec = { storageClassName: 'fast', dataSource: { kind: 'PersistentVolumeClaim', name: 'source' } };
        const statefulSet = {
          spec: {
            volumeClaimTemplates: [{ spec: claimSpec }],
            template:             { spec: { volumes: [{ name: 'scratch', ephemeral: { volumeClaimTemplate: { spec: claimSpec } } }] } },
          }
        };

        expect(referencesIn('io.k8s.api.apps.v1.StatefulSet', statefulSet)).toStrictEqual([]);
      });

      it('should keep searching inside a reference for the references it holds', () => {
        const backendRef = `${ THING }.spec.backendRef`;
        const references = specReferences(
          { backendRef: field(backendRef) },
          {
            backendRef: {
              kind: 'Service', name: 'outer', filters: [{ mirror: { kind: 'Service', name: 'inner' } }]
            }
          },
          [
            definition(backendRef, {
              filters: field('array', `${ backendRef }.filters`), group: STRING, kind: STRING, name: STRING
            }),
            definition(`${ backendRef }.filters`, { mirror: field(`${ backendRef }.filters.mirror`) }),
            definition(`${ backendRef }.filters.mirror`, {
              group: STRING, kind: STRING, name: STRING
            }),
          ]
        );

        expect(references.map((r) => [r.path, r.name])).toStrictEqual([['.spec.backendRef', 'outer'], ['.spec.backendRef.filters[0].mirror', 'inner']]);
      });

      it('should record the path of each reference from the resource itself, such as `.spec.scaleTargetRef`', () => {
        const deployment = { spec: { template: { spec: { containers: [{ name: 'app', env: [{ name: 'PLAIN', value: 'x' }, { name: 'SECRET', valueFrom: { secretKeyRef: { name: 'creds', key: 'password' } } }] }] } } } };

        expect(referencesIn('io.k8s.api.apps.v1.Deployment', deployment).map((r) => r.path)).toStrictEqual(['.spec.template.spec.containers[0].env[1].valueFrom.secretKeyRef']);
      });
    });

    describe('built-in reference definitions', () => {
      it('should read kind, name and namespace of an `ObjectReference`, and the group from its `apiVersion`', () => {
        const references = specReferences({ ref: field(OBJECT_REFERENCE) }, {
          ref: {
            apiVersion: 'apps/v1', kind: 'Deployment', name: 'web', namespace: 'other', uid: '1234'
          }
        });

        expect(references).toStrictEqual([{
          kind: 'Deployment', group: 'apps', name: 'web', namespace: 'other', path: '.spec.ref'
        }]);
      });

      it.each([CROSS_VERSION_V1, CROSS_VERSION_V2])('should read a `CrossVersionObjectReference` of %s', (crossVersion) => {
        const references = specReferences({ ref: field(crossVersion) }, {
          ref: {
            apiVersion: 'apps/v1', kind: 'StatefulSet', name: 'db'
          }
        });

        expect(references).toStrictEqual([{
          kind: 'StatefulSet', group: 'apps', name: 'db', path: '.spec.ref'
        }]);
      });

      it.each([
        [OBJECT_REFERENCE, {
          kind: 'Deployment', group: undefined, name: 'web', namespace: undefined, path: '.spec.ref'
        }],
        [CROSS_VERSION_V2, {
          kind: 'Deployment', group: undefined, name: 'web', path: '.spec.ref'
        }],
      ])('should leave the group undefined for a %s with no `apiVersion`', (reference, expected) => {
        expect(specReferences({ ref: field(reference) }, { ref: { kind: 'Deployment', name: 'web' } })).toStrictEqual([expected]);
      });

      it.each([
        [TYPED_LOCAL_OBJECT_REFERENCE, {
          kind: 'Role', group: 'rbac.authorization.k8s.io', name: 'reader', path: '.spec.ref'
        }],
        [TYPED_OBJECT_REFERENCE, {
          kind: 'Role', group: 'rbac.authorization.k8s.io', name: 'reader', namespace: undefined, path: '.spec.ref'
        }],
        ['io.k8s.api.rbac.v1.RoleRef', {
          kind: 'Role', group: 'rbac.authorization.k8s.io', name: 'reader', path: '.spec.ref'
        }],
        ['io.k8s.api.rbac.v1.Subject', {
          kind: 'Role', group: 'rbac.authorization.k8s.io', name: 'reader', namespace: undefined, path: '.spec.ref'
        }],
      ])('should read the group of a %s from `apiGroup`', (reference, expected) => {
        const references = specReferences({ ref: field(reference) }, {
          ref: {
            apiGroup: 'rbac.authorization.k8s.io', kind: 'Role', name: 'reader'
          }
        });

        expect(references).toStrictEqual([expected]);
      });

      it.each([
        ['unset', undefined],
        ['null', null],
      ])('should read an %s `apiGroup` as the core group', (_label, apiGroup) => {
        const references = specReferences({ ref: field(TYPED_LOCAL_OBJECT_REFERENCE) }, {
          ref: {
            apiGroup, kind: 'PersistentVolumeClaim', name: 'source'
          }
        });

        expect(references).toStrictEqual([{
          kind: 'PersistentVolumeClaim', group: '', name: 'source', path: '.spec.ref'
        }]);
      });

      it.each([
        [`${ CORE }SecretKeySelector`, 'Secret'],
        [`${ CORE }SecretEnvSource`, 'Secret'],
        [`${ CORE }SecretProjection`, 'Secret'],
        [`${ CORE }ConfigMapKeySelector`, 'ConfigMap'],
        [`${ CORE }ConfigMapEnvSource`, 'ConfigMap'],
        [`${ CORE }ConfigMapProjection`, 'ConfigMap'],
        [`${ CORE }ConfigMapVolumeSource`, 'ConfigMap'],
        ['io.k8s.api.networking.v1.IngressServiceBackend', 'Service'],
      ])('should give a %s the kind %s in the core group', (reference, kind) => {
        expect(specReferences({ ref: field(reference) }, { ref: { name: 'target' } })).toStrictEqual([{
          kind, group: '', name: 'target', namespace: undefined, path: '.spec.ref'
        }]);
      });

      it('should read the name of a `SecretVolumeSource` from `secretName`', () => {
        expect(specReferences({ ref: field(`${ CORE }SecretVolumeSource`) }, { ref: { secretName: 'certs' } })).toStrictEqual([{
          kind: 'Secret', group: '', name: 'certs', namespace: undefined, path: '.spec.ref'
        }]);
      });

      it('should read the name of a `PersistentVolumeClaimVolumeSource` from `claimName`', () => {
        expect(specReferences({ ref: field(`${ CORE }PersistentVolumeClaimVolumeSource`) }, { ref: { claimName: 'data' } })).toStrictEqual([{
          kind: 'PersistentVolumeClaim', group: '', name: 'data', namespace: undefined, path: '.spec.ref'
        }]);
      });

      it.each([
        [`${ CORE }SecretReference`, 'Secret'],
        ['io.k8s.api.admissionregistration.v1.ServiceReference', 'Service'],
        ['io.k8s.kube-aggregator.pkg.apis.apiregistration.v1.ServiceReference', 'Service'],
      ])('should read the namespace of a %s', (reference, kind) => {
        expect(specReferences({ ref: field(reference) }, { ref: { name: 'target', namespace: 'other' } })).toStrictEqual([{
          kind, group: '', name: 'target', namespace: 'other', path: '.spec.ref'
        }]);
      });

      it.each(['imagePullSecrets', 'secretRef', 'nodePublishSecretRef'])('should take a `LocalObjectReference` in `%s` to refer to a Secret', (fieldName) => {
        expect(specReferences({ [fieldName]: field(LOCAL_OBJECT_REFERENCE) }, { [fieldName]: { name: 'target' } })).toStrictEqual([{
          kind: 'Secret', group: '', name: 'target', namespace: undefined, path: `.spec.${ fieldName }`
        }]);
      });

      it('should skip a `LocalObjectReference` in a field whose name does not contain `secret`', () => {
        expect(specReferences({ templateRef: field(LOCAL_OBJECT_REFERENCE) }, { templateRef: { name: 'target' } })).toStrictEqual([]);
      });

      it.each([`${ CORE }NotInTheTable`, OWNER_REFERENCE])('should skip the built-in definition %s, which is missing from the table and declares `kind` and `name`', (reference) => {
        const references = specReferences(
          { ref: field(reference) },
          {
            ref: {
              apiVersion: 'v1', kind: 'Secret', name: 'target'
            }
          },
          [definition(`${ CORE }NotInTheTable`, {
            apiVersion: STRING, kind: STRING, name: STRING
          })]
        );

        expect(references).toStrictEqual([]);
      });
    });

    describe('name fields', () => {
      it.each([
        [`${ CORE }PodSpec`, 'serviceAccountName', 'ServiceAccount', ''],
        [`${ CORE }PodSpec`, 'serviceAccount', 'ServiceAccount', ''],
        [`${ CORE }PersistentVolumeClaimSpec`, 'storageClassName', 'StorageClass', 'storage.k8s.io'],
        [`${ CORE }PersistentVolumeClaimSpec`, 'volumeAttributesClassName', 'VolumeAttributesClass', 'storage.k8s.io'],
        [`${ CORE }PersistentVolumeClaimSpec`, 'volumeName', 'PersistentVolume', ''],
        [`${ CORE }PersistentVolumeSpec`, 'storageClassName', 'StorageClass', 'storage.k8s.io'],
        [`${ CORE }PersistentVolumeSpec`, 'volumeAttributesClassName', 'VolumeAttributesClass', 'storage.k8s.io'],
        [`${ CORE }CSIPersistentVolumeSource`, 'driver', 'CSIDriver', 'storage.k8s.io'],
        ['io.k8s.api.networking.v1.IngressSpec', 'ingressClassName', 'IngressClass', 'networking.k8s.io'],
        ['io.k8s.api.networking.v1.IngressTLS', 'secretName', 'Secret', ''],
      ])('should find the resource %s.%s refers to, a %s of group "%s"', (holder, fieldName, kind, group) => {
        expect(specReferences({ holder: field(holder) }, { holder: { [fieldName]: 'target' } })).toStrictEqual([{
          kind, group, name: 'target', path: `.spec.holder.${ fieldName }`
        }]);
      });

      it('should skip a name field holding an empty string', () => {
        expect(specReferences({ holder: field(`${ CORE }PodSpec`) }, { holder: { serviceAccountName: '' } })).toStrictEqual([]);
      });

      it('should find the ServiceAccount of a pod spec from `serviceAccount` when `serviceAccountName` is unset', () => {
        const deployment = { spec: { template: { spec: { serviceAccount: 'legacy' } } } };

        expect(referencesIn('io.k8s.api.apps.v1.Deployment', deployment)).toStrictEqual([{
          kind: 'ServiceAccount', group: '', name: 'legacy', path: '.spec.template.spec.serviceAccount'
        }]);
      });
    });

    describe('custom resource definitions', () => {
      it('should take a definition declaring both `kind` and `name` to be a reference', () => {
        expect(customReferences({ kind: STRING, name: STRING }, { kind: 'Widget', name: 'w' })).toStrictEqual([{
          kind: 'Widget', group: undefined, name: 'w', namespace: undefined, path: '.spec.ref'
        }]);
      });

      it.each([
        ['`kind`', { kind: STRING, other: STRING }],
        ['`name`', { name: STRING, other: STRING }],
      ])('should skip a definition declaring only %s', (_label, fields) => {
        expect(customReferences(fields, { kind: 'Widget', name: 'w' })).toStrictEqual([]);
      });

      it.each([
        ['apiGroup', 'example.io', 'example.io'],
        ['apiGroup', undefined, ''],
        ['group', 'example.io', 'example.io'],
        ['group', undefined, ''],
        ['group', '', ''],
      ])('should read the group from `%s` when the definition declares it, given "%s" reading "%s"', (groupField, value, expected) => {
        const references = customReferences({
          [groupField]: STRING, kind: STRING, name: STRING
        }, {
          [groupField]: value, kind: 'Widget', name: 'w'
        });

        expect(references.map((r) => r.group)).toStrictEqual([expected]);
      });

      it('should read the group from `apiVersion` when the definition declares it', () => {
        const references = customReferences({
          apiVersion: STRING, kind: STRING, name: STRING
        }, {
          apiVersion: 'example.io/v1', kind: 'Widget', name: 'w'
        });

        expect(references.map((r) => r.group)).toStrictEqual(['example.io']);
      });

      // as in the machine config reference of a provisioning cluster using a rancher node driver
      it('should leave the group undefined when the definition declares `apiVersion` but the value has none', () => {
        const references = customReferences({
          apiVersion: STRING, kind: STRING, name: STRING
        }, { kind: 'Amazonec2Config', name: 'pool-config' });

        expect(references.map((r) => r.group)).toStrictEqual([undefined]);
      });

      it('should leave the group undefined when the definition declares none of `apiGroup`, `group` and `apiVersion`', () => {
        const references = customReferences({ kind: STRING, name: STRING }, {
          apiGroup: 'example.io', group: 'example.io', apiVersion: 'example.io/v1', kind: 'Widget', name: 'w'
        });

        expect(references.map((r) => r.group)).toStrictEqual([undefined]);
      });

      it.each([
        ['declares it', {
          kind: STRING, name: STRING, namespace: STRING
        }, 'other'],
        ['does not declare it', { kind: STRING, name: STRING }, undefined],
      ])('should read `namespace` when the definition %s', (_label, fields, expected) => {
        const references = customReferences(fields, {
          kind: 'Widget', name: 'w', namespace: 'other'
        });

        expect(references.map((r) => r.namespace)).toStrictEqual([expected]);
      });

      it('should apply the shape test to gateway api definitions, named `io.k8s.networking.gateway.*`', () => {
        const references = referencesIn(GATEWAY_ROUTE, { spec: { parentRef: { kind: 'Gateway', name: 'edge' } } }, [
          definition(GATEWAY_ROUTE, { spec: field(`${ GATEWAY_ROUTE }.spec`) }),
          definition(`${ GATEWAY_ROUTE }.spec`, { parentRef: field(`${ GATEWAY_ROUTE }.spec.parentRef`) }),
          definition(`${ GATEWAY_ROUTE }.spec.parentRef`, {
            group: STRING, kind: STRING, name: STRING
          }),
        ]);

        expect(references).toStrictEqual([{
          kind: 'Gateway', group: '', name: 'edge', namespace: undefined, path: '.spec.parentRef'
        }]);
      });
    });

    describe('references left out', () => {
      it.each([
        ['kind', { apiVersion: 'v1', name: 'target' }],
        ['name', { apiVersion: 'v1', kind: 'Secret' }],
      ])('should leave out a reference with no %s in its value', (_label, ref) => {
        expect(specReferences({ ref: field(OBJECT_REFERENCE) }, { ref })).toStrictEqual([]);
      });
    });

    describe('dependent', () => {
      it('should mark the reference in `PersistentVolumeSpec.claimRef` as dependent', () => {
        const volume = {
          spec: {
            claimRef: {
              apiVersion: 'v1', kind: 'PersistentVolumeClaim', name: 'data', namespace: 'apps'
            }
          }
        };

        expect(referencesIn(`${ CORE }PersistentVolume`, volume)).toStrictEqual([{
          kind: 'PersistentVolumeClaim', group: '', name: 'data', namespace: 'apps', path: '.spec.claimRef', dependent: true
        }]);
      });

      it('should not mark a reference in any other field as dependent', () => {
        const volume = { spec: { storageClassName: 'fast', csi: { driver: 'driver.example.io', nodePublishSecretRef: { name: 'creds', namespace: 'apps' } } } };

        expect(referencesIn(`${ CORE }PersistentVolume`, volume).map((r) => Object.prototype.hasOwnProperty.call(r, 'dependent'))).toStrictEqual([false, false, false]);
      });
    });

    describe('resources', () => {
      // the result of a named reference, which has no `namespace` in its value
      const named = (kind: string, name: string, path: string) => ({
        kind, group: '', name, namespace: undefined, path
      });

      it('should find the env and envFrom sources, volumes, `imagePullSecrets` and `serviceAccountName` of the pod template of a Deployment', () => {
        const deployment = {
          spec: {
            template: {
              spec: {
                containers: [{
                  name: 'app',
                  env:  [
                    { name: 'USER', valueFrom: { secretKeyRef: { name: 'db-credentials', key: 'user' } } },
                    { name: 'MODE', valueFrom: { configMapKeyRef: { name: 'settings', key: 'mode' } } },
                  ],
                  envFrom: [{ configMapRef: { name: 'app-env' } }, { secretRef: { name: 'app-secrets' } }],
                }],
                volumes: [
                  { name: 'config', configMap: { name: 'nginx-config' } },
                  { name: 'uploads', persistentVolumeClaim: { claimName: 'uploads' } },
                  { name: 'certs', secret: { secretName: 'certs' } },
                  { name: 'bundle', projected: { sources: [{ configMap: { name: 'bundle-config' } }, { secret: { name: 'bundle-secret' } }] } },
                  { name: 'store', csi: { driver: 'secrets-store.csi.k8s.io', nodePublishSecretRef: { name: 'store-credentials' } } },
                ],
                imagePullSecrets:   [{ name: 'registry-pull' }],
                serviceAccountName: 'app',
              }
            }
          }
        };
        const pod = '.spec.template.spec';

        expect(referencesIn('io.k8s.api.apps.v1.Deployment', deployment)).toStrictEqual([
          named('Secret', 'db-credentials', `${ pod }.containers[0].env[0].valueFrom.secretKeyRef`),
          named('ConfigMap', 'settings', `${ pod }.containers[0].env[1].valueFrom.configMapKeyRef`),
          named('ConfigMap', 'app-env', `${ pod }.containers[0].envFrom[0].configMapRef`),
          named('Secret', 'app-secrets', `${ pod }.containers[0].envFrom[1].secretRef`),
          named('ConfigMap', 'nginx-config', `${ pod }.volumes[0].configMap`),
          named('PersistentVolumeClaim', 'uploads', `${ pod }.volumes[1].persistentVolumeClaim`),
          named('Secret', 'certs', `${ pod }.volumes[2].secret`),
          named('ConfigMap', 'bundle-config', `${ pod }.volumes[3].projected.sources[0].configMap`),
          named('Secret', 'bundle-secret', `${ pod }.volumes[3].projected.sources[1].secret`),
          named('Secret', 'store-credentials', `${ pod }.volumes[4].csi.nodePublishSecretRef`),
          named('Secret', 'registry-pull', `${ pod }.imagePullSecrets[0]`),
          {
            kind: 'ServiceAccount', group: '', name: 'app', path: `${ pod }.serviceAccountName`
          },
        ]);
      });

      it('should find the references in the job template of a CronJob', () => {
        const cronJob = { spec: { jobTemplate: { spec: { template: { spec: { containers: [{ name: 'report', envFrom: [{ configMapRef: { name: 'report-env' } }] }] } } } } } };

        expect(referencesIn('io.k8s.api.batch.v1.CronJob', cronJob)).toStrictEqual([
          named('ConfigMap', 'report-env', '.spec.jobTemplate.spec.template.spec.containers[0].envFrom[0].configMapRef'),
        ]);
      });

      it('should find `scaleTargetRef` and the `describedObject` of an Object metric of a HorizontalPodAutoscaler', () => {
        const autoscaler = {
          spec: {
            maxReplicas:    3,
            scaleTargetRef: {
              apiVersion: 'apps/v1', kind: 'StatefulSet', name: 'inventory-redis'
            },
            metrics: [{
              type:   'Object',
              object: {
                describedObject: {
                  apiVersion: 'networking.k8s.io/v1', kind: 'Ingress', name: 'storefront-api'
                },
                metric: { name: 'requests-per-second' }
              }
            }],
          }
        };

        expect(referencesIn('io.k8s.api.autoscaling.v2.HorizontalPodAutoscaler', autoscaler)).toStrictEqual([
          {
            kind: 'Ingress', group: 'networking.k8s.io', name: 'storefront-api', path: '.spec.metrics[0].object.describedObject'
          },
          {
            kind: 'StatefulSet', group: 'apps', name: 'inventory-redis', path: '.spec.scaleTargetRef'
          },
        ]);
      });

      // steve sends an unset `apiGroup` as null
      it('should find `dataSource` and `dataSourceRef` of a PersistentVolumeClaim', () => {
        const source = {
          apiGroup: null, kind: 'PersistentVolumeClaim', name: 'storefront-api-uploads'
        };
        const claim = {
          spec: {
            storageClassName: 'longhorn-sc', dataSource: source, dataSourceRef: source
          }
        };

        expect(referencesIn(`${ CORE }PersistentVolumeClaim`, claim)).toStrictEqual([
          {
            kind: 'StorageClass', group: 'storage.k8s.io', name: 'longhorn-sc', path: '.spec.storageClassName'
          },
          {
            kind: 'PersistentVolumeClaim', group: '', name: 'storefront-api-uploads', path: '.spec.dataSource'
          },
          {
            kind: 'PersistentVolumeClaim', group: '', name: 'storefront-api-uploads', namespace: undefined, path: '.spec.dataSourceRef'
          },
        ]);
      });

      it('should find the backend, TLS Secret and IngressClass of an Ingress', () => {
        const ingress = {
          spec: {
            ingressClassName: 'nginx',
            defaultBackend:   {
              resource: {
                apiGroup: 'k8s.example.com', kind: 'StorageBucket', name: 'static-assets'
              }
            },
            tls:   [{ hosts: ['shop.example.com'], secretName: 'shop-tls' }],
            rules: [{ host: 'shop.example.com', http: { paths: [{ path: '/', backend: { service: { name: 'storefront-api', port: { name: 'http' } } } }] } }],
          }
        };

        expect(referencesIn('io.k8s.api.networking.v1.Ingress', ingress)).toStrictEqual([
          {
            kind: 'IngressClass', group: 'networking.k8s.io', name: 'nginx', path: '.spec.ingressClassName'
          },
          {
            kind: 'StorageBucket', group: 'k8s.example.com', name: 'static-assets', path: '.spec.defaultBackend.resource'
          },
          {
            kind: 'Secret', group: '', name: 'shop-tls', path: '.spec.tls[0].secretName'
          },
          named('Service', 'storefront-api', '.spec.rules[0].http.paths[0].backend.service'),
        ]);
      });

      // the fields of these definitions are as a rancher server sends them
      // the api server sets `group` and `kind` where the route leaves them out
      it('should find `parentRefs`, `backendRefs` and the references in the filters of an HTTPRoute', () => {
        const spec = `${ GATEWAY_ROUTE }.spec`;
        const route = {
          spec: {
            parentRefs: [{
              group: 'gateway.networking.k8s.io', kind: 'Gateway', name: 'edge'
            }],
            rules: [{
              backendRefs: [{
                group: '', kind: 'Service', name: 'storefront-api', port: 80, weight: 1
              }],
              filters: [
                {
                  type:          'RequestMirror',
                  requestMirror: {
                    backendRef: {
                      group: '', kind: 'Service', name: 'inventory-redis', port: 6379
                    }
                  }
                },
                {
                  type:         'ExtensionRef',
                  extensionRef: {
                    group: '', kind: 'ConfigMap', name: 'storefront-api-config'
                  }
                },
              ],
            }],
          }
        };

        const references = referencesIn(GATEWAY_ROUTE, route, [
          resourceDefinition(GATEWAY_ROUTE, { spec: field(spec), status: field(`${ GATEWAY_ROUTE }.status`) }),
          definition(spec, { parentRefs: field('array', `${ spec }.parentRefs`), rules: field('array', `${ spec }.rules`) }),
          definition(`${ spec }.parentRefs`, {
            group: STRING, kind: STRING, name: STRING, namespace: STRING, port: field('int'), sectionName: STRING
          }),
          definition(`${ spec }.rules`, { backendRefs: field('array', `${ spec }.rules.backendRefs`), filters: field('array', `${ spec }.rules.filters`) }),
          definition(`${ spec }.rules.backendRefs`, {
            group: STRING, kind: STRING, name: STRING, namespace: STRING, port: field('int'), weight: field('int')
          }),
          definition(`${ spec }.rules.filters`, {
            extensionRef: field(`${ spec }.rules.filters.extensionRef`), requestMirror: field(`${ spec }.rules.filters.requestMirror`), type: STRING
          }),
          definition(`${ spec }.rules.filters.extensionRef`, {
            group: STRING, kind: STRING, name: STRING
          }),
          definition(`${ spec }.rules.filters.requestMirror`, { backendRef: field(`${ spec }.rules.filters.requestMirror.backendRef`) }),
          definition(`${ spec }.rules.filters.requestMirror.backendRef`, {
            group: STRING, kind: STRING, name: STRING, namespace: STRING, port: field('int')
          }),
        ]);

        expect(references).toStrictEqual([
          {
            kind: 'Gateway', group: 'gateway.networking.k8s.io', name: 'edge', namespace: undefined, path: '.spec.parentRefs[0]'
          },
          {
            kind: 'Service', group: '', name: 'storefront-api', namespace: undefined, path: '.spec.rules[0].backendRefs[0]'
          },
          {
            kind: 'Service', group: '', name: 'inventory-redis', namespace: undefined, path: '.spec.rules[0].filters[0].requestMirror.backendRef'
          },
          {
            kind: 'ConfigMap', group: '', name: 'storefront-api-config', namespace: undefined, path: '.spec.rules[0].filters[1].extensionRef'
          },
        ]);
      });

      it('should find `bootstrap.configRef` and `infrastructureRef` of the template of a cluster api MachineDeployment', () => {
        const root = 'io.x-k8s.cluster.v1beta2.MachineDeployment';
        const machineSpec = `${ root }.spec.template.spec`;
        const contractReference = {
          apiGroup: STRING, kind: STRING, name: STRING
        };
        const machineDeployment = {
          spec: {
            template: {
              spec: {
                clusterName: 'demo',
                bootstrap:   {
                  configRef: {
                    apiGroup: 'bootstrap.cluster.x-k8s.io', kind: 'KubeadmConfigTemplate', name: 'demo-workers'
                  }
                },
                infrastructureRef: {
                  apiGroup: 'infrastructure.cluster.x-k8s.io', kind: 'AWSMachineTemplate', name: 'demo-workers'
                },
              }
            }
          }
        };

        const references = referencesIn(root, machineDeployment, [
          resourceDefinition(root, { spec: field(`${ root }.spec`), status: field(`${ root }.status`) }),
          definition(`${ root }.spec`, { clusterName: STRING, template: field(`${ root }.spec.template`) }),
          definition(`${ root }.spec.template`, { spec: field(machineSpec) }),
          definition(machineSpec, {
            bootstrap: field(`${ machineSpec }.bootstrap`), clusterName: STRING, infrastructureRef: field(`${ machineSpec }.infrastructureRef`)
          }),
          definition(`${ machineSpec }.bootstrap`, { configRef: field(`${ machineSpec }.bootstrap.configRef`), dataSecretName: STRING }),
          definition(`${ machineSpec }.bootstrap.configRef`, contractReference),
          definition(`${ machineSpec }.infrastructureRef`, contractReference),
        ]);

        expect(references).toStrictEqual([
          {
            kind: 'KubeadmConfigTemplate', group: 'bootstrap.cluster.x-k8s.io', name: 'demo-workers', namespace: undefined, path: '.spec.template.spec.bootstrap.configRef'
          },
          {
            kind: 'AWSMachineTemplate', group: 'infrastructure.cluster.x-k8s.io', name: 'demo-workers', namespace: undefined, path: '.spec.template.spec.infrastructureRef'
          },
        ]);
      });

      it('should find `machineConfigRef` of a provisioning cluster with no group when it has no `apiVersion`', () => {
        const root = 'io.cattle.provisioning.v1.Cluster';
        const pools = `${ root }.spec.rkeConfig.machinePools`;
        const cluster = { spec: { rkeConfig: { machinePools: [{ name: 'pool1', machineConfigRef: { kind: 'Amazonec2Config', name: 'nc-demo-pool1' } }] } } };

        const references = referencesIn(root, cluster, [
          resourceDefinition(root, { spec: field(`${ root }.spec`), status: field(`${ root }.status`) }),
          definition(`${ root }.spec`, { rkeConfig: field(`${ root }.spec.rkeConfig`) }),
          definition(`${ root }.spec.rkeConfig`, { machinePools: field('array', pools) }),
          definition(pools, { machineConfigRef: field(`${ pools }.machineConfigRef`), name: STRING }),
          definition(`${ pools }.machineConfigRef`, {
            apiVersion: STRING, fieldPath: STRING, kind: STRING, name: STRING, namespace: STRING, resourceVersion: STRING, uid: STRING
          }),
        ]);

        expect(references).toStrictEqual([{
          kind: 'Amazonec2Config', group: undefined, name: 'nc-demo-pool1', namespace: undefined, path: '.spec.rkeConfig.machinePools[0].machineConfigRef'
        }]);
      });
    });
  });

  describe('schemaForReference', () => {
    const configMap = { id: 'configmap', attributes: { kind: 'ConfigMap', group: '' } };
    const coreNode = { id: 'node', attributes: { kind: 'Node' } };
    const managementNode = { id: 'management.cattle.io.node', attributes: { kind: 'Node', group: 'management.cattle.io' } };
    const deployment = { id: 'apps.deployment', attributes: { kind: 'Deployment', group: 'apps' } };
    const byKind = schemasByKind([configMap, coreNode, managementNode, deployment]);

    it('should return the schema of the kind in the group', () => {
      expect(schemaForReference(byKind, { kind: 'Node', group: 'management.cattle.io' })).toBe(managementNode);
    });

    it('should match an empty group to a schema with no `attributes.group`', () => {
      expect(schemaForReference(byKind, { kind: 'Node', group: '' })).toBe(coreNode);
    });

    it('should return null when no schema has the kind', () => {
      expect(schemaForReference(byKind, { kind: 'Secret', group: '' })).toBeNull();
    });

    it('should return null when no schema of the kind is in the group', () => {
      expect(schemaForReference(byKind, { kind: 'Deployment', group: 'extensions' })).toBeNull();
    });

    it('should return the only schema of the kind when the group is undefined', () => {
      expect(schemaForReference(byKind, { kind: 'Deployment', group: undefined })).toBe(deployment);
    });

    it('should return null when the group is undefined and more than one schema has the kind', () => {
      expect(schemaForReference(byKind, { kind: 'Node', group: undefined })).toBeNull();
    });
  });

  describe('schemasByKind', () => {
    it('should list the schemas of each `attributes.kind` in the order given', () => {
      const coreNode = { id: 'node', attributes: { kind: 'Node' } };
      const managementNode = { id: 'management.cattle.io.node', attributes: { kind: 'Node', group: 'management.cattle.io' } };
      const configMap = { id: 'configmap', attributes: { kind: 'ConfigMap' } };

      expect([...schemasByKind([coreNode, configMap, managementNode]).entries()]).toStrictEqual([
        ['Node', [coreNode, managementNode]],
        ['ConfigMap', [configMap]],
      ]);
    });

    it('should skip a schema with no `attributes.kind`', () => {
      const configMap = { id: 'configmap', attributes: { kind: 'ConfigMap' } };

      expect([...schemasByKind([{ id: 'count', attributes: {} }, { id: 'schema' }, configMap]).keys()]).toStrictEqual(['ConfigMap']);
    });

    it.each([
      ['an empty list', []],
      ['no list', undefined],
    ])('should return an empty map for %s', (_label, schemas) => {
      expect(schemasByKind(schemas as any).size).toBe(0);
    });
  });
});
