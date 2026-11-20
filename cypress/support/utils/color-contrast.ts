type Rgba = [number, number, number, number];

function parse(color: string): Rgba {
  const channels = color.match(/[\d.]+/g)?.map(Number) || [];

  if (channels.length < 3) {
    throw new Error(`Cannot read the color "${ color }"`);
  }

  return [channels[0], channels[1], channels[2], channels[3] ?? 1];
}

function over(top: Rgba, bottom: Rgba): Rgba {
  const alpha = top[3];

  return [0, 1, 2].map((i) => top[i] * alpha + bottom[i] * (1 - alpha)).concat(1) as Rgba;
}

function luminance([r, g, b]: Rgba): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;

    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function backgroundBehind(element: Element, view: Window): Rgba {
  const layers: Rgba[] = [];

  for (let node: Element | null = element; node; node = node.parentElement) {
    const layer = parse(view.getComputedStyle(node).backgroundColor);

    if (layer[3] > 0) {
      layers.push(layer);
    }
    if (layer[3] === 1) {
      break;
    }
  }

  return layers.reduceRight((below, layer) => over(layer, below), [255, 255, 255, 1] as Rgba);
}

/**
 * The WCAG 2 contrast ratio, from 1 to 21, of an element's text against what is painted behind
 * it: its own background composited over each ancestor's until one is opaque (white if none is).
 */
export function textContrast(element: Element): number {
  const view = element.ownerDocument.defaultView as Window;
  const background = backgroundBehind(element, view);
  const text = over(parse(view.getComputedStyle(element).color), background);
  const [lighter, darker] = [luminance(text), luminance(background)].sort((a, b) => b - a);

  return (lighter + 0.05) / (darker + 0.05);
}
