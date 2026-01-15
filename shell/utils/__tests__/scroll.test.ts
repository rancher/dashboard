import { scrollToBottom } from '@shell/utils/scroll';

describe('fx: scrollToBottom', () => {
  let mainElement: HTMLElement;

  beforeEach(() => {
    mainElement = document.createElement('main');
    document.body.appendChild(mainElement);

    Object.defineProperty(mainElement, 'scrollHeight', {
      value:    1000,
      writable: true
    });
    mainElement.scrollTop = 0;
  });

  afterEach(() => {
    const existingMain = document.getElementsByTagName('main')[0];

    if (existingMain) {
      document.body.removeChild(existingMain);
    }
  });

  it('should scroll main element to bottom', () => {
    scrollToBottom();

    expect(mainElement.scrollTop).toBe(1000);
  });

  it('should do nothing when no main element exists', () => {
    document.body.removeChild(mainElement);

    expect(() => scrollToBottom()).not.toThrow();
  });

  it('should use the first main element when multiple exist', () => {
    const secondMain = document.createElement('main');

    document.body.appendChild(secondMain);

    Object.defineProperty(secondMain, 'scrollHeight', {
      value:    500,
      writable: true
    });
    secondMain.scrollTop = 0;

    scrollToBottom();

    expect(mainElement.scrollTop).toBe(1000);
    expect(secondMain.scrollTop).toBe(0);

    document.body.removeChild(secondMain);
  });

  it('should set scrollTop to scrollHeight value', () => {
    Object.defineProperty(mainElement, 'scrollHeight', {
      value:    2500,
      writable: true
    });

    scrollToBottom();

    expect(mainElement.scrollTop).toBe(2500);
  });
});
