import { open, Popup, popupWindowOptions } from '@shell/utils/window';

function mockScreen(width: number, height: number) {
  Object.defineProperty(window, 'screen', {
    configurable: true,
    writable:     true,
    value:        { width, height },
  });
}

describe('window utils', () => {
  describe('popupWindowOptions', () => {
    afterEach(() => {
      mockScreen(0, 0);
    });

    it.each([
      {
        desc:         'uses default 1040×768 and centers on a large screen when no size is given',
        screenWidth:  2560,
        screenHeight: 1440,
        width:        undefined as number | undefined,
        height:       undefined as number | undefined,
        expected:     'width=1040,height=768,resizable=1,scrollbars=1,left=760,top=336',
      },
      {
        desc:         'uses custom size and centers on a large screen',
        screenWidth:  2560,
        screenHeight: 1440,
        width:        800,
        height:       600,
        expected:     'width=800,height=600,resizable=1,scrollbars=1,left=880,top=420',
      },
      {
        desc:         'caps size to screen dimensions when requested size exceeds screen',
        screenWidth:  2560,
        screenHeight: 1440,
        width:        3000,
        height:       2000,
        expected:     'width=2560,height=1440,resizable=1,scrollbars=1,left=0,top=0',
      },
      {
        desc:         'caps size to screen dimensions and uses left/top 0 when screen is smaller than defaults',
        screenWidth:  800,
        screenHeight: 600,
        width:        undefined as number | undefined,
        height:       undefined as number | undefined,
        expected:     'width=800,height=600,resizable=1,scrollbars=1,left=0,top=0',
      },
    ])('$desc', ({
      screenWidth, screenHeight, width, height, expected
    }) => {
      mockScreen(screenWidth, screenHeight);
      expect(popupWindowOptions(width, height)).toStrictEqual(expected);
    });
  });

  describe('open', () => {
    let mockWindowOpen: jest.SpyInstance;

    beforeEach(() => {
      mockWindowOpen = jest.spyOn(window, 'open').mockReturnValue(null);
    });

    afterEach(() => {
      mockWindowOpen.mockRestore();
    });

    it('calls window.open with the given url, name, and options', () => {
      open('https://example.com', '_blank', 'width=800');
      expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'width=800');
    });

    it('uses default name _blank and empty options when not specified', () => {
      open('https://example.com');
      expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com', '_blank', '');
    });
  });

  describe('Popup class', () => {
    const mockPopup = { closed: false };
    let mockWindowOpen: jest.SpyInstance;

    beforeEach(() => {
      mockPopup.closed = false;
      mockWindowOpen = jest
        .spyOn(window, 'open')
        .mockReturnValue(mockPopup as unknown as Window);
    });

    afterEach(() => {
      mockWindowOpen.mockRestore();
    });

    it('initialises with null popup reference', () => {
      const popup = new Popup();

      expect(popup.popup).toBeNull();
    });

    it('calls onOpen callback when open is called', () => {
      const onOpen = jest.fn();
      const popup = new Popup(onOpen);

      popup.open('https://example.com', '_blank', '', true);

      expect(onOpen).toHaveBeenCalledWith();
    });

    it('sets popup reference to the opened window', () => {
      const popup = new Popup();

      popup.open('https://example.com', '_blank', '', true);

      expect(popup.popup).toStrictEqual(mockPopup);
    });

    it('throws when the popup is blocked by the browser', () => {
      mockWindowOpen.mockReturnValue(null);
      const popup = new Popup();

      expect(() => popup.open('https://example.com', '_blank', '', true))
        .toThrow('Please disable your popup blocker for this site');
    });

    describe('when polling for window closure', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('calls onClose callback when the popup window is closed', () => {
        const onClose = jest.fn();
        const popup = new Popup(undefined, onClose);

        popup.open('https://example.com', '_blank', '', false);
        mockPopup.closed = true;
        jest.advanceTimersByTime(500);

        expect(onClose).toHaveBeenCalledWith();
      });

      it('does not call onClose when doNotPollForClosure is true', () => {
        const onClose = jest.fn();
        const popup = new Popup(undefined, onClose);

        popup.open('https://example.com', '_blank', '', true);
        mockPopup.closed = true;
        jest.advanceTimersByTime(1000);

        expect(onClose).not.toHaveBeenCalled();
      });
    });
  });
});
