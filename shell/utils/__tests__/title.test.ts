import { updatePageTitle } from '@shell/utils/title';

describe('updatePageTitle', () => {
  afterEach(() => {
    document.title = '';
  });

  it('sets document.title to a single breadcrumb', () => {
    updatePageTitle('Home');
    expect(document.title).toStrictEqual('Home');
  });

  it('joins multiple breadcrumbs with " - "', () => {
    updatePageTitle('Rancher', 'Clusters', 'my-cluster');
    expect(document.title).toStrictEqual('Rancher - Clusters - my-cluster');
  });

  it('filters out null values', () => {
    updatePageTitle('Rancher', null, 'Clusters');
    expect(document.title).toStrictEqual('Rancher - Clusters');
  });

  it('filters out undefined values', () => {
    updatePageTitle('Rancher', undefined, 'Clusters');
    expect(document.title).toStrictEqual('Rancher - Clusters');
  });

  it('filters out false values', () => {
    updatePageTitle('Rancher', false, 'Clusters');
    expect(document.title).toStrictEqual('Rancher - Clusters');
  });

  it('filters out empty string values', () => {
    updatePageTitle('Rancher', '', 'Clusters');
    expect(document.title).toStrictEqual('Rancher - Clusters');
  });

  it('sets document.title to empty string when all breadcrumbs are falsy', () => {
    updatePageTitle(null, undefined, false);
    expect(document.title).toStrictEqual('');
  });

  it('sets document.title to empty string when called with no arguments', () => {
    updatePageTitle();
    expect(document.title).toStrictEqual('');
  });
});
