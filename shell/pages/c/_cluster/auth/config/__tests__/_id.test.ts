import AuthConfigDetail from '@shell/pages/c/_cluster/auth/config/_id.vue';

describe('page: AuthConfigDetail', () => {
  // The page used to refuse to leave for the auth product's root, which was there
  // to break a redirect loop with a list page that no longer redirects. All it
  // does now is strand the user on the provider when they go back.
  it('should let the user navigate away to the provider list', () => {
    expect((AuthConfigDetail as any).beforeRouteLeave).toBeUndefined();
  });
});
