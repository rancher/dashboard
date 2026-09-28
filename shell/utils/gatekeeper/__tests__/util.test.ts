import { findTemplateType, findAllConstraintTypes, findAllTemplates, findAllConstraints } from '../util';
import { GATEKEEPER, SCHEMA } from '@shell/config/types';

describe('gatekeeper/util.js', () => {
  describe('findTemplateType', () => {
    it('returns the schema id when a matching schema exists', () => {
      const schemas = [
        {
          id:         'templates.gatekeeper.sh.constrainttemplate',
          attributes: { group: 'templates.gatekeeper.sh', kind: 'ConstraintTemplate' },
        },
      ];

      expect(findTemplateType(schemas)).toStrictEqual('templates.gatekeeper.sh.constrainttemplate');
    });

    it('returns undefined when no schemas match', () => {
      const schemas = [
        {
          id:         'other.group.somekind',
          attributes: { group: 'other.group', kind: 'SomeKind' },
        },
      ];

      expect(findTemplateType(schemas)).toBeUndefined();
    });

    it('returns undefined for an empty schemas array', () => {
      expect(findTemplateType([])).toBeUndefined();
    });

    it('matches only on the correct group and kind together', () => {
      const schemas = [
        {
          id:         'templates.gatekeeper.sh.other',
          attributes: { group: 'templates.gatekeeper.sh', kind: 'Other' },
        },
        {
          id:         'other.group.constrainttemplate',
          attributes: { group: 'other.group', kind: 'ConstraintTemplate' },
        },
      ];

      expect(findTemplateType(schemas)).toBeUndefined();
    });

    it('returns undefined when schema has no attributes', () => {
      const schemas = [{ id: 'some.id' }];

      expect(findTemplateType(schemas)).toBeUndefined();
    });

    it('returns the first matching schema id when multiple matches exist', () => {
      const schemas = [
        {
          id:         'first-match',
          attributes: { group: 'templates.gatekeeper.sh', kind: 'ConstraintTemplate' },
        },
        {
          id:         'second-match',
          attributes: { group: 'templates.gatekeeper.sh', kind: 'ConstraintTemplate' },
        },
      ];

      expect(findTemplateType(schemas)).toStrictEqual('first-match');
    });

    it('handles schemas with null attributes gracefully', () => {
      const schemas = [
        { id: 'null-attrs', attributes: null },
        {
          id:         'templates.gatekeeper.sh.constrainttemplate',
          attributes: { group: 'templates.gatekeeper.sh', kind: 'ConstraintTemplate' },
        },
      ];

      expect(findTemplateType(schemas)).toStrictEqual('templates.gatekeeper.sh.constrainttemplate');
    });
  });

  describe('findAllConstraintTypes', () => {
    it('returns constraint type schema ids filtered by constraints.gatekeeper.sh group', () => {
      const schemas = [
        { id: 'constraints.gatekeeper.sh.k8srequiredlabels', attributes: { group: 'constraints.gatekeeper.sh' } },
        { id: 'constraints.gatekeeper.sh.k8sallowedrepos', attributes: { group: 'constraints.gatekeeper.sh' } },
        { id: 'other.group.something', attributes: { group: 'other.group' } },
      ];
      const store = { getters: { [`cluster/all`]: () => schemas } };

      const result = findAllConstraintTypes(store);

      expect(result).toStrictEqual([
        'constraints.gatekeeper.sh.k8srequiredlabels',
        'constraints.gatekeeper.sh.k8sallowedrepos',
      ]);
    });

    it('returns an empty array when no constraint schemas exist', () => {
      const store = { getters: { [`cluster/all`]: () => [] } };

      expect(findAllConstraintTypes(store)).toStrictEqual([]);
    });

    it('calls store.getters["cluster/all"] with SCHEMA constant', () => {
      const mockAll = jest.fn().mockReturnValue([]);
      const store = { getters: { [`cluster/all`]: mockAll } };

      findAllConstraintTypes(store);

      expect(mockAll).toHaveBeenCalledWith(SCHEMA);
    });

    it('filters out schemas with missing or non-matching group', () => {
      const schemas = [
        { id: 'no-attrs' },
        { id: 'null-group', attributes: { group: null } },
        { id: 'constraints.gatekeeper.sh.valid', attributes: { group: 'constraints.gatekeeper.sh' } },
      ];
      const store = { getters: { [`cluster/all`]: () => schemas } };

      const result = findAllConstraintTypes(store);

      expect(result).toStrictEqual(['constraints.gatekeeper.sh.valid']);
    });
  });

  describe('findAllTemplates', () => {
    it('dispatches cluster/findAll with the constraint template type', async() => {
      const expectedResult = [{ id: GATEKEEPER.CONSTRAINT_TEMPLATE }];
      const mockDispatch = jest.fn().mockResolvedValue(expectedResult);
      const store = { dispatch: mockDispatch };

      const result = await findAllTemplates(store);

      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', { type: GATEKEEPER.CONSTRAINT_TEMPLATE });
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('findAllConstraints', () => {
    it('returns all constraint resources flattened across all constraint types', async() => {
      const schemas = [
        { id: 'constraints.gatekeeper.sh.type1', attributes: { group: 'constraints.gatekeeper.sh' } },
        { id: 'constraints.gatekeeper.sh.type2', attributes: { group: 'constraints.gatekeeper.sh' } },
      ];
      const type1Resources = [{ id: 'r1' }, { id: 'r2' }];
      const type2Resources = [{ id: 'r3' }];
      const mockDispatch = jest.fn()
        .mockResolvedValueOnce(type1Resources)
        .mockResolvedValueOnce(type2Resources);
      const store = {
        getters:  { [`cluster/all`]: () => schemas },
        dispatch: mockDispatch,
      };

      const result = await findAllConstraints(store);

      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', { type: 'constraints.gatekeeper.sh.type1', opt: { force: true } });
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', { type: 'constraints.gatekeeper.sh.type2', opt: { force: true } });
      expect(result).toStrictEqual([{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }]);
    });

    it('returns an empty array when there are no constraint types', async() => {
      const store = {
        getters:  { [`cluster/all`]: () => [] },
        dispatch: jest.fn(),
      };

      const result = await findAllConstraints(store);

      expect(result).toStrictEqual([]);
    });
  });
});
