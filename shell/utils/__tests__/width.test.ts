import { setWidth, getWidth } from '@shell/utils/width';

describe('fx: setWidth', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
  });

  it('should do nothing when element is null', () => {
    expect(() => setWidth(null as any, 100)).not.toThrow();
  });

  it('should do nothing when element is undefined', () => {
    expect(() => setWidth(undefined as any, 100)).not.toThrow();
  });

  it('should set width in pixels when value is a number', () => {
    setWidth(mockElement, 100);

    expect(mockElement.style.width).toBe('100px');
  });

  it('should set width directly when value is a string', () => {
    setWidth(mockElement, '50%');

    expect(mockElement.style.width).toBe('50%');
  });

  it('should set width with em units when provided as string', () => {
    setWidth(mockElement, '10em');

    expect(mockElement.style.width).toBe('10em');
  });

  it('should call function and use result when value is a function returning number', () => {
    const widthFn = () => 200;

    setWidth(mockElement, widthFn);

    expect(mockElement.style.width).toBe('200px');
  });

  it('should call function and use result when value is a function returning string', () => {
    const widthFn = () => '75%';

    setWidth(mockElement, widthFn);

    expect(mockElement.style.width).toBe('75%');
  });

  it('should handle zero width', () => {
    setWidth(mockElement, 0);

    expect(mockElement.style.width).toBe('0px');
  });
});

describe('fx: getWidth', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    mockElement.style.width = '100px';
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
  });

  it('should return undefined when element is null', () => {
    const result = getWidth(null as any);

    expect(result).toBeUndefined();
  });

  it('should return undefined when element is undefined', () => {
    const result = getWidth(undefined as any);

    expect(result).toBeUndefined();
  });

  it('should return undefined when element is empty array', () => {
    const result = getWidth([] as any);

    expect(result).toBeUndefined();
  });

  it('should return width as number for single element', () => {
    const result = getWidth([mockElement] as any);

    expect(typeof result).toBe('number');
    expect(result).toBe(100);
  });

  it('should return width from first element when array provided', () => {
    const secondElement = document.createElement('div');

    document.body.appendChild(secondElement);
    secondElement.style.width = '200px';

    const result = getWidth([mockElement, secondElement] as any);

    expect(result).toBe(100);

    document.body.removeChild(secondElement);
  });
});
