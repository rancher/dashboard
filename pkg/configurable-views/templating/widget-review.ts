// What an admin should know about a widget Liz wrote before approving it: which of Rancher's
// components it draws with, and where it built something by hand or reached outside what it is given.
//
// A reading aid, not a gate - the approval is. Pure: reads the source as text.

/** The components a generated widget is given (see WidgetGenerated), by the names it uses. */
export const GENERATED_COMPONENT_NAMES = [
  'Loading', 'SubtleLink', 'Card', 'SimpleBox', 'Banner', 'BadgeState', 'Tag', 'RcCounterBadge', 'LabelValue',
  'SortableTable', 'StatusSummaryCard', 'StatusBreakdownCard', 'StatusBar', 'PercentageBar', 'ConsumptionGauge',
  'CountGauge',
] as const;

export type GeneratedComponentName = typeof GENERATED_COMPONENT_NAMES[number];

/** Something worth a second look, by a key the approval page words. */
export type ReviewFinding =
  | 'unknownComponent' | 'rawTable' | 'handBar' | 'hardColour' | 'muchCss' | 'outsideApi' | 'imports';

export interface WidgetReview {
  /** Rancher's components it uses. */
  components: string[];
  /** Components it uses that it is not given - they would not draw. */
  unknown: string[];
  findings: ReviewFinding[];
}

/** A top-level block's content - up to its LAST closing tag, as a template nests <template> slots. */
function block(source: string, tag: string): string {
  const open = source.match(new RegExp(`<${ tag }[^>]*>`));
  const close = source.lastIndexOf(`</${ tag }>`);

  return open?.index !== undefined && close > open.index ? source.slice(open.index + open[0].length, close) : '';
}

export function reviewWidget(source: string): WidgetReview {
  const template = block(source, 'template');
  const script = block(source, 'script');
  const style = block(source, 'style');

  // PascalCase tags are components; plain HTML tags are lowercase
  const tags = [...new Set([...template.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map((m) => m[1]))];
  const allowed = new Set<string>(GENERATED_COMPONENT_NAMES);
  const components = tags.filter((tag) => allowed.has(tag));
  const unknown = tags.filter((tag) => !allowed.has(tag));

  const findings: ReviewFinding[] = [];

  if (unknown.length) {
    findings.push('unknownComponent');
  }
  if (/<table\b/i.test(template)) {
    findings.push('rawTable');
  }
  // A bar drawn by hand: an element given a width in percent
  if (/width\s*:\s*[^;"'}]*%|width\s*:\s*[\w.$?\[\]]+\s*\+\s*['"]%|width\s*:\s*`[^`]*%/.test(template + style)) {
    findings.push('handBar');
  }
  if (/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(template + style)) {
    findings.push('hardColour');
  }
  if (style.split('\n').filter((line) => line.trim()).length > 40) {
    findings.push('muchCss');
  }
  if (/\bthis\.\$(store|router|route)\b|\bfetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|document\.cookie|window\.location/.test(script)) {
    findings.push('outsideApi');
  }
  if (/^\s*import\s+(?![^;]*from\s+['"]vue['"])/m.test(script)) {
    findings.push('imports');
  }

  return {
    components, unknown, findings
  };
}
