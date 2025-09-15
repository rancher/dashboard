import { debounce } from 'lodash';
import { Ref, ref } from 'vue';
import { boundingRect, LEFT, RIGHT, screenRect } from '@shell/utils/position';
import { Position } from '@shell/components/nav/WindowManager/index.vue';

export default (props: { position: Position, height: Ref<number>, width: Ref<number>, setDimensions: (forceValue: number | string) => void }) => {
  const resizing = ref(false);
  const dragOffset = ref(0);

  function mouseResizeYStart(event: MouseEvent | TouchEvent) {
    const doc = document.documentElement;

    doc.addEventListener('mousemove', mouseResizeYMove);
    doc.addEventListener('touchmove', mouseResizeYMove, true);
    doc.addEventListener('mouseup', mouseResizeYEnd);
    doc.addEventListener('mouseleave', mouseResizeYEnd);
    doc.addEventListener('touchend', mouseResizeYEnd, true);
    doc.addEventListener('touchcancel', mouseResizeYEnd, true);
    doc.addEventListener('touchstart', mouseResizeYEnd, true);

    let eventY: number;

    if (event instanceof MouseEvent) {
      eventY = event.screenY;
    } else if (event instanceof TouchEvent && event.touches.length > 0) {
      eventY = event.touches[0].screenY;
    } else {
      eventY = 0;
    }

    const rect = boundingRect(event.target);
    const offset = eventY - rect.top;

    dragOffset.value = offset;
  }

  function mouseResizeYMove(event: MouseEvent | TouchEvent) {
    const screen = screenRect();

    let eventY: number;

    if (event instanceof MouseEvent) {
      eventY = event.screenY;
    } else if (event instanceof TouchEvent && event.touches.length > 0) {
      eventY = event.touches[0].screenY;
    } else {
      eventY = 0;
    }

    const min = 50;
    const max = Math.round( 3 * screen.height / 4);

    let neu = screen.height - eventY + dragOffset.value;

    neu = Math.max(min, Math.min(neu, max));

    props.height.value = neu;
    resizing.value = true;
  }

  function mouseResizeYEnd(event: MouseEvent | TouchEvent) {
    const doc = document.documentElement;

    doc.removeEventListener('mousemove', mouseResizeYMove);
    doc.removeEventListener('touchmove', mouseResizeYMove, true);
    doc.removeEventListener('mouseup', mouseResizeYEnd);
    doc.removeEventListener('mouseleave', mouseResizeYEnd);
    doc.removeEventListener('touchend', mouseResizeYEnd, true);
    doc.removeEventListener('touchcancel', mouseResizeYEnd, true);
    doc.removeEventListener('touchstart', mouseResizeYEnd, true);

    debounce(() => {
      resizing.value = false;
    }, 100)();
  }

  function mouseResizeXStart(event: MouseEvent | TouchEvent) {
    const doc = document.documentElement;

    doc.addEventListener('mousemove', mouseResizeXMove);
    doc.addEventListener('touchmove', mouseResizeXMove, true);
    doc.addEventListener('mouseup', mouseResizeXEnd);
    doc.addEventListener('mouseleave', mouseResizeXEnd);
    doc.addEventListener('touchend', mouseResizeXEnd, true);
    doc.addEventListener('touchcancel', mouseResizeXEnd, true);
    doc.addEventListener('touchstart', mouseResizeXEnd, true);

    const eventX = (event instanceof MouseEvent) ? event.screenX : (event as TouchEvent).touches[0].screenX;
    const rect = boundingRect(event.target);

    switch (props.position) {
    case RIGHT:
      dragOffset.value = eventX - rect.left;
      break;
    case LEFT:
      dragOffset.value = rect.right - eventX;
      break;
    }
  }

  function mouseResizeXMove(event: MouseEvent | TouchEvent) {
    const screen = screenRect();
    const eventX = (event instanceof MouseEvent) ? event.screenX : (event as TouchEvent).touches[0].screenX;

    const min = 250;
    const max = Math.round(2 * screen.width / 5);
    let neu;

    switch (props.position) {
    case RIGHT:
      neu = Math.max(min, Math.min((screen.width - eventX + dragOffset.value) || 0, max));
      document.documentElement.style.setProperty('--wm-vr-width', `${ neu }px`);
      break;
    case LEFT:
      neu = Math.max(min, Math.min((eventX + dragOffset.value) || 0, max));
      document.documentElement.style.setProperty('--wm-vl-width', `${ neu }px`);
      break;
    }

    props.width.value = neu || 0;
  }

  function mouseResizeXEnd(event: MouseEvent | TouchEvent) {
    const doc = document.documentElement;

    doc.removeEventListener('mousemove', mouseResizeXMove);
    doc.removeEventListener('touchmove', mouseResizeXMove, true);
    doc.removeEventListener('mouseup', mouseResizeXEnd);
    doc.removeEventListener('mouseleave', mouseResizeXEnd);
    doc.removeEventListener('touchend', mouseResizeXEnd, true);
    doc.removeEventListener('touchcancel', mouseResizeXEnd, true);
    doc.removeEventListener('touchstart', mouseResizeXEnd, true);
  }

  function keyboardResizeY(arrowUp: boolean) {
    const resizeStep = 20;
    const newHeight = arrowUp ? (props.height.value || 0) + resizeStep : (props.height.value || 0) - resizeStep;

    props.height.value = newHeight;

    props.setDimensions(newHeight);
  }

  function keyboardResizeX(arrowLeft: boolean) {
    const resizeStep = 20;
    let newWidth;

    if (props.position === LEFT) {
      newWidth = arrowLeft ? (props.width.value || 0) - resizeStep : (props.width.value || 0) + resizeStep;
    } else {
      newWidth = arrowLeft ? (props.width.value || 0) + resizeStep : (props.width.value || 0) - resizeStep;
    }

    props.width.value = newWidth;

    props.setDimensions(newWidth);
  }

  return {
    mouseResizeYStart,
    mouseResizeYMove,
    mouseResizeYEnd,
    mouseResizeXStart,
    mouseResizeXMove,
    mouseResizeXEnd,
    keyboardResizeY,
    keyboardResizeX
  };
};
