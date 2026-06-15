import {
  fakeRectFor,
  fitOnScreen,
  AUTO,
  LEFT,
  RIGHT,
  TOP,
  BOTTOM,
  CENTER,
  MIDDLE,
} from '@shell/utils/position';

/**
 * Set up JSDOM window dimensions for all tests in this file.
 * fitOnScreen calls screenRect() which reads window.innerWidth/Height/pageX/YOffset.
 */
function setScreen(width: number, height: number, scrollX = 0, scrollY = 0) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  Object.defineProperty(window, 'pageXOffset', { configurable: true, value: scrollX });
  Object.defineProperty(window, 'pageYOffset', { configurable: true, value: scrollY });
}

/** Build a real MouseEvent so that instanceof Event check in fitOnScreen passes. */
function makeEvent(clientX: number, clientY: number): MouseEvent {
  return new MouseEvent('click', { clientX, clientY });
}

describe('position.js', () => {
  describe('fakeRectFor', () => {
    it.each([
      {
        desc:     'creates a zero-size rect centred at the event coordinates',
        clientX:  100,
        clientY:  200,
        expected: {
          top: 200, left: 100, bottom: 200, right: 100, width: 0, height: 0
        },
      },
      {
        desc:     'handles origin (0,0)',
        clientX:  0,
        clientY:  0,
        expected: {
          top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0
        },
      },
      {
        desc:     'handles negative coordinates',
        clientX:  -5,
        clientY:  -10,
        expected: {
          top: -10, left: -5, bottom: -10, right: -5, width: 0, height: 0
        },
      },
    ])('$desc', ({ clientX, clientY, expected }) => {
      expect(fakeRectFor(makeEvent(clientX, clientY))).toStrictEqual(expected);
    });
  });

  describe('fitOnScreen', () => {
    beforeEach(() => {
      setScreen(1000, 800);
    });

    describe('horizontal AUTO positioning', () => {
      it('chooses LEFT when there is more room on the left than the right', () => {
        // Trigger at x=500 on a 1000px screen. Content is 147px wide.
        // gapIf.left = 1000 - 147 - 500 = 353; gapIf.right = 500 - 147 - 0 = 353
        // condition: gapIf.left < 0 || gapIf.right * 1.5 > gapIf.left → 353*1.5=529.5 > 353 → RIGHT
        // Actually with equal gaps condition picks RIGHT. Let's use a trigger far from left.
        // Trigger at x=700: gapIf.left = 1000-147-700=153; gapIf.right = 700-147-0=553
        // condition: gapIf.right * 1.5 > gapIf.left → 553*1.5=829.5 > 153 → RIGHT
        // For LEFT: need gapIf.right * 1.5 <= gapIf.left
        // Example: trigger at x=200, content=147: gapIf.left=653, gapIf.right=53; 53*1.5=79.5 < 653 → LEFT
        const style = fitOnScreen(null, makeEvent(200, 400), { positionX: AUTO, positionY: AUTO }, true);

        expect(style.left).toBe('200px'); // originFor.left - fudgeX = 200 - 0
      });

      it('chooses RIGHT when there is more room on the right', () => {
        // Trigger at x=900: gapIf.left = 1000-147-900=-47 < 0 → RIGHT
        // style.left = originFor.right + 0 - 147 = 900 - 147 = 753
        const style = fitOnScreen(null, makeEvent(900, 400), { positionX: AUTO, positionY: AUTO }, true);

        expect(style.left).toBe('753px');
      });

      it('chooses RIGHT when left gap is negative', () => {
        // Trigger at x=50: gapIf.right = 50-147-0 = -97 (negative), gapIf.left = 1000-147-50=803 (positive)
        // condition: gapIf.left < 0 = false, gapIf.right*1.5=-145.5 > 803? No → LEFT
        // Wait let me recalculate: trigger at (50, 400), overlapX=true default
        // originFor.left = trigger.left = 50, originFor.right = trigger.right = 50
        // gapIf.left = screen.right - content.width - originFor.left = 1000 - 147 - 50 = 803
        // 803 < 0? No. gapIf.right * 1.5 > gapIf.left → (-97)*1.5 = -145.5 > 803? No → LEFT
        // style.left = 50 - 0 = 50px
        const style = fitOnScreen(null, makeEvent(50, 400), { positionX: AUTO, positionY: AUTO }, true);

        expect(style.left).toBe('50px');
      });
    });

    describe('explicit horizontal positioning', () => {
      it('respects explicit LEFT position', () => {
        // Trigger at x=300 (lots of room both sides)
        // originFor.left = 300, style.left = 300 - 0 = 300px
        const style = fitOnScreen(null, makeEvent(300, 400), { positionX: LEFT, positionY: AUTO }, true);

        expect(style.left).toBe('300px');
      });

      it('respects explicit RIGHT position', () => {
        // Trigger at x=300, content.width=147: style.left = 300 + 0 - 147 = 153px
        const style = fitOnScreen(null, makeEvent(300, 400), { positionX: RIGHT, positionY: AUTO }, true);

        expect(style.left).toBe('153px');
      });

      it('uses CENTER position when there is enough room', () => {
        // Trigger at x=500: originFor.left=500, originFor.right=500
        // gapIf.center = min(1000 - 73.5 - 500, 500 - 73.5 - 0) = min(426.5, 426.5) = 426.5 >= 0 → stays CENTER
        // style.left = (500+500)/2 - 147/2 - 0 = 500 - 73.5 = 426.5px
        const style = fitOnScreen(null, makeEvent(500, 400), { positionX: CENTER, positionY: AUTO }, true);

        expect(style.left).toBe('426.5px');
      });

      it('falls back from CENTER to AUTO when center gap is negative', () => {
        // Trigger at x=50: gapIf.center = min(1000-73.5-50, 50-73.5-0) = min(876.5, -23.5) = -23.5 < 0 → AUTO
        // From AUTO: gapIf.left=803, gapIf.right=-97; gapIf.right*1.5=-145.5 > 803? No → LEFT
        // style.left = 50px
        const style = fitOnScreen(null, makeEvent(50, 400), { positionX: CENTER, positionY: AUTO }, true);

        expect(style.left).toBe('50px');
      });
    });

    describe('vertical AUTO positioning', () => {
      it('chooses BOTTOM when the trigger is near the top', () => {
        // Trigger at y=10: gapIf.top = 10 - 80 - 0 = -70 < 0 → BOTTOM
        // style.top = originFor.bottom - 0 = 10px
        const style = fitOnScreen(null, makeEvent(200, 10), { positionX: AUTO, positionY: AUTO }, true);

        expect(style.top).toBe('10px');
      });

      it('chooses TOP when the trigger is far from the top and bottom gap is small', () => {
        // Trigger at y=700: gapIf.top=700-80-0=620, gapIf.bottom=800-80-700=20
        // gapIf.top < 0? No. gapIf.bottom * 1.5 = 30 > 620? No → TOP
        // style.top = originFor.top + 0 - 80 = 700 - 80 = 620px
        const style = fitOnScreen(null, makeEvent(200, 700), { positionX: AUTO, positionY: AUTO }, true);

        expect(style.top).toBe('620px');
      });

      it('chooses BOTTOM when bottom gap is more than 1.5x top gap', () => {
        // Trigger at y=50: gapIf.top = 50-80-0=-30 < 0 → BOTTOM
        // style.top = 50px
        const style = fitOnScreen(null, makeEvent(200, 50), { positionX: AUTO, positionY: AUTO }, true);

        expect(style.top).toBe('50px');
      });
    });

    describe('explicit vertical positioning', () => {
      it('respects explicit TOP position', () => {
        // Trigger at y=400: originFor.top = 400, style.top = 400 + 0 - 80 = 320px
        const style = fitOnScreen(null, makeEvent(200, 400), { positionX: AUTO, positionY: TOP }, true);

        expect(style.top).toBe('320px');
      });

      it('respects explicit BOTTOM position', () => {
        // Trigger at y=400: originFor.bottom = 400, style.top = 400 - 0 = 400px
        const style = fitOnScreen(null, makeEvent(200, 400), { positionX: AUTO, positionY: BOTTOM }, true);

        expect(style.top).toBe('400px');
      });

      it('falls back from TOP to BOTTOM when top gap is negative', () => {
        // Trigger at y=30: gapIf.top = originFor.bottom - content.height - screen.top = 30 - 80 - 0 = -50 < 0
        // → positionY switches from TOP to BOTTOM
        // style.top = originFor.bottom - fudgeY = 30 - 0 = 30px
        const style = fitOnScreen(null, makeEvent(200, 30), { positionX: AUTO, positionY: TOP }, true);

        expect(style.top).toBe('30px');
      });
    });

    describe('fudge offsets', () => {
      it('applies fudgeX to left position', () => {
        // Trigger at x=200, fudgeX=10, positionX=LEFT: style.left = 200 - 10 = 190px
        const style = fitOnScreen(null, makeEvent(200, 400), {
          positionX: LEFT, positionY: AUTO, fudgeX: 10
        }, true);

        expect(style.left).toBe('190px');
      });

      it('applies fudgeY to top position', () => {
        // Trigger at y=700 → TOP: style.top = 700 + 5 - 80 = 625px
        const style = fitOnScreen(null, makeEvent(200, 700), {
          positionX: AUTO, positionY: TOP, fudgeY: 5
        }, true);

        expect(style.top).toBe('625px');
      });
    });

    describe('mIDDLE vertical positioning', () => {
      it('uses MIDDLE position when there is enough room', () => {
        // Trigger at y=400: originFor.middle = 400
        // gapIf.middle = min(400-40-0, 800-40-400) = min(360, 360) = 360 >= 0 → stays MIDDLE
        // switch MIDDLE == CENTER case: style.top = (400+400)/2 + 0 - 80 = 400-80 = 320px
        const style = fitOnScreen(null, makeEvent(200, 400), { positionX: AUTO, positionY: MIDDLE }, true);

        expect(style.top).toBe('320px');
      });

      it('falls back from MIDDLE to AUTO when middle gap is negative', () => {
        // Trigger at y=30: originFor.middle = 30
        // gapIf.middle = min(30-40-0, 800-40-30) = min(-10, 730) = -10 < 0 → positionY = AUTO
        // Auto: gapIf.top = 30-80-0=-50 < 0 → BOTTOM
        // style.top = originFor.bottom - 0 = 30px
        const style = fitOnScreen(null, makeEvent(200, 30), { positionX: AUTO, positionY: MIDDLE }, true);

        expect(style.top).toBe('30px');
      });
    });

    it('always sets position to absolute', () => {
      const style = fitOnScreen(null, makeEvent(200, 400), {}, true);

      expect(style.position).toBe('absolute');
    });
  });
});
