import { getStandaloneReadmeUrl, CHART_README_STORAGE_KEY } from '@shell/utils/chart';

describe('getStandaloneReadmeUrl', () => {
  it('should generate a correct standalone README URL', () => {
    const mockRouter = {
      resolve:      jest.fn((route) => ({ href: `/test-url?storageKey=${ route.query.storageKey }&showAppReadme=${ route.query.showAppReadme }&hideReadmeFirstTitle=${ route.query.hideReadmeFirstTitle }&theme=${ route.query.theme }` })),
      currentRoute: { value: { params: { cluster: 'test-cluster' } } },
    };

    const options = {
      storageKey:           CHART_README_STORAGE_KEY,
      showAppReadme:        true,
      hideReadmeFirstTitle: true,
      theme:                'dark',
    };

    const url = getStandaloneReadmeUrl(mockRouter as any, options);

    // Check that router.resolve was called correctly
    expect(mockRouter.resolve).toHaveBeenCalledWith({
      name:   'chart-readme-standalone',
      params: { cluster: 'test-cluster' },
      query:  {
        storageKey:           CHART_README_STORAGE_KEY,
        showAppReadme:        'true',
        hideReadmeFirstTitle: 'true',
        theme:                'dark',
      },
    });

    // Check if the returned URL is what we expect from the mocked resolve
    expect(url).toBe(`/test-url?storageKey=${ CHART_README_STORAGE_KEY }&showAppReadme=true&hideReadmeFirstTitle=true&theme=dark`);
  });
});
