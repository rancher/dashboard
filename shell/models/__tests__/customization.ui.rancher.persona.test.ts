import Persona from '@shell/models/customization.ui.rancher.persona';

describe('class Persona', () => {
  describe('applyDefaults', () => {
    it('should set the spec defaults when there is no spec', () => {
      const persona = new Persona({ metadata: { name: 'test' } });

      persona.applyDefaults();

      expect(persona.spec).toStrictEqual({
        displayName: '', priority: 0, tags: []
      });
    });

    it('should give each persona its own tags list', () => {
      const first = new Persona({ metadata: { name: 'first' } });
      const second = new Persona({ metadata: { name: 'second' } });

      first.applyDefaults();
      first.spec.tags?.push('development');
      second.applyDefaults();

      expect(second.spec.tags).toStrictEqual([]);
    });

    it.each([
      [
        'all fields set',
        {
          displayName: 'App Developer',
          priority:    10,
          tags:        ['development'],
          rules:       [{
            apiGroups: ['apps'], resources: ['deployments'], verbs: ['create']
          }]
        },
        {
          displayName: 'App Developer',
          priority:    10,
          tags:        ['development'],
          rules:       [{
            apiGroups: ['apps'], resources: ['deployments'], verbs: ['create']
          }]
        }
      ],
      ['a priority of 0', { priority: 0 }, {
        displayName: '', priority: 0, tags: []
      }],
      ['a negative priority', { priority: -5 }, {
        displayName: '', priority: -5, tags: []
      }],
      ['only a display name', { displayName: 'Ops' }, {
        displayName: 'Ops', priority: 0, tags: []
      }],
    ])('should keep existing spec values with %s', (_, spec, expected) => {
      const persona = new Persona({ metadata: { name: 'test' }, spec });

      persona.applyDefaults();

      expect(persona.spec).toStrictEqual(expected);
    });
  });
});
