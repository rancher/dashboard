import { create } from 'xmlbuilder2';

const XCCDF_NS = 'http://checklists.nist.gov/xccdf/1.2';
const ID_PREFIX = 'xccdf_compliance-operator';
const BENCHMARK_ID_SUFFIX = 'benchmark_kubernetes';
const TEST_RESULT_ID_SUFFIX = 'testresult_1';
const SCORING_SYSTEM = 'urn:xccdf:scoring:default';
const CHECK_SYSTEM = 'urn:xccdf:check:manual';
const NA = 'not-applicable';

export interface XccdfReportCheck {
  id?: string;
  description?: string;
  remediation?: string;
  audit?: string;
  scored?: boolean;
  state?: string;
  nodes?: string[];
  // eslint-disable-next-line camelcase
  node_type?: string[];
  // eslint-disable-next-line camelcase
  actual_value_per_node?: Record<string, string>;
}

export interface XccdfReportGroup {
  id?: string;
  description?: string;
  checks?: XccdfReportCheck[];
}

export interface XccdfReport {
  version?: string;
  total?: number;
  pass?: number;
  nodes?: Record<string, string[]>;
  results?: XccdfReportGroup[];
}

export interface BenchmarkMetadata {
  benchmarkId?: string;
  title?: string;
  clusterName?: string;
  contributor?: string;
  creator?: string;
  description?: string;
  frontMatter?: string;
  notice?: string;
  noticeId?: string;
  plainText?: string;
  plainTextId?: string;
  platform?: string;
  publisher?: string;
  rearMatter?: string;
  referenceHref?: string;
  referenceTitle?: string;
  referenceType?: string;
  referenceSubject?: string;
  referenceIdentifier?: string;
  checkHref?: string;
  checkName?: string;
  source?: string;
}

export interface CheckDecoration {
  ruleId?: string;
  version?: string;
  severity?: string;
  fixId?: string;
  checkId?: string;
  /** Generic XCCDF idents — STIG populates with CCIs, CIS with control IDs, etc. */
  idents?: { system: string; value: string }[];
}

export type CheckDecorations = Record<string, CheckDecoration>;

export interface XccdfTargetFact {
  name: string;
  type: string;
  value: string;
}

export interface GenerateXccdfArgs {
  report: XccdfReport;
  benchmarkVersion: string;
  metadata?: BenchmarkMetadata;
  decorations?: CheckDecorations;
  targetAddresses?: string[];
  targetFacts?: XccdfTargetFact[];
  /** Override the cluster name used for the <target> element. Falls back to metadata.clusterName, then derived node names. */
  clusterName?: string;
  /** Override the TestResult @id. Required when multiple documents from the same benchmark will be co-loaded into a validator. */
  testResultId?: string;
}

const na = (s?: string): string => (s && s.length > 0 ? s : NA);

const safeId = (s: string): string => s.replace(/ /g, '_');

const ruleIdFor = (checkId: string): string => `${ ID_PREFIX }_rule_${ safeId(checkId) }`;

const fixIdFor = (checkId: string): string => `${ ruleIdFor(checkId) }_fix`;

const profileIdFor = (benchmarkVersion: string): string => `${ ID_PREFIX }_profile_${ safeId(benchmarkVersion) }`;

const effectiveRuleId = (decoration: CheckDecoration, groupId: string, checkId: string, hitGroupKey: boolean): string => {
  if (!decoration.ruleId) {
    return ruleIdFor(checkId);
  }
  if (!hitGroupKey) {
    return decoration.ruleId;
  }
  const suffix = checkId.startsWith(`${ groupId }-`) ? checkId.slice(groupId.length + 1) : checkId;

  return `${ decoration.ruleId }_${ suffix }`;
};

const lookupDecoration = (decorations: CheckDecorations, groupId: string, checkId: string): { decoration: CheckDecoration; hitGroupKey: boolean } => {
  if (decorations[checkId]) {
    return { decoration: decorations[checkId], hitGroupKey: false };
  }
  if (decorations[groupId]) {
    return { decoration: decorations[groupId], hitGroupKey: true };
  }

  return { decoration: {}, hitGroupKey: false };
};

const mapResult = (state?: string): string => {
  switch ((state || '').toLowerCase()) {
  case 'pass': return 'pass';
  case 'fail': return 'fail';
  case 'skip': return 'notselected';
  case 'notapplicable': return 'notapplicable';
  case 'warn': return 'informational';
  default: return 'informational';
  }
};

const severityFor = (scored?: boolean): string => (scored ? 'medium' : 'low');

const decorationSeverity = (sev: string | undefined, scored?: boolean): string => sev || severityFor(scored);

const ruleWeight = (scored?: boolean): string => (scored ? '10' : '0');

const ruleRole = (scored?: boolean): string => (scored ? 'full' : 'unscored');

const decorationIdents = (idents?: { system: string; value: string }[]): { system: string; value: string }[] => {
  if (!idents || idents.length === 0) {
    return [{ system: NA, value: NA }];
  }

  return idents;
};

const collectTargets = (report: XccdfReport): string[] => {
  const seen = new Set<string>();
  const targets: string[] = [];
  const nodes = report.nodes || {};

  Object.values(nodes).forEach((list) => {
    (list || []).forEach((n) => {
      if (!seen.has(n)) {
        seen.add(n);
        targets.push(n);
      }
    });
  });

  return targets.length > 0 ? targets : [NA];
};

const collectTargetAddresses = (addresses?: string[]): string[] => {
  return addresses && addresses.length > 0 ? addresses : [NA];
};

const collectTargetFacts = (facts?: XccdfTargetFact[]): XccdfTargetFact[] => {
  return facts && facts.length > 0 ? facts : [{
    name: NA, type: 'string', value: NA
  }];
};

export function generateXCCDF({
  report,
  benchmarkVersion,
  metadata = {},
  decorations = {},
  targetAddresses,
  targetFacts,
  clusterName,
  testResultId,
}: GenerateXccdfArgs): string {
  const now = new Date();
  const timeStr = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const dateStr = timeStr.slice(0, 10);

  const benchmarkId = metadata.benchmarkId || `${ ID_PREFIX }_${ BENCHMARK_ID_SUFFIX }`;
  const benchmarkTitle = metadata.title || `Kubernetes CIS Benchmark ${ benchmarkVersion }`;

  const doc = create({ version: '1.0', encoding: 'UTF-8' });
  const benchmark = doc.ele('Benchmark', {
    xmlns:      XCCDF_NS,
    id:         benchmarkId,
    resolved:   '1',
    'xml:lang': 'en',
    style:      '',
  });

  benchmark.ele('status', { date: dateStr }).txt('complete');
  benchmark.ele('title').txt(benchmarkTitle);
  benchmark.ele('description').txt(na(metadata.description));
  benchmark.ele('notice', { id: na(metadata.noticeId) }).txt(na(metadata.notice));
  benchmark.ele('front-matter').txt(na(metadata.frontMatter));
  benchmark.ele('rear-matter').txt(na(metadata.rearMatter));

  const ref = benchmark.ele('reference', { href: na(metadata.referenceHref) });

  ref.ele('publisher').txt(na(metadata.publisher));
  ref.ele('source').txt(na(metadata.source));

  benchmark.ele('plain-text', { id: na(metadata.plainTextId) }).txt(na(metadata.plainText));
  benchmark.ele('platform', { idref: na(metadata.platform) });
  benchmark.ele('version').txt(na(report.version));

  const meta = benchmark.ele('metadata');

  meta.ele('creator').txt(na(metadata.creator));
  meta.ele('publisher').txt(na(metadata.publisher));
  meta.ele('contributor').txt(na(metadata.contributor));
  meta.ele('source').txt(na(metadata.source));

  benchmark.ele('model', { system: SCORING_SYSTEM });

  const profile = benchmark.ele('Profile', { id: profileIdFor(benchmarkVersion) });

  profile.ele('title').txt(benchmarkTitle);
  profile.ele('description').txt(na(metadata.description));

  const ruleResults: { check: XccdfReportCheck; effectiveId: string; decoration: CheckDecoration }[] = [];
  const groups = report.results || [];

  groups.forEach((group) => {
    const g = benchmark.ele('Group', { id: na(group.id) });

    g.ele('title').txt(na(group.description));
    g.ele('description').txt(na(group.description));

    (group.checks || []).forEach((check) => {
      const checkId = check.id || '';
      const groupId = group.id || '';
      const { decoration, hitGroupKey } = lookupDecoration(decorations, groupId, checkId);
      const effectiveId = effectiveRuleId(decoration, groupId, checkId, hitGroupKey);
      const ruleFixId = decoration.fixId || fixIdFor(checkId);
      const ruleCheckSystem = decoration.checkId || CHECK_SYSTEM;
      const checkHref = na(metadata.checkHref);
      const checkName = na(metadata.checkName);

      const rule = g.ele('Rule', {
        id:       effectiveId,
        selected: 'true',
        weight:   ruleWeight(check.scored),
        role:     ruleRole(check.scored),
        severity: decorationSeverity(decoration.severity, check.scored),
      });

      rule.ele('version').txt(na(decoration.version));
      rule.ele('title').txt(na(`${ checkId } ${ check.description || '' }`));
      rule.ele('description').txt(na(check.description));

      const ruleRef = rule.ele('reference');

      ruleRef.ele('title').txt(na(metadata.referenceTitle));
      ruleRef.ele('subject').txt(na(metadata.referenceSubject));
      ruleRef.ele('publisher').txt(na(metadata.publisher));
      ruleRef.ele('type').txt(na(metadata.referenceType));
      ruleRef.ele('identifier').txt(na(metadata.referenceIdentifier));

      decorationIdents(decoration.idents).forEach((ident) => {
        rule.ele('ident', { system: ident.system }).txt(ident.value);
      });

      rule.ele('fixtext', { fixref: ruleFixId }).txt(na(check.remediation));
      rule.ele('fix', { id: ruleFixId });

      const ruleCheck = rule.ele('check', { system: ruleCheckSystem });

      ruleCheck.ele('check-content-ref', { name: checkName, href: checkHref });
      ruleCheck.ele('check-content').txt(na(check.audit));

      ruleResults.push({
        check, effectiveId, decoration
      });
    });
  });

  if (groups.length === 0) {
    const g = benchmark.ele('Group', { id: NA });

    g.ele('title').txt(NA);
    g.ele('description').txt(NA);
  }

  const total = report.total || 0;
  const pass = report.pass || 0;
  const scoreStr = total > 0 ? ((pass / total) * 100).toFixed(1) : '0.0';

  const targets = clusterName ? [clusterName] : metadata.clusterName ? [metadata.clusterName] : collectTargets(report);

  const testResult = benchmark.ele('TestResult', {
    id:            testResultId || `${ ID_PREFIX }_${ TEST_RESULT_ID_SUFFIX }`,
    'start-time':  timeStr,
    'end-time':    timeStr,
    version:       benchmarkVersion,
    'test-system': ID_PREFIX,
  });

  testResult.ele('benchmark', { href: `#${ benchmarkId }`, id: benchmarkId });
  testResult.ele('title').txt(benchmarkTitle);
  testResult.ele('identity', { authenticated: 'true', privileged: 'true' }).txt('compliance-scan-serviceaccount');

  targets.forEach((t) => testResult.ele('target').txt(t));
  collectTargetAddresses(targetAddresses).forEach((a) => testResult.ele('target-address').txt(a));

  const facts = testResult.ele('target-facts');

  collectTargetFacts(targetFacts).forEach((f) => {
    facts.ele('fact', { name: f.name, type: f.type }).txt(f.value);
  });

  testResult.ele('platform', { idref: na(metadata.platform) });

  if (ruleResults.length === 0) {
    const rr = testResult.ele('rule-result', {
      idref:    NA,
      role:     NA,
      time:     timeStr,
      severity: NA,
      version:  NA,
      weight:   NA,
    });

    rr.ele('ident', { system: NA }).txt(NA);
    rr.ele('result').txt(NA);
    const rrCheck = rr.ele('check', { system: NA });

    rrCheck.ele('check-content-ref', { name: NA, href: NA });
    rrCheck.ele('check-content').txt(NA);
  } else {
    ruleResults.forEach(({ check, effectiveId, decoration }) => {
      const ruleCheckSystem = decoration.checkId || CHECK_SYSTEM;
      const checkHref = na(metadata.checkHref);
      const checkName = na(metadata.checkName);

      const rr = testResult.ele('rule-result', {
        idref:    effectiveId,
        role:     ruleRole(check.scored),
        time:     timeStr,
        severity: decorationSeverity(decoration.severity, check.scored),
        version:  na(decoration.version),
        weight:   ruleWeight(check.scored),
      });

      decorationIdents(decoration.idents).forEach((ident) => {
        rr.ele('ident', { system: ident.system }).txt(ident.value);
      });
      rr.ele('result').txt(mapResult(check.state));
      const rrCheck = rr.ele('check', { system: ruleCheckSystem });

      rrCheck.ele('check-content-ref', { name: checkName, href: checkHref });
      rrCheck.ele('check-content').txt(na(check.audit));
    });
  }

  testResult.ele('score', { system: SCORING_SYSTEM, maximum: '100.0' }).txt(scoreStr);

  return doc.end({ prettyPrint: true });
}

export interface GenerateXccdfPerNodeArgs extends Omit<GenerateXccdfArgs, 'clusterName' | 'targetAddresses' | 'targetFacts'> {
  hostname: string;
  role: string;
}

const remapCheckForNode = (check: XccdfReportCheck, hostname: string): XccdfReportCheck => {
  const isMixed = (check.state || '').toLowerCase() === 'mixed';
  const state = isMixed ? ((check.nodes || []).includes(hostname) ? 'fail' : 'pass') : check.state;

  return { ...check, state };
};

export function generateXCCDFPerNode(args: GenerateXccdfPerNodeArgs): string {
  const {
    report, hostname, role, ...rest
  } = args;

  const perNodeResults: XccdfReportGroup[] = (report.results || []).map((group) => ({
    ...group,
    checks: (group.checks || []).map((c) => remapCheckForNode(c, hostname)),
  }));

  const passForNode = perNodeResults
    .flatMap((g) => g.checks || [])
    .filter((c) => (c.state || '').toLowerCase() === 'pass').length;

  return generateXCCDF({
    ...rest,
    report: {
      ...report,
      results: perNodeResults,
      pass:    passForNode,
      nodes:   { [role]: [hostname] },
    },
    clusterName:  hostname,
    testResultId: `${ ID_PREFIX }_${ TEST_RESULT_ID_SUFFIX }_${ safeId(hostname) }`,
  });
}
