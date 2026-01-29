import { popupWindowOptions, open, Popup } from '@shell/utils/window';

describe('fx: popupWindowOptions', () => {
  const originalScreen = window.screen;

  beforeEach(() => {
    Object.defineProperty(window, 'screen', {
      value: {
        width:  1920,
        height: 1080
      },
      writable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'screen', {
      value:    originalScreen,
      writable: true
    });
  });

  it('should return default dimensions when no arguments provided', () => {
    const result = popupWindowOptions();

    expect(result).toContain('width=1040');
    expect(result).toContain('height=768');
  });

  it('should use provided width and height when smaller than screen', () => {
    const result = popupWindowOptions(800, 600);

    expect(result).toContain('width=800');
    expect(result).toContain('height=600');
  });

  it('should cap width and height to screen dimensions', () => {
    const result = popupWindowOptions(3000, 2000);

    expect(result).toContain('width=1920');
    expect(result).toContain('height=1080');
  });

  it('should include resizable and scrollbars options', () => {
    const result = popupWindowOptions(800, 600);

    expect(result).toContain('resizable=1');
    expect(result).toContain('scrollbars=1');
  });

  it('should calculate centered left position', () => {
    const result = popupWindowOptions(800, 600);
    const expectedLeft = (1920 - 800) / 2;

    expect(result).toContain(`left=${ expectedLeft }`);
  });

  it('should calculate centered top position', () => {
    const result = popupWindowOptions(800, 600);
    const expectedTop = (1080 - 600) / 2;

    expect(result).toContain(`top=${ expectedTop }`);
  });

  it('should set left and top to 0 when window is larger than screen', () => {
    Object.defineProperty(window, 'screen', {
      value: {
        width:  500,
        height: 400
      },
      writable: true
    });

    const result = popupWindowOptions(800, 600);

    expect(result).toContain('left=0');
    expect(result).toContain('top=0');
  });
});

describe('fx: open', () => {
  beforeEach(() => {
    jest.spyOn(window, 'open').mockReturnValue({ closed: false } as Window);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call window.open with provided arguments', () => {
    open('https://example.com', 'testWindow', 'width=800');

    expect(window.open).toHaveBeenCalledWith('https://example.com', 'testWindow', 'width=800');
  });

  it('should use _blank as default name', () => {
    open('https://example.com');

    expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank', '');
  });

  it('should return the window object from window.open', () => {
    const mockWindow = { closed: false };

    (window.open as jest.Mock).mockReturnValue(mockWindow);

    const result = open('https://example.com');

    expect(result).toBe(mockWindow);
  });
});

describe('class: Popup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(window, 'open').mockReturnValue({ closed: false } as Window);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should call onOpen callback when opening popup', () => {
    const onOpen = jest.fn();
    const popup = new Popup(onOpen);

    popup.open('https://example.com', 'test', '');

    expect(onOpen).toHaveBeenCalledWith();
  });

  it('should throw error when popup is blocked', () => {
    (window.open as jest.Mock).mockReturnValue(null);

    const popup = new Popup();

    expect(() => popup.open('https://example.com', 'test', '')).toThrow('Please disable your popup blocker for this site');
  });

  it('should call onClose callback when popup closes', () => {
    const onClose = jest.fn();
    const mockPopup = { closed: false };

    (window.open as jest.Mock).mockReturnValue(mockPopup);

    const popup = new Popup(() => {}, onClose);

    popup.open('https://example.com', 'test', '');

    expect(onClose).not.toHaveBeenCalled();

    mockPopup.closed = true;
    jest.advanceTimersByTime(500);

    expect(onClose).toHaveBeenCalledWith();
  });

  it('should not poll for closure when doNotPollForClosure is true', () => {
    const onClose = jest.fn();
    const mockPopup = { closed: true };

    (window.open as jest.Mock).mockReturnValue(mockPopup);

    const popup = new Popup(() => {}, onClose);

    popup.open('https://example.com', 'test', '', true);

    jest.advanceTimersByTime(1000);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should store popup reference', () => {
    const mockPopup = { closed: false };

    (window.open as jest.Mock).mockReturnValue(mockPopup);

    const popup = new Popup();

    popup.open('https://example.com', 'test', '', true);

    expect(popup.popup).toBe(mockPopup);
  });
});
