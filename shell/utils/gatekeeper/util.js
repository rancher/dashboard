import { GATEKEEPER, SCHEMA } from '@shell/config/types';

export async function findAllConstraints(store) {
  const constraintTypes = await findAllConstraintTypes(store);
  const nestedConstraints = constraintTypes.map(ct => store.dispatch('cluster/findAll', { type: ct, opt: { force: true } }));

  return (await Promise.all(nestedConstraints)).flat();
}

export function findAllConstraintTypes(store) {
  const schemas = store.getters['cluster/all'](SCHEMA);

  return findConstraintTypes(schemas);
}

export function findAllTemplates(store) {
  return store.dispatch('cluster/findAll', { type: GATEKEEPER.CONSTRAINT_TEMPLATE });
}

export function findTemplateType(schemas) {
  // @TODO this will just be a regular single type now that the server filters to preferred version
  // so you can just add templates.gatekeeper.sh.constrainttemplate as a constant in types.js
  const template = schemas.find((schema) => {
    return schema?.attributes?.group === 'templates.gatekeeper.sh' &&
        schema?.attributes?.kind === 'ConstraintTemplate';
  });

  return template?.id;
}

function findConstraintTypes(schemas) {
  return schemas
    .filter(schema => schema?.attributes?.group === 'constraints.gatekeeper.sh')
    .map(schema => schema.id);
}
