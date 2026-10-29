/**
 * Oxc options that compile TypeScript class fields as the shell's tsconfig does (`useDefineForClassFields: false`): a
 * field that is only declared is left out, and an initialized one is assigned rather than defined
 */
export const shellClassFields = { typescript: { removeClassFieldsWithoutInitializer: true }, assumptions: { setPublicClassFields: true } };
