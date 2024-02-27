import {
  getBlockDescriptor,
  dumpBlock,
  createYaml
} from '@shell/utils/create-yaml';
import jsyaml from 'js-yaml';

const key = 'example';
const randomData = '\n      foo\n      bar\n';

const scalarStyles = ['>', '|'];
const chomping = ['+', '-', ''];
const indentations = ['4', '2', ''];

describe('fx: getBlockDescriptor', () => {
  describe('should parse blocks header for all block indicators combo', () => {
    scalarStyles.forEach((scalar) => {
      chomping.forEach((chomping) => {
        indentations.forEach((indentation) => {
          const combo = `${ scalar }${ indentation }${ chomping }`;

          it(`combo: ${ combo }`, () => {
            const toParse = `${ key }: ${ combo }${ randomData }`;

            const desc = getBlockDescriptor(toParse, key);

            expect(desc?.header).toBe(`${ key }: ${ combo }`);
            expect(desc?.indentation).toBe(indentation);
          });
        });
      });
    });
  });
});

describe('fx: dumpBlock', () => {
  describe('should create a data block replacing indicators with blocks indicator from options', () => {
    const key = 'example';

    scalarStyles.forEach((scalarStyle) => {
      chomping.forEach((chomping) => {
        const options = {
          [key]: {
            chomping,
            scalarStyle
          }
        };

        it(`options: { scalarStyle: ${ scalarStyle }, chomping: ${ chomping } } with indentation`, () => {
          const data = { [key]: ' foo  \n bar   \n   \n   foo\n   bar\n   ' };
          const block = dumpBlock(data, options);

          expect(block.includes(`example: ${ scalarStyle }${ chomping }2`)).toBeTruthy();
        });

        it(`options: { scalarStyle: ${ scalarStyle }, chomping: ${ chomping } } without indentation`, () => {
          const data = { [key]: 'foo  \nbar   \n\nfoo\nbar\n   ' };
          const block = dumpBlock(data, options);

          expect(block.includes(`example: ${ scalarStyle }${ chomping }`)).toBeTruthy();
        });
      });
    });
  });

  it('should not create a data block when the value of a key is not a string', () => {
    const data = { key: { test: 'test' } };

    const expectedResult = jsyaml.dump(data);
    const result = dumpBlock(data);

    expect(result).toStrictEqual(expectedResult);
  });

  it('should retain line breaks when a line longer than 80 characters exists', () => {
    const data = {
      'managerApiConfiguration.properties': `# Sample XPlanManagerAPI Configuration (if this comment is longer than 80 characters, the output should remain the same)

apiUrl=https://example.com/xplan-api-manager
contactEmailAddress=contact@example.com
termsOfServiceUrl=https://example.com/terms
documentationUrl=https://example.com/docs
wmsUrl=https://example.com/xplan-wms/services
skipSemantic=false
skipGeometric=true`
    };

    const expectedResult = `managerApiConfiguration.properties: >+
  # Sample XPlanManagerAPI Configuration (if this comment is longer than 80 characters, the output should remain the same)

  apiUrl=https://example.com/xplan-api-manager
  contactEmailAddress=contact@example.com
  termsOfServiceUrl=https://example.com/terms
  documentationUrl=https://example.com/docs
  wmsUrl=https://example.com/xplan-wms/services
  skipSemantic=false
  skipGeometric=true
`;

    const yamlModifiers = {
      lineWidth:                            -1,
      'managerApiConfiguration.properties': {
        chomping:    '+',
        scalarStyle: '>',
      }
    };

    const result = dumpBlock(data, yamlModifiers);

    expect(result).toStrictEqual(expectedResult);
  });

  it('should not attempt to replace indicators when a header cannot be found', () => {
    const data = {
      a: 'a\nb\tc',
      b: 'a\nb\tc',
      c: `a
b c`
    };

    const expectedResult = `a: "a\\nb\\tc"\nb: "a\\nb\\tc"\nc: |+\n  a\n  b c\n`;

    const yamlModifiers = {
      lineWidth: -1,
      a:         { chomping: '+' },
      b:         { chomping: '+' },
      c:         { chomping: '+' },
    };

    const result = dumpBlock(data, yamlModifiers);

    expect(result).toStrictEqual(expectedResult);
  });
});

describe('fx: createYaml', () => {
  interface CommentFieldsOption {
    path: string;
    key: string;
  }

  const schemas = [
    {
      id:             'provisioning.cattle.io.cluster',
      resourceFields: {
        apiVersion: {
          type:   'string',
          create: false,
          update: false
        },
        kind: {
          type:   'string',
          create: false,
          update: false
        },
        metadata: {
          type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
          create: true,
          update: true
        },
        spec: {
          type:     'provisioning.cattle.io.v1.cluster.spec',
          nullable: true,
          create:   true,
          update:   true
        }
      }
    },
    {
      id:             'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
      resourceFields: {
        annotations: {
          type:   'map[string]',
          create: true,
          update: true
        },
        labels: {
          type:   'map[string]',
          create: true,
          update: true
        },
        namespace: {
          type:   'string',
          create: true,
          update: true
        }
      }
    },
    {
      id:             'provisioning.cattle.io.v1.cluster.spec',
      resourceFields: {
        localClusterAuthEndpoint: {
          type:     'provisioning.cattle.io.v1.cluster.spec.localClusterAuthEndpoint',
          nullable: true,
          create:   true,
          update:   true
        },
        rkeConfig: {
          type:     'provisioning.cattle.io.v1.cluster.spec.rkeConfig',
          nullable: true,
          create:   true,
          update:   true
        }
      }
    },
    {
      id:             'provisioning.cattle.io.v1.cluster.spec.localClusterAuthEndpoint',
      resourceFields: {
        caCerts: {
          type:     'string',
          nullable: true,
          create:   true,
          update:   true
        },
        enabled: {
          type:     'boolean',
          nullable: true,
          create:   true,
          update:   true
        },
        fqdn: {
          type:     'string',
          nullable: true,
          create:   true,
          update:   true
        }
      }
    },
    {
      id:             'provisioning.cattle.io.v1.cluster.spec.rkeConfig',
      resourceFields: {
        additionalManifest: {
          type:     'string',
          nullable: true,
          create:   true,
          update:   true
        },
        chartValues: {
          type:     'provisioning.cattle.io.v1.cluster.spec.rkeConfig.chartValues',
          nullable: true,
          create:   true,
          update:   true
        },
        machineGlobalConfig: {
          type:     'provisioning.cattle.io.v1.cluster.spec.rkeConfig.machineGlobalConfig',
          nullable: true,
          create:   true,
          update:   true
        }
      }
    },
    {
      id:             'provisioning.cattle.io.v1.cluster.spec.rkeConfig.chartValues',
      resourceFields: {}
    },
    {
      id:             'provisioning.cattle.io.v1.cluster.spec.rkeConfig.machineGlobalConfig',
      resourceFields: {}
    }
  ];

  it('should comment out fields when specific properties are defined on the model with commentFieldsOptions', () => {
    const data = {
      type:     'provisioning.cattle.io.cluster',
      metadata: {
        namespace:   'fleet-default',
        annotations: { someannotation: 'test' },
        labels:      {}
      },
      __clone: true,
      spec:    {
        localClusterAuthEndpoint: {
          caCerts: '',
          enabled: false,
          fqdn:    ''
        },
        rkeConfig: {
          machineGlobalConfig: {
            cni:                   'calico',
            'disable-kube-proxy':  false,
            'etcd-expose-metrics': false,
            profile:               null
          },
          chartValues: {}
        },
      },
      apiVersion: 'provisioning.cattle.io/v1',
      kind:       'Cluster'
    };

    const type = 'provisioning.cattle.io.cluster';
    const commentFieldsOptions: CommentFieldsOption[] = [
      { path: 'spec.rkeConfig.machineGlobalConfig', key: 'profile' },
      { path: 'spec', key: 'localClusterAuthEndpoint' }
    ];

    // Define the expected YAML output as a string, adjusted for correct spacing
    const expectedYaml = `
apiVersion: provisioning.cattle.io/v1
kind: Cluster
metadata:
  annotations:
    someannotation: test
    #  key: string
  labels:
    {}
    #  key: string
  namespace: fleet-default
spec:
#  localClusterAuthEndpoint:
    caCerts: ''
    enabled: false
    fqdn: ''
  rkeConfig:
    chartValues:
      {}
    machineGlobalConfig:
      cni: calico
      disable-kube-proxy: false
      etcd-expose-metrics: false
#       profile: null
#    additionalManifest: string
__clone: true`.trim();

    const result = createYaml(schemas, type, data, true, 0, '', null, {}, commentFieldsOptions as any);

    expect(result.trim()).toStrictEqual(expectedYaml);
  });
});
