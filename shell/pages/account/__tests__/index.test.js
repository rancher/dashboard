import Account from '@shell/pages/account/index.vue' ;

describe('page: account', () => {
  it('should return the correct base path', () => {
    const href = 'https://test.com/dashboard/';
    const localThis1 = { $router: { options: { base: '/' } } };

    jest.spyOn(document, 'querySelector').mockImplementation(() => ({ href }));

    expect(Account.computed.basePath.call(localThis1)).toBe(href);
    const localThis2 = { $router: { options: { base: '/dashboard/' } } };

    expect(Account.computed.basePath.call(localThis2)).toBe('https://test.com/');

    jest.spyOn(document, 'querySelector').mockImplementation(() => ({ href: undefined }));
    const localThis3 = { $router: { options: { base: '/' } } };

    expect(Account.computed.basePath.call(localThis3)).toBe('http://localhost/');
  });
});
