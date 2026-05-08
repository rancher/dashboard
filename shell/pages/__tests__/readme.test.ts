import Readme from '@shell/pages/readme.vue';

describe('page: Readme', () => {
  describe('computed', () => {
    it('showAppReadme defaults to false', () => {
      const thisContext = { $route: { query: {} } };

      const result = (Readme.computed!.showAppReadme as () => boolean).call(thisContext);

      expect(result).toBe(false);
    });

    it('hideReadmeFirstTitle defaults to false', () => {
      const thisContext = { $route: { query: {} } };

      const result = (Readme.computed!.hideReadmeFirstTitle as () => boolean).call(thisContext);

      expect(result).toBe(false);
    });

    it('parses showAppReadme and hideReadmeFirstTitle from query', () => {
      const thisContext = {
        $route: {
          query: {
            showAppReadme:        'true',
            hideReadmeFirstTitle: 'true',
          }
        }
      };

      const showAppReadme = (Readme.computed!.showAppReadme as () => boolean).call(thisContext);
      const hideReadmeFirstTitle = (Readme.computed!.hideReadmeFirstTitle as () => boolean).call(thisContext);

      expect(showAppReadme).toBe(true);
      expect(hideReadmeFirstTitle).toBe(true);
    });
  });

  describe('fetch', () => {
    it('calls fetchChart', async() => {
      const fetchChart = jest.fn();
      const thisContext = { fetchChart };

      await (Readme.fetch as () => Promise<void>).call(thisContext);

      expect(fetchChart).toHaveBeenCalledWith();
    });
  });
});
