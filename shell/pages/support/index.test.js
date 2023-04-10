import Support from '@shell/pages/support/index.vue';

describe('page: support/index.vue', () => {
  it('should GC support link with param', () => {
    const localThis = { hasAWSSupport: true };

    expect(Support.computed.sccLink.call(localThis)).toBe('https://support-cn.rancher.cn?from_marketplace=1');
  });

  it('should GC support link without param', () => {
    const localThis = { hasAWSSupport: false };

    expect(Support.computed.sccLink.call(localThis)).toBe('https://support-cn.rancher.cn');
  });
});
