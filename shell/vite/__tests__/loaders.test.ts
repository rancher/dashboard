import { rancherLoaders } from '@shell/vite/loaders.mjs';

const transform = (code: string, id: string) => (rancherLoaders() as any).transform(code, id).code;

describe('fx: rancherLoaders', () => {
  it.each([
    ['front matter', '---\ntitle: A\n---\n# Body\n', '# Body\n'],
    ['front matter after a byte order mark', '\uFEFF---\ntitle: A\n---\n# Body\n', '# Body\n'],
    ['front matter that ends the file', '---\ntitle: A\n---', ''],
    ['no front matter', '# Body\n', '# Body\n'],
  ])('should export the body of markdown with %s', (_, code, body) => {
    expect(transform(code, '/app/pkg/a/content/a.md')).toStrictEqual(`export const body = ${ JSON.stringify(body) };\nexport default { body };`);
  });

  it('should export csv rows with typed values', () => {
    expect(transform('a,b\n1,x\n\n', '/app/a.csv')).toStrictEqual('export default [{"a":1,"b":"x"}];');
  });

  it('should export the parsed contents of yaml', () => {
    expect(transform('a:\n  b: 1\n', '/app/shell/assets/translations/en-us.yaml')).toStrictEqual('export default {"a":{"b":1}};');
  });
});
