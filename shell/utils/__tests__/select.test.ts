import { calculatePosition } from '@shell/utils/select';

function makeSelectEl(rect: { x: number; y: number; width: number; height: number }): HTMLElement {
  const el = document.createElement('div');

  el.getBoundingClientRect = jest.fn().mockReturnValue({
    x:      rect.x,
    y:      rect.y,
    width:  rect.width,
    height: rect.height,
    top:    rect.y,
    bottom: rect.y + rect.height,
    left:   rect.x,
    right:  rect.x + rect.width,
  });

  return el;
}

function makeDropdownList(offsetHeight: number): HTMLElement {
  const el = document.createElement('div');

  Object.defineProperty(el, 'offsetHeight', {
    configurable: true,
    value:        offsetHeight,
  });

  return el;
}

function makeComponent(selectEl: HTMLElement): { $parent: { $el: HTMLElement } } {
  return { $parent: { $el: selectEl } };
}

function setWindowEnv(opts: { scrollY?: number; innerHeight?: number }): void {
  if (opts.scrollY !== undefined) {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: opts.scrollY });
  }
  if (opts.innerHeight !== undefined) {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: opts.innerHeight });
  }
}

function setDocHeight(height: number): void {
  Object.defineProperty(document.body, 'offsetHeight', { configurable: true, value: height });
}

describe('select.js', () => {
  describe('calculatePosition', () => {
    const rect = {
      x:      50,
      y:      200,
      width:  300,
      height: 40,
    };

    beforeEach(() => {
      setWindowEnv({ scrollY: 0, innerHeight: 800 });
      setDocHeight(1000);
    });

    describe('placement direction', () => {
      it('uses bottom positioning when placement is "top"', () => {
        const selectEl = makeSelectEl(rect);
        const dropdownList = makeDropdownList(100);
        const component = makeComponent(selectEl);

        calculatePosition(dropdownList, component, undefined, 'top');

        // bottom = docHeight - scrollY - r.y - 1 = 1000 - 0 - 200 - 1 = 799
        expect(dropdownList.style.bottom).toStrictEqual('799px');
        expect(dropdownList.style.top).toStrictEqual('');
        expect(dropdownList.classList.contains('vs__dropdown-up')).toStrictEqual(true);
        expect(selectEl.classList.contains('vs__dropdown-up')).toStrictEqual(true);
      });

      it('uses bottom positioning when placement is "top-start"', () => {
        const selectEl = makeSelectEl(rect);
        const dropdownList = makeDropdownList(100);
        const component = makeComponent(selectEl);

        calculatePosition(dropdownList, component, undefined, 'top-start');

        expect(dropdownList.style.bottom).toStrictEqual('799px');
        expect(dropdownList.style.top).toStrictEqual('');
        expect(dropdownList.classList.contains('vs__dropdown-up')).toStrictEqual(true);
        expect(selectEl.classList.contains('vs__dropdown-up')).toStrictEqual(true);
      });

      it('uses top positioning when placement is "bottom-start" and dropdown fits below', () => {
        const selectEl = makeSelectEl(rect);
        const dropdownList = makeDropdownList(100);
        const component = makeComponent(selectEl);

        calculatePosition(dropdownList, component, undefined, 'bottom-start');

        // top = r.y + r.height - 1 + scrollY = 200 + 40 - 1 + 0 = 239
        expect(dropdownList.style.top).toStrictEqual('239px');
        expect(dropdownList.style.bottom).toStrictEqual('');
        expect(dropdownList.classList.contains('vs__dropdown-up')).toStrictEqual(false);
        expect(selectEl.classList.contains('vs__dropdown-up')).toStrictEqual(false);
      });

      it('falls back to bottom positioning when dropdown overflows the viewport', () => {
        const selectEl = makeSelectEl(rect);
        // offsetHeight=600: end = 239 + 600 = 839 > 800 (innerHeight) → overflow
        const dropdownList = makeDropdownList(600);
        const component = makeComponent(selectEl);

        calculatePosition(dropdownList, component, undefined, 'bottom-start');

        // bottom = 1000 - 0 - 200 - 1 = 799
        expect(dropdownList.style.bottom).toStrictEqual('799px');
        expect(dropdownList.style.top).toStrictEqual('');
        expect(dropdownList.classList.contains('vs__dropdown-up')).toStrictEqual(true);
        expect(selectEl.classList.contains('vs__dropdown-up')).toStrictEqual(true);
      });

      it('defaults to bottom-start behaviour when no placement is provided', () => {
        const selectEl = makeSelectEl(rect);
        const dropdownList = makeDropdownList(100);
        const component = makeComponent(selectEl);

        // no placement argument → defaults to 'bottom-start'
        calculatePosition(dropdownList, component, undefined, undefined);

        expect(dropdownList.style.top).toStrictEqual('239px');
        expect(dropdownList.classList.contains('vs__dropdown-up')).toStrictEqual(false);
      });
    });

    describe('scroll offset', () => {
      it('adds window.scrollY to the top position when the dropdown fits', () => {
        setWindowEnv({ scrollY: 100, innerHeight: 800 });
        const selectEl = makeSelectEl(rect);
        const dropdownList = makeDropdownList(100);
        const component = makeComponent(selectEl);

        calculatePosition(dropdownList, component, undefined, 'bottom-start');

        // top = 200 + 40 - 1 + 100 = 339
        expect(dropdownList.style.top).toStrictEqual('339px');
      });

      it('subtracts window.scrollY from the bottom position', () => {
        setWindowEnv({ scrollY: 50, innerHeight: 800 });
        const selectEl = makeSelectEl(rect);
        const dropdownList = makeDropdownList(100);
        const component = makeComponent(selectEl);

        calculatePosition(dropdownList, component, undefined, 'top');

        // bottom = 1000 - 50 - 200 - 1 = 749
        expect(dropdownList.style.bottom).toStrictEqual('749px');
      });
    });

    describe('always-set style properties', () => {
      // Note: dropdownList.style.width = 'min-content' is always set by calculatePosition
      // but jsdom does not support the min-content keyword so that property is not asserted here.
      it.each([
        {
          desc:      'top-positioned dropdown',
          placement: 'bottom-start',
        },
        {
          desc:      'bottom-positioned dropdown',
          placement: 'top',
        },
      ])('sets left and minWidth for $desc', ({ placement }) => {
        const selectEl = makeSelectEl(rect);
        const dropdownList = makeDropdownList(100);
        const component = makeComponent(selectEl);

        calculatePosition(dropdownList, component, undefined, placement);

        expect(dropdownList.style.left).toStrictEqual('50px');
        expect(dropdownList.style.minWidth).toStrictEqual('300px');
      });
    });

    describe('vs__dropdown-up class management', () => {
      it('removes vs__dropdown-up from both elements when switching to top positioning', () => {
        const selectEl = makeSelectEl(rect);
        const dropdownList = makeDropdownList(100);

        // pre-add the class to simulate a previous bottom-positioned state
        dropdownList.classList.add('vs__dropdown-up');
        selectEl.classList.add('vs__dropdown-up');

        calculatePosition(dropdownList, makeComponent(selectEl), undefined, 'bottom-start');

        expect(dropdownList.classList.contains('vs__dropdown-up')).toStrictEqual(false);
        expect(selectEl.classList.contains('vs__dropdown-up')).toStrictEqual(false);
      });

      it('adds vs__dropdown-up to both elements when switching to bottom positioning', () => {
        const selectEl = makeSelectEl(rect);
        const dropdownList = makeDropdownList(600);

        calculatePosition(dropdownList, makeComponent(selectEl), undefined, 'bottom-start');

        expect(dropdownList.classList.contains('vs__dropdown-up')).toStrictEqual(true);
        expect(selectEl.classList.contains('vs__dropdown-up')).toStrictEqual(true);
      });
    });
  });
});
