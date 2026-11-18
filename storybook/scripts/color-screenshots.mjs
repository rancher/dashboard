/**
 * Captures where each design system color primitive is painted in the running dashboard, for the Color Primitives
 * Storybook page. Visits pages and scenarios in each theme, finds elements whose computed style paints a primitive,
 * and keeps a screenshot only when the color is really in it: the element is captured with and without the color,
 * and pixels inside it have to match the color over whatever is behind it. The screenshot is saved unmarked; its
 * index entry records a matching pixel (`tip`), the direction (`angle`, in degrees) and the size (`scale`) the page
 * draws an eyedropper and a swatch of the color with.
 *
 * Usage, with a dashboard running and a Chrome signed in to it that exposes the DevTools protocol:
 *
 *   node storybook/scripts/color-screenshots.mjs [--cdp http://localhost:9222] [--app https://localhost:8005]
 *     [--out storybook/storybook-static/color-usage] [--scenarios extra.json] [--only name,name] [--fresh]
 *     [--list] [--debug color-red-405,color-white]
 *
 * Run it after `yarn build-storybook` and before publishing the build. The screenshots are not committed. A second
 * run into the same directory keeps what the first found unless `--fresh` is given. `--scenarios` adds scenarios
 * that only make sense on one Rancher, as a JSON array in the format of `SCENARIOS` below:
 * `{ name, route, how, themes, steps }`, where a step is `{ click, text }`, `{ hover }`, `{ type }`, `{ key }`,
 * `{ force, state, all }`, `{ eval }`, `{ waitFor }` or `{ wait }`. `--debug` prints why each listed color's
 * candidates passed or failed the pixel check. The built-in pages and scenarios only navigate and open menus, so
 * they are safe to run against a shared Rancher.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const args = Object.fromEntries(process.argv.slice(2).join(' ').split(/\s*--/).filter(Boolean)
  .map((a) => [a.split(/\s+/)[0], a.split(/\s+/)[1] ?? true]));
const CDP = args.cdp || 'http://localhost:9222';
const APP = (args.app || 'https://localhost:8005').replace(/\/$/, '');
const OUT = path.resolve(args.out || 'storybook/storybook-static/color-usage');
const ONLY = args.only ? args.only.split(',') : null;
const DEBUG = typeof args.debug === 'string' ? args.debug.split(',').map((n) => `--${ n.replace(/^-*/, '') }`) : [];
const EXTRA = args.scenarios ? JSON.parse(fs.readFileSync(args.scenarios, 'utf8')) : [];

const THEMES = {
  light:           'theme-light',
  dark:            'theme-dark',
  'classic light': 'classic theme-light',
  'classic dark':  'classic theme-dark',
  'SUSE light':    'suse theme-light',
  'SUSE dark':     'suse theme-dark',
};

const CRAWL = [
  '/home',
  '/c/local/explorer',
  '/c/local/explorer/node',
  '/c/local/explorer/workload',
  '/c/local/explorer/pod',
  '/c/local/explorer/namespace',
  '/c/local/explorer/members',
  '/c/local/explorer/events',
  '/c/local/explorer/configmap/create',
  '/c/local/explorer/configmap/create?as=yaml',
  '/c/local/explorer/apps.deployment/create',
  '/c/local/explorer/secret/create',
  '/c/local/explorer/service/create',
  '/c/local/explorer/tools',
  '/c/local/explorer/management.cattle.io.project',
  '/c/local/apps/charts',
  '/c/local/apps/catalog.cattle.io.app',
  '/c/_/fleet',
  '/c/_/fleet/fleet.cattle.io.gitrepo',
  '/c/_/manager/provisioning.cattle.io.cluster',
  '/c/_/manager/provisioning.cattle.io.cluster/create',
  '/c/_/manager/provisioning.cattle.io.cluster/fleet-default/ascale-demo',
  '/c/_/manager/cloudCredential/create',
  '/c/_/manager/drivers',
  '/c/_/manager/hostedprovider',
  '/c/local/auth/management.cattle.io.user',
  '/c/local/auth/roles',
  '/c/_/settings/management.cattle.io.setting',
  '/c/_/settings/brand',
  '/c/local/uiplugins',
  '/prefs',
  '/about',
  '/account',
  '/diagnostic',
].map((route) => ({ name: route, route, hover: true }));

const SCENARIOS = [
  {
    name: 'top-level-menu', route: '/home', hover: true, how: 'with the side menu open', steps: [{ click: '.menu-icon, [data-testid="top-level-menu"] button' }]
  },
  {
    name: 'user-menu', route: '/home', hover: true, how: 'with the user menu open', steps: [{ click: '[data-testid="nav_header_showUserMenu"]' }]
  },
];

const HOVER_TARGETS = 'button, .btn, a, [role="tab"], [role="menuitem"], tr.main-row, .side-nav .child, .option, input, .labeled-select';
const PROPERTY_WEIGHT = {
  'background-color': 5, 'background-image': 4, 'border-color': 3, fill: 3, stroke: 3, color: 2, 'outline-color': 2, 'box-shadow': 1, 'text-decoration-color': 1
};
const EYEDROPPER = {
  body: 50, swatch: 68, swatchRadius: 15, shownWidth: 720
};
const HIDE = {
  'background-color':      'background-color: transparent',
  'background-image':      'background-image: none',
  'border-color':          'border-color: transparent',
  color:                   'color: transparent; -webkit-text-fill-color: transparent',
  fill:                    'fill: transparent',
  stroke:                  'stroke: transparent',
  'outline-color':         'outline-color: transparent',
  'box-shadow':            'box-shadow: none',
  'text-decoration-color': 'text-decoration-color: transparent',
};

function collect(scope, weight) {
  if (!window.colorCaptureNames) {
    const probe = document.createElement('span');
    const render = (value) => {
      probe.style.color = '';
      probe.style.color = value;

      return probe.style.color ? getComputedStyle(probe).color : null;
    };

    document.body.appendChild(probe);
    window.colorCaptureNames = new Map();
    for (const sheet of document.styleSheets) {
      let rules = [];

      try {
        rules = sheet.cssRules;
      } catch (e) {
        continue;
      }
      for (const rule of rules) {
        if (rule.selectorText === ':root') {
          for (const name of rule.style) {
            const color = name.startsWith('--color-') && render(rule.style.getPropertyValue(name));

            if (color && !window.colorCaptureNames.has(color)) {
              window.colorCaptureNames.set(color, name);
            }
          }
        }
      }
    }
    probe.remove();
  }
  const byColor = window.colorCaptureNames;
  const colorsIn = (value) => value.match(/rgba?\([^)]*\)/g) || [];
  const describe = (el) => `${ el.tagName.toLowerCase() }${ [...el.classList].filter((c) => !c.startsWith('data-v-')).slice(0, 2).map((c) => `.${ c }`).join('') }`;
  const shapes = 'path, rect, circle, ellipse, line, polyline, polygon, text, tspan';
  const found = {};

  const root = scope ? document.querySelector(scope) : document.body;

  for (const el of root ? [root, ...root.querySelectorAll('*')] : []) {
    if (el === document.body || el.closest('#color-capture-mark')) {
      continue;
    }
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
      continue;
    }
    const rect = el.getBoundingClientRect();
    const area = rect.width * rect.height;

    if (rect.width < 2 || rect.height < 2 || rect.right <= 0 || rect.left >= innerWidth || rect.bottom <= 0 || rect.top >= innerHeight + 2000) {
      continue;
    }
    const size = area < 150 ? 0.3 : area > 400000 ? 0.4 : 1;
    const text = [...el.childNodes].some((c) => c.nodeType === Node.TEXT_NODE && c.textContent.trim());

    for (const pseudo of el.matches('input, textarea') ? [null, '::before', '::after', '::placeholder'] : [null, '::before', '::after']) {
      const s = getComputedStyle(el, pseudo);
      const props = [];

      if (pseudo === '::placeholder') {
        if (el.matches('input, textarea') && !el.value && el.placeholder) {
          props.push(['color', s.color]);
        }
      } else {
        if (pseudo && (s.content === 'none' || s.content === 'normal')) {
          continue;
        }
        props.push(['background-color', s.backgroundColor], ['background-image', s.backgroundImage]);
        for (const side of ['top', 'right', 'bottom', 'left']) {
          if (parseFloat(s[`border-${ side }-width`]) > 0 && s[`border-${ side }-style`] !== 'none') {
            props.push(['border-color', s[`border-${ side }-color`]]);
          }
        }
        if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) {
          props.push(['outline-color', s.outlineColor]);
        }
        if (s.boxShadow !== 'none') {
          props.push(['box-shadow', s.boxShadow]);
        }
        if (el.matches(shapes)) {
          props.push(['fill', s.fill]);
          if (s.stroke !== 'none' && parseFloat(s.strokeWidth) > 0) {
            props.push(['stroke', s.stroke]);
          }
        }
        if (text || (pseudo && s.content.replace(/["']/g, '').trim()) || (el.matches('input, textarea') && el.value)) {
          props.push(['color', s.color]);
          if (s.textDecorationLine !== 'none') {
            props.push(['text-decoration-color', s.textDecorationColor]);
          }
        }
      }

      for (const [property, value] of props) {
        for (const color of new Set(colorsIn(value || ''))) {
          const name = byColor.get(color);

          if (!name || (/^rgba\(.*,\s*0\)$/.test(color) && property !== 'background-image')) {
            continue;
          }
          el.dataset.colorCapture ||= String(window.colorCaptureNext = (window.colorCaptureNext || 0) + 1);
          (found[name] ||= []).push({
            name,
            color,
            property,
            pseudo,
            score:   weight[property] * size,
            element: `${ describe(el) }${ pseudo || '' }`,
            id:      el.dataset.colorCapture
          });
        }
      }
    }
  }

  for (const name of Object.keys(found)) {
    found[name] = found[name].sort((a, b) => b.score - a.score).slice(0, 5);
  }

  return found;
}

function frame(id, property, pseudo) {
  const el = document.querySelector(`[data-color-capture="${ id }"]`);

  if (!el) {
    return null;
  }
  el.scrollIntoView({ block: 'center', inline: 'center' });
  const rect = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  const reach = pseudo && pseudo !== '::placeholder' ? 40 : property === 'box-shadow' ? 30 : property === 'outline-color' ? parseFloat(s.outlineWidth) + Math.abs(parseFloat(s.outlineOffset)) + 2 : 2;
  const roi = {
    left: rect.left - reach, top: rect.top - reach, right: rect.right + reach, bottom: rect.bottom + reach
  };
  const width = Math.min(Math.max(roi.right - roi.left + 200, 560), 1100, innerWidth);
  const height = Math.min(Math.max(roi.bottom - roi.top + 160, 300), 640, innerHeight);
  const x = Math.round(Math.min(Math.max((roi.left + roi.right) / 2 - width / 2, 0), innerWidth - width));
  const y = Math.round(Math.min(Math.max((roi.top + roi.bottom) / 2 - height / 2, 0), innerHeight - height));
  const local = (r) => ({
    left: r.left - x, top: r.top - y, right: r.right - x, bottom: r.bottom - y
  });

  return {
    clip: {
      x: x + scrollX, y: y + scrollY, width: Math.round(width), height: Math.round(height), scale: 1
    },
    rect: local(rect),
    roi:  local(roi),
  };
}

function hide(id, pseudo, declarations) {
  let style = document.getElementById('color-capture-hide');

  if (!style) {
    style = document.createElement('style');
    style.id = 'color-capture-hide';
    document.head.appendChild(style);
  }
  const selector = `[data-color-capture="${ id }"]`.repeat(3);

  style.textContent = declarations ? `${ selector }${ pseudo || '' } { ${ declarations.split(';').map((d) => `${ d } !important`).join(';') } }` : '';
  const el = document.querySelector(`[data-color-capture="${ id }"]`);

  if (el && !pseudo) {
    el.style.cssText = declarations ? `${ el.dataset.colorCaptureStyle ?? (el.dataset.colorCaptureStyle = el.style.cssText) };${ declarations.split(';').map((d) => `${ d } !important`).join(';') }` : el.dataset.colorCaptureStyle ?? el.style.cssText;
  }
}

function decodePng(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let channels = 4;
  const chunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      channels = { 2: 3, 6: 4 }[data[9]];
      if (data[8] !== 8 || !channels || data[12]) {
        throw new Error('Unsupported PNG');
      }
    } else if (type === 'IDAT') {
      chunks.push(data);
    }
    offset += 12 + length;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  const pixels = new Uint8Array(width * height * 4);
  let previous = new Uint8Array(stride);

  for (let row = 0; row < height; row++) {
    const filter = raw[row * (stride + 1)];
    const line = raw.subarray(row * (stride + 1) + 1, (row + 1) * (stride + 1));
    const out = new Uint8Array(stride);

    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? out[i - channels] : 0;
      const b = previous[i];
      const c = i >= channels ? previous[i - channels] : 0;
      const p = a + b - c;
      const paeth = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c;

      out[i] = (line[i] + [0, a, b, (a + b) >> 1, paeth][filter]) & 255;
    }
    for (let col = 0; col < width; col++) {
      pixels.set([out[col * channels], out[col * channels + 1], out[col * channels + 2], 255], (row * width + col) * 4);
    }
    previous = out;
  }

  return { width, height, pixels };
}

function verify(withColor, without, roi, color, property) {
  const [r, g, b, alpha = 1] = color.match(/[\d.]+/g).map(Number);
  const { width, height } = withColor;
  const mask = new Uint8Array(width * height);
  const same = new Uint8Array(width * height);
  const shifted = new Uint8Array(width * height);
  const box = {
    left: Math.max(0, Math.floor(roi.left)), top: Math.max(0, Math.floor(roi.top)), right: Math.min(width, Math.ceil(roi.right)), bottom: Math.min(height, Math.ceil(roi.bottom))
  };
  let full = 0;
  let changed = 0;
  let alike = 0;
  let partial = 0;
  let strongest = 0;

  for (let y = box.top; y < box.bottom; y++) {
    for (let x = box.left; x < box.right; x++) {
      const i = (y * width + x) * 4;
      const [sr, sg, sb] = [withColor.pixels[i], withColor.pixels[i + 1], withColor.pixels[i + 2]];
      const [br, bg, bb] = [without.pixels[i], without.pixels[i + 1], without.pixels[i + 2]];
      const er = br + (r - br) * alpha;
      const eg = bg + (g - bg) * alpha;
      const eb = bb + (b - bb) * alpha;
      const differs = Math.max(Math.abs(sr - br), Math.abs(sg - bg), Math.abs(sb - bb)) >= 3;
      const off = Math.max(Math.abs(sr - er), Math.abs(sg - eg), Math.abs(sb - eb));

      if (differs) {
        shifted[y * width + x] = 1;
        changed++;
      }
      if (differs && off <= 3) {
        mask[y * width + x] = 1;
        full++;
      } else if (!differs && off <= 2) {
        same[y * width + x] = 1;
        alike++;
      } else if (differs) {
        let low = Infinity;
        let high = -Infinity;

        for (const [shown, behind, expected] of [[sr, br, er], [sg, bg, eg], [sb, bb, eb]]) {
          if (Math.abs(expected - behind) > 8) {
            const t = (shown - behind) / (expected - behind);

            low = Math.min(low, t);
            high = Math.max(high, t);
          }
        }
        if (high - low < 0.12 && low > 0.2 && high < 1.05) {
          partial++;
          strongest = Math.max(strongest, low);
          if (low >= 0.5) {
            mask[y * width + x] = 1;
          }
        }
      }
    }
  }
  const area = Math.max(1, (box.right - box.left) * (box.bottom - box.top));
  const enough = {
    'background-color':      full >= 25,
    fill:                    full >= 25,
    'background-image':      full >= 6,
    'border-color':          full >= 6,
    'outline-color':         full >= 6,
    stroke:                  full >= 6,
    color:                   full >= 4 || (partial >= 12 && strongest >= 0.85),
    'text-decoration-color': full >= 4 || (partial >= 12 && strongest >= 0.85),
    'box-shadow':            full >= 6 || (partial >= 30 && strongest >= 0.5),
  }[property];

  if (alpha === 0) {
    return property === 'background-image' && changed >= 25 ? { mask: shifted, pixels: changed, width, height } : { failed: true, changed };
  }
  if (enough) {
    return { mask, pixels: full + partial, width, height };
  }
  if (property === 'background-color' && alpha === 1 && alike >= Math.max(400, 0.5 * area)) {
    return {
      mask: same, pixels: alike, width, height
    };
  }

  return {
    failed: true, full, partial, strongest: Math.round(strongest * 100) / 100, alike, changed, area
  };
}

function bounds({ mask, width, height }) {
  const box = {
    left: width, top: height, right: 0, bottom: 0
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x]) {
        box.left = Math.min(box.left, x);
        box.top = Math.min(box.top, y);
        box.right = Math.max(box.right, x + 1);
        box.bottom = Math.max(box.bottom, y + 1);
      }
    }
  }

  return box;
}

function eyedropperAt(proof, rect, clip) {
  const { mask, width, height } = proof;
  const scale = Math.round(Math.max(1, clip.width / EYEDROPPER.shownWidth) * 100) / 100;
  const at = (x, y) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] === 1;
  const box = bounds(proof);
  const center = [(box.left + box.right) / 2, (box.top + box.bottom) / 2];
  const step = Math.max(1, Math.floor(Math.sqrt((box.right - box.left) * (box.bottom - box.top) / 4000)));
  let tip = null;
  let tipScore = -Infinity;

  for (let y = box.top; y < box.bottom; y += step) {
    for (let x = box.left; x < box.right; x += step) {
      if (at(x, y)) {
        const depth = [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1], [-1, 1], [1, -1]].filter(([dx, dy]) => at(x + dx, y + dy)).length;
        const score = depth * 1000 - Math.hypot(x - center[0], y - center[1]);

        if (score > tipScore) {
          tip = [x + 0.5, y + 0.5];
          tipScore = score;
        }
      }
    }
  }
  if (!tip) {
    return null;
  }
  const inside = ([x, y]) => x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
  const within = ([x, y], margin) => x >= margin && y >= margin && x <= clip.width - margin && y <= clip.height - margin;
  let best = null;

  for (const [i, angle] of [315, 225, 45, 135, 0, 180, 270, 90].entries()) {
    const dx = Math.cos(angle * Math.PI / 180);
    const dy = Math.sin(angle * Math.PI / 180);
    const swatch = [tip[0] + EYEDROPPER.swatch * scale * dx, tip[1] + EYEDROPPER.swatch * scale * dy];

    if (!within([tip[0] + EYEDROPPER.body * scale * dx, tip[1] + EYEDROPPER.body * scale * dy], 8) || !within(swatch, EYEDROPPER.swatchRadius * scale + 6)) {
      continue;
    }
    let crossing = 0;

    for (let d = 8; d <= EYEDROPPER.body * scale; d += 2) {
      crossing += at(Math.round(tip[0] + d * dx), Math.round(tip[1] + d * dy)) ? 1 : 0;
    }
    const score = crossing * 10 + (inside(swatch) ? 6 : 0) + i * 0.1;

    if (!best || score < best.score) {
      best = { tip, angle, score };
    }
  }

  return best && {
    tip: best.tip, angle: best.angle, scale
  };
}

async function connect() {
  const target = await (await fetch(`${ CDP }/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let id = 0;

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let closed = false;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    if (closed) {
      return reject(new Error('DevTools connection closed'));
    }
    pending.set(++id, { resolve, reject });
    ws.send(JSON.stringify({
      id, method, params
    }));
  });

  ws.onclose = () => {
    closed = true;
    pending.forEach((call) => call.reject(new Error('DevTools connection closed')));
    pending.clear();
  };
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const call = pending.get(message.id);

    if (message.method === 'Page.javascriptDialogOpening') {
      send('Page.handleJavaScriptDialog', { accept: message.params.type === 'beforeunload' });
    } else if (call) {
      pending.delete(message.id);
      if (message.error) {
        call.reject(new Error(message.error.message));
      } else {
        call.resolve(message.result);
      }
    }
  };
  const evaluate = async(fn, ...fnArgs) => {
    const result = await send('Runtime.evaluate', {
      expression: `(${ fn })(...${ JSON.stringify(fnArgs) })`, awaitPromise: true, returnByValue: true
    });

    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }

    return result.result.value;
  };
  const close = async() => {
    ws.close();
    await fetch(`${ CDP }/json/close/${ target.id }`).catch(() => {});
  };

  process.once('SIGINT', async() => {
    await close();
    process.exit(130);
  });

  return {
    send, evaluate, close
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const KEYS = {
  Enter: 13, Escape: 27, Tab: 9, Backspace: 8, Delete: 46, Home: 36, End: 35, PageDown: 34, PageUp: 33, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, ' ': 32
};

async function press(page, combo) {
  const parts = combo.split('+');
  const key = parts.pop() || '+';
  const modifiers = parts.reduce((m, p) => m | ({
    Alt: 1, Control: 2, Meta: 4, Shift: 8
  }[p] || 0), 0);
  const printable = key.length === 1;
  const code = printable ? (/[a-z]/i.test(key) ? `Key${ key.toUpperCase() }` : /\d/.test(key) ? `Digit${ key }` : '') : key;
  const event = {
    key, code, modifiers, windowsVirtualKeyCode: KEYS[key] ?? key.toUpperCase().charCodeAt(0)
  };

  await page.send('Input.dispatchKeyEvent', {
    type: printable && !(modifiers & 6) ? 'keyDown' : 'rawKeyDown', ...event, ...(printable && !(modifiers & 6) ? { text: key } : {})
  });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...event });
}

async function pointAt(page, selector, text) {
  return page.evaluate((s, t) => {
    const el = [...document.querySelectorAll(s)].find((e) => e.checkVisibility() && (!t || e.textContent.trim().includes(t)));

    if (!el) {
      return null;
    }
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();

    return [r.left + r.width / 2, r.top + r.height / 2];
  }, selector, text);
}

async function runStep(page, step, forced, dom) {
  if (step.click || step.hover) {
    const point = await pointAt(page, step.click || step.hover, step.text);

    if (!point) {
      throw new Error(`nothing matches ${ step.click || step.hover }`);
    }
    const [x, y] = point;

    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved', x, y
    });
    if (step.click) {
      await page.send('Input.dispatchMouseEvent', {
        type: 'mousePressed', x, y, button: 'left', clickCount: 1
      });
      await page.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased', x, y, button: 'left', clickCount: 1
      });
    }
    await sleep(step.wait ?? 1000);
  } else if (step.type) {
    await page.send('Input.insertText', { text: step.type });
    await sleep(300);
  } else if (step.key) {
    await press(page, step.key);
    await sleep(step.wait ?? 400);
  } else if (step.force) {
    dom.root ||= (await page.send('DOM.getDocument', { depth: 0 })).root;
    const { nodeIds } = await page.send('DOM.querySelectorAll', { nodeId: dom.root.nodeId, selector: step.force });

    for (const nodeId of step.all ? nodeIds : nodeIds.slice(0, 1)) {
      await page.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [step.state] });
      forced.push(nodeId);
    }
    await sleep(300);
  } else if (step.eval) {
    await page.evaluate((expression) => Promise.resolve((0, eval)(expression)).then(() => true), step.eval);
    await sleep(step.wait ?? 500);
  } else if (step.waitFor) {
    for (let i = 0; i < 30 && !(await page.evaluate((s) => !!document.querySelector(s), step.waitFor)); i++) {
      await sleep(500);
    }
  } else if (step.wait) {
    await sleep(step.wait);
  }
}

async function capture(page, candidate, context, best) {
  const framing = await page.evaluate(frame, candidate.id, candidate.property, candidate.pseudo);

  if (!framing || await themeShown(page) !== context.theme.split(',')[0]) {
    return false;
  }
  await sleep(150);
  const shot = async(format) => Buffer.from((await page.send('Page.captureScreenshot', {
    format, quality: format === 'webp' ? 90 : undefined, clip: framing.clip
  })).data, 'base64');
  const withColor = decodePng(await shot('png'));

  await page.evaluate(hide, candidate.id, candidate.pseudo, HIDE[candidate.property]);
  await sleep(100);
  const without = decodePng(await shot('png'));

  await page.evaluate(hide, candidate.id, candidate.pseudo, null);
  const proof = verify(withColor, without, framing.roi, candidate.color, candidate.property);

  if (DEBUG.includes(candidate.name)) {
    console.log(candidate.name, candidate.property, candidate.element, context.theme, context.how || '', JSON.stringify({ ...proof, mask: undefined }));
  }
  if (proof.failed) {
    return false;
  }
  const eyedropper = eyedropperAt(proof, framing.rect, framing.clip);

  if (!eyedropper) {
    return false;
  }
  const file = `${ candidate.name.slice(2) }.webp`;

  fs.writeFileSync(path.join(OUT, file), await shot('webp'));
  best[candidate.name] = {
    score:    candidate.score,
    file,
    width:    framing.clip.width,
    height:   framing.clip.height,
    page:     context.route,
    how:      context.how || undefined,
    theme:    context.theme,
    element:  candidate.element,
    property: candidate.property,
    pixels:   proof.pixels,
    ...eyedropper,
  };

  return true;
}

async function captureFound(page, found, best, context) {
  let shots = 0;

  for (const candidates of Object.values(found)) {
    for (const candidate of candidates) {
      const tried = `${ candidate.id }|${ candidate.property }|${ candidate.pseudo }|${ context.theme }|${ context.how }`;

      if ((best[candidate.name] && best[candidate.name].score >= candidate.score) || (context.failures[candidate.name] || 0) >= 12) {
        break;
      }
      if (context.tried.has(tried)) {
        continue;
      }
      context.tried.add(tried);
      if (await capture(page, candidate, context, best).catch(() => false)) {
        shots++;
        break;
      }
      context.failures[candidate.name] = (context.failures[candidate.name] || 0) + 1;
    }
  }

  return shots;
}

async function setTheme(page, classes) {
  await page.evaluate((c) => {
    const apply = () => {
      const wanted = c.split(' ');
      const current = ['theme-light', 'theme-dark', 'classic', 'suse'].filter((name) => document.body.classList.contains(name));

      if (current.sort().join(' ') !== [...wanted].sort().join(' ')) {
        document.body.classList.remove('theme-light', 'theme-dark', 'classic', 'suse');
        document.body.classList.add(...wanted);
      }
    };

    window.colorCaptureTheme?.disconnect();
    window.colorCaptureTheme = new MutationObserver(apply);
    window.colorCaptureTheme.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    apply();
  }, classes);
  await sleep(400);
}

async function themeShown(page) {
  const classes = await page.evaluate(() => ['theme-light', 'theme-dark', 'classic', 'suse'].filter((name) => document.body.classList.contains(name)).sort().join(' '));

  return Object.keys(THEMES).find((theme) => THEMES[theme].split(' ').sort().join(' ') === classes);
}

async function load(page, route) {
  await page.send('Page.navigate', { url: `${ APP }${ route }` });
  await sleep(3000);
  for (let i = 0; i < 60; i++) {
    const ready = await page.evaluate(() => document.readyState === 'complete' && !!document.querySelector('main') &&
      ![...document.querySelectorAll('.initial-load-spinner, .loading-indicator, .main-loading, i.icon-spinner')].some((el) => el.checkVisibility())).catch(() => false);

    if (ready) {
      break;
    }
    await sleep(500);
  }
  await sleep(2000);
  if (await page.evaluate(() => /could not be found/.test(document.querySelector('main')?.textContent || ''))) {
    throw new Error(`${ route } could not be found`);
  }
}

async function runScenario(page, scenario, best) {
  const forced = [];
  const dom = {};
  const tried = new Set();
  const failures = {};
  let shots = 0;

  await load(page, scenario.route);
  for (const step of scenario.steps || []) {
    await runStep(page, step, forced, dom);
  }

  for (const theme of scenario.themes || Object.keys(THEMES)) {
    await setTheme(page, THEMES[theme]);
    const context = {
      route: scenario.route, how: scenario.how, theme, tried, failures
    };

    shots += await captureFound(page, await page.evaluate(collect, scenario.scope || null, PROPERTY_WEIGHT), best, context);

    if (!scenario.hover) {
      continue;
    }
    const targets = await page.evaluate((selector) => {
      const seen = new Set();
      let n = 0;

      document.querySelectorAll('[data-hover-target]').forEach((el) => delete el.dataset.hoverTarget);
      for (const el of document.querySelectorAll(selector)) {
        const signature = `${ el.tagName }.${ [...el.classList].sort().join('.') }`;
        const rect = el.getBoundingClientRect();

        if (n < 16 && !seen.has(signature) && rect.width > 0 && rect.right > 0 && rect.left < innerWidth && rect.top < innerHeight && el.checkVisibility()) {
          seen.add(signature);
          el.dataset.hoverTarget = String(n++);
        }
      }

      return n;
    }, HOVER_TARGETS);
    dom.root ||= (await page.send('DOM.getDocument', { depth: 0 })).root;

    for (let i = 0; i < targets; i++) {
      const { nodeId } = await page.send('DOM.querySelector', { nodeId: dom.root.nodeId, selector: `[data-hover-target="${ i }"]` });

      if (!nodeId) {
        continue;
      }
      for (const state of ['hover', 'active', 'focus-visible']) {
        await page.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [state] });
        const element = await page.evaluate((n) => {
          const el = document.querySelector(`[data-hover-target="${ n }"]`);

          return `${ el.tagName.toLowerCase() }${ [...el.classList].filter((c) => !c.startsWith('data-v-')).slice(0, 2).map((c) => `.${ c }`).join('') }`;
        }, i);

        shots += await captureFound(page, await page.evaluate(collect, `[data-hover-target="${ i }"]`, PROPERTY_WEIGHT), best, { ...context, how: `with :${ state } forced on ${ element }` });
        await page.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
      }
    }
  }
  for (const nodeId of forced) {
    await page.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }).catch(() => {});
  }

  return shots;
}

async function main() {
  if (args.list) {
    return console.log([...CRAWL, ...SCENARIOS, ...EXTRA].map((s) => s.name).join('\n'));
  }
  fs.mkdirSync(OUT, { recursive: true });
  const page = await connect();
  const indexFile = path.join(OUT, 'index.json');
  const best = !args.fresh && fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : {};
  let shots = 0;

  try {
    await page.send('Page.enable');
    await page.send('DOM.enable');
    await page.send('CSS.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false
    });
    await page.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }';
        document.head.appendChild(style);
      });`
    });

    for (const scenario of [...CRAWL, ...SCENARIOS, ...EXTRA].filter((s) => !ONLY || ONLY.includes(s.name))) {
      try {
        shots += await runScenario(page, scenario, best);
        fs.writeFileSync(indexFile, `${ JSON.stringify(best, null, 2) }\n`);
      } catch (e) {
        console.error(`${ scenario.name }: ${ e.message }`);
        if (/connection closed/.test(e.message)) {
          throw e;
        }
      }
      console.log(`${ scenario.name }: ${ Object.keys(best).length } primitives so far`);
    }
  } finally {
    await page.close();
  }

  console.log(`${ Object.keys(best).length } primitives found, ${ shots } screenshots taken, written to ${ OUT }`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
