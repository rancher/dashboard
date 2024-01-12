import { parseType } from '@shell/models/schema';

describe('class: schema:', () => {
  describe('parseType', () => {
    it.each([
      ['array', undefined, ['array']],
      ['map', undefined, ['map']],
      ['io.cattle.provisioning.v1.Cluster.status', undefined, ['io.cattle.provisioning.v1.Cluster.status']],

      ['array[string]', undefined, ['array', 'string']],
      ['array', { subtype: 'string' }, ['array', 'string']],
      ['map[string]', undefined, ['map', 'string']],
      ['map', { subtype: 'string' }, ['map', 'string']],

      ['array[io.cattle.provisioning.v1.Cluster.status]', undefined, ['array', 'io.cattle.provisioning.v1.Cluster.status']],
      ['array', { subtype: 'io.cattle.provisioning.v1.Cluster.status' }, ['array', 'io.cattle.provisioning.v1.Cluster.status']],
      ['map[io.cattle.provisioning.v1.Cluster.status]', undefined, ['map', 'io.cattle.provisioning.v1.Cluster.status']],
      ['map', { subtype: 'io.cattle.provisioning.v1.Cluster.status' }, ['map', 'io.cattle.provisioning.v1.Cluster.status']],

    ])('string: %p and field: %p ... should equal %p', (val, field, expected) => {
      expect(parseType(val, field)).toStrictEqual(expected);
    });
  });
});
