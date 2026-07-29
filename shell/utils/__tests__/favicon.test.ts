describe('shell/utils/favicon', () => {
  let haveSetFavIcon: () => boolean;
  let setFavIcon: (store: unknown) => void;
  let mockRequireAsset: jest.Mock;

  const makeStore = (faviconValue?: string, brand = '') => ({
    getters: {
      'management/byId':  jest.fn().mockReturnValue(faviconValue !== null && faviconValue !== undefined ? { value: faviconValue } : undefined),
      'management/brand': brand,
    },
  });

  const addIconLink = () => {
    const link = document.createElement('link');

    link.rel = 'icon';
    document.head.appendChild(link);

    return link;
  };

  beforeEach(() => {
    document.head.innerHTML = '';
    jest.resetModules();
    mockRequireAsset = jest.fn((path: string) => `asset:${ path }`);
    jest.mock('@shell/utils/require-asset', () => ({ requireAsset: mockRequireAsset }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const mod = require('@shell/utils/favicon');

    haveSetFavIcon = mod.haveSetFavIcon;
    setFavIcon = mod.setFavIcon;
  });

  afterEach(() => {
    document.head.innerHTML = '';
  });

  describe('fx: haveSetFavIcon', () => {
    it('returns false initially before any setFavIcon call', () => {
      expect(haveSetFavIcon()).toStrictEqual(false);
    });

    it('returns true after setFavIcon is called when an icon link is present', () => {
      addIconLink();
      setFavIcon(makeStore());
      expect(haveSetFavIcon()).toStrictEqual(true);
    });

    it('stays false when setFavIcon is called with no icon link in document.head', () => {
      setFavIcon(makeStore());
      expect(haveSetFavIcon()).toStrictEqual(false);
    });
  });

  describe('fx: setFavIcon', () => {
    describe('when no icon link is in document.head', () => {
      it('does not modify existing non-icon link href', () => {
        const link = document.createElement('link');

        link.rel = 'stylesheet';
        link.setAttribute('href', 'style.css');
        document.head.appendChild(link);
        setFavIcon(makeStore('custom.ico'));
        expect(link.getAttribute('href')).toStrictEqual('style.css');
      });

      it('does not call requireAsset', () => {
        setFavIcon(makeStore(undefined, 'suse'));
        expect(mockRequireAsset).not.toHaveBeenCalled();
      });
    });

    describe('when an icon link is present', () => {
      it('sets icon link href to res.value when res.value is provided', () => {
        const link = addIconLink();

        setFavIcon(makeStore('https://example.com/favicon.ico'));
        expect(link.getAttribute('href')).toStrictEqual('https://example.com/favicon.ico');
      });

      it.each([
        {
          desc:         'suse brand',
          brand:        'suse',
          expectedPath: '~shell/assets/brand/suse/favicon.png',
        },
        {
          desc:         'csp brand',
          brand:        'csp',
          expectedPath: '~shell/assets/brand/csp/favicon.png',
        },
        {
          desc:         'harvester brand',
          brand:        'harvester',
          expectedPath: '~shell/assets/brand/harvester/favicon.png',
        },
      ])('uses brand asset for $desc when there is no res.value', ({ brand, expectedPath }) => {
        const link = addIconLink();

        setFavIcon(makeStore(undefined, brand));
        expect(link.getAttribute('href')).toStrictEqual(`asset:${ expectedPath }`);
        expect(mockRequireAsset).toHaveBeenCalledWith(expectedPath);
      });

      it('does not call requireAsset for unrecognised brand values', () => {
        addIconLink();
        setFavIcon(makeStore(undefined, 'rancher'));
        expect(mockRequireAsset).not.toHaveBeenCalled();
      });

      it('falls back to the default favicon when there is no res.value and no matching brand', () => {
        const link = addIconLink();

        setFavIcon(makeStore(undefined, 'rancher'));
        expect(link.getAttribute('href')).toStrictEqual('');
      });

      it('uses res.value and not the brand asset when both are available', () => {
        const link = addIconLink();

        setFavIcon(makeStore('custom.ico', 'suse'));
        expect(link.getAttribute('href')).toStrictEqual('custom.ico');
      });

      it('modifies only the first icon link when multiple icon links are present', () => {
        const first = addIconLink();
        const second = addIconLink();

        setFavIcon(makeStore('fav.ico'));
        expect(first.getAttribute('href')).toStrictEqual('fav.ico');
        expect(second.getAttribute('href')).not.toStrictEqual('fav.ico');
      });

      it('skips non-icon links and sets the icon link href', () => {
        const nonIcon = document.createElement('link');

        nonIcon.rel = 'stylesheet';
        document.head.appendChild(nonIcon);
        const icon = addIconLink();

        setFavIcon(makeStore('my-icon.ico'));
        expect(icon.getAttribute('href')).toStrictEqual('my-icon.ico');
      });

      it('finds a link whose rel contains the icon substring (e.g. shortcut icon)', () => {
        const link = document.createElement('link');

        link.rel = 'shortcut icon';
        document.head.appendChild(link);
        setFavIcon(makeStore('shortcut.ico'));
        expect(link.getAttribute('href')).toStrictEqual('shortcut.ico');
      });
    });
  });
});
