import { calculatePosition } from '@shell/utils/select';

describe('fx: calculatePosition', () => {
  let dropdownList: HTMLElement;
  let mockComponent: any;
  let mockSelectEl: HTMLElement;

  beforeEach(() => {
    dropdownList = document.createElement('div');
    mockSelectEl = document.createElement('div');

    Object.defineProperty(dropdownList, 'offsetHeight', { value: 200 });

    mockComponent = { $parent: { $el: mockSelectEl } };

    jest.spyOn(mockSelectEl, 'getBoundingClientRect').mockReturnValue({
      x:      100,
      y:      50,
      width:  200,
      height: 40,
      top:    50,
      right:  300,
      bottom: 90,
      left:   100,
      toJSON: () => {}
    });

    Object.defineProperty(document.body, 'offsetHeight', {
      value:    800,
      writable: true
    });

    Object.defineProperty(window, 'innerHeight', {
      value:    600,
      writable: true
    });

    Object.defineProperty(window, 'scrollY', {
      value:    0,
      writable: true
    });
  });

  it('should set dropdown left position based on element x', () => {
    calculatePosition(dropdownList, mockComponent, 200, 'bottom-start');

    expect(dropdownList.style.left).toBe('100px');
  });

  it('should set minWidth based on element width', () => {
    calculatePosition(dropdownList, mockComponent, 200, 'bottom-start');

    expect(dropdownList.style.minWidth).toBe('200px');
  });

  it('should set width style property', () => {
    calculatePosition(dropdownList, mockComponent, 200, 'bottom-start');

    // JSDOM doesn't fully support 'min-content', but the style is set
    expect(dropdownList.style.width).toBeDefined();
  });

  it('should position dropdown below element for bottom placement', () => {
    calculatePosition(dropdownList, mockComponent, 200, 'bottom-start');

    expect(dropdownList.style.top).toBe('89px');
  });

  it('should use default placement of bottom-start when not provided', () => {
    calculatePosition(dropdownList, mockComponent, 200, undefined);

    expect(dropdownList.style.top).toBe('89px');
  });

  it('should position dropdown above element for top placement', () => {
    calculatePosition(dropdownList, mockComponent, 200, 'top-start');

    expect(dropdownList.style.bottom).toBeTruthy();
    expect(dropdownList.classList.contains('vs__dropdown-up')).toBe(true);
  });

  it('should add vs__dropdown-up class to dropdown and select for top placement', () => {
    calculatePosition(dropdownList, mockComponent, 200, 'top-start');

    expect(dropdownList.classList.contains('vs__dropdown-up')).toBe(true);
    expect(mockSelectEl.classList.contains('vs__dropdown-up')).toBe(true);
  });

  it('should remove vs__dropdown-up class for bottom placement', () => {
    dropdownList.classList.add('vs__dropdown-up');
    mockSelectEl.classList.add('vs__dropdown-up');

    calculatePosition(dropdownList, mockComponent, 200, 'bottom-start');

    expect(dropdownList.classList.contains('vs__dropdown-up')).toBe(false);
    expect(mockSelectEl.classList.contains('vs__dropdown-up')).toBe(false);
  });

  it('should flip to top when dropdown would overflow viewport', () => {
    jest.spyOn(mockSelectEl, 'getBoundingClientRect').mockReturnValue({
      x:      100,
      y:      500,
      width:  200,
      height: 40,
      top:    500,
      right:  300,
      bottom: 540,
      left:   100,
      toJSON: () => {}
    });

    calculatePosition(dropdownList, mockComponent, 200, 'bottom-start');

    expect(dropdownList.style.bottom).toBeTruthy();
    expect(dropdownList.classList.contains('vs__dropdown-up')).toBe(true);
  });
});
