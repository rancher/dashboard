import { getYaml } from '@shell/components/Drawer/ResourceDetailDrawer/helpers';

describe('helpers: ResourceDetailDrawer', () => {
  describe('getYaml', () => {
    const resource = {
      hasLink:          jest.fn(),
      followLink:       jest.fn(),
      cleanForDownload: jest.fn()
    };

    const yaml = 'YAML';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should skip following a link if it does not have a view link', async() => {
      resource.hasLink.mockImplementation(() => false);
      resource.cleanForDownload.mockImplementation(() => yaml);

      const response = await getYaml(resource);

      expect(resource.hasLink).toHaveBeenCalledWith('view');
      expect(resource.followLink).toHaveBeenCalledTimes(0);
      expect(resource.cleanForDownload).toHaveBeenCalledWith(undefined);
      expect(response).toStrictEqual(yaml);
    });

    it('should follow link if it has a view link', async() => {
      resource.hasLink.mockImplementation(() => true);
      resource.followLink.mockImplementation(() => Promise.resolve({ data: yaml }));
      resource.cleanForDownload.mockImplementation(() => yaml);

      const response = await getYaml(resource);

      expect(resource.hasLink).toHaveBeenCalledWith('view');
      expect(resource.followLink).toHaveBeenCalledWith('view', { headers: { accept: 'application/yaml' } });
      expect(resource.cleanForDownload).toHaveBeenCalledWith(yaml);
      expect(response).toStrictEqual(yaml);
    });
  });
});
