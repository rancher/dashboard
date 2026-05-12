import { generateXCCDF } from '@shell/utils/xccdf';

describe('xccdf util: generateXCCDF', () => {
  const baseReport = {
    version: '1.0',
    total:   2,
    pass:    1,
    nodes:   { master: ['node-a'], node: ['node-b'] },
    results: [{
      id:          '5.1',
      description: 'RBAC and Service Accounts',
      checks:      [{
        id:          '5.1.1',
        description: 'Ensure that the cluster-admin role is only used where required',
        audit:       'kubectl get clusterrolebindings',
        remediation: 'Identify all clusterrolebindings to the cluster-admin role',
        scored:      true,
        state:       'pass',
      }, {
        id:          '5.1.2',
        description: 'Minimize access to secrets',
        audit:       'kubectl get roles',
        remediation: 'Where possible, remove get, list and watch access to Secret objects',
        scored:      false,
        state:       'fail',
      }],
    }],
  };

  it('produces an XML document with an XML header and a Benchmark root', () => {
    const xml = generateXCCDF({ report: baseReport, benchmarkVersion: 'cis-1.7' });

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain('<Benchmark');
    expect(xml).toContain('xmlns="http://checklists.nist.gov/xccdf/1.2"');
    expect(xml).toContain('id="xccdf_compliance-operator_benchmark_kubernetes"');
  });

  it('uses the metadata title when provided, otherwise falls back to a CIS title from benchmarkVersion', () => {
    const fallback = generateXCCDF({ report: baseReport, benchmarkVersion: 'cis-1.7' });

    expect(fallback).toContain('<title>Kubernetes CIS Benchmark cis-1.7</title>');

    const withTitle = generateXCCDF({
      report:           baseReport,
      benchmarkVersion: 'cis-1.7',
      metadata:         { title: 'Custom Benchmark Title' },
    });

    expect(withTitle).toContain('<title>Custom Benchmark Title</title>');
  });

  it('emits one Group per result and one Rule per check', () => {
    const xml = generateXCCDF({ report: baseReport, benchmarkVersion: 'cis-1.7' });

    expect(xml).toContain('<Group id="5.1">');
    expect(xml).toContain('id="xccdf_compliance-operator_rule_5.1.1"');
    expect(xml).toContain('id="xccdf_compliance-operator_rule_5.1.2"');
  });

  it('maps state values to XCCDF result strings', () => {
    const report = {
      ...baseReport,
      results: [{
        id:          '1',
        description: 'g',
        checks:      [
          {
            id: 'a', description: 'a', state: 'pass' as const
          },
          {
            id: 'b', description: 'b', state: 'fail' as const
          },
          {
            id: 'c', description: 'c', state: 'skip' as const
          },
          {
            id: 'd', description: 'd', state: 'warn' as const
          },
          {
            id: 'e', description: 'e', state: 'notApplicable' as const
          },
        ],
      }],
    };

    const xml = generateXCCDF({ report, benchmarkVersion: 'cis-1.7' });

    expect(xml).toContain('<result>pass</result>');
    expect(xml).toContain('<result>fail</result>');
    expect(xml).toContain('<result>notselected</result>');
    expect(xml).toContain('<result>informational</result>');
    expect(xml).toContain('<result>notapplicable</result>');
  });

  it('marks scored checks with severity=medium and weight=10; unscored as low and 0', () => {
    const xml = generateXCCDF({ report: baseReport, benchmarkVersion: 'cis-1.7' });

    expect(xml).toMatch(/id="xccdf_compliance-operator_rule_5\.1\.1"[^>]*severity="medium"/);
    expect(xml).toMatch(/id="xccdf_compliance-operator_rule_5\.1\.1"[^>]*weight="10"/);
    expect(xml).toMatch(/id="xccdf_compliance-operator_rule_5\.1\.2"[^>]*severity="low"/);
    expect(xml).toMatch(/id="xccdf_compliance-operator_rule_5\.1\.2"[^>]*weight="0"/);
  });

  it('computes score as pass/total*100, formatted to one decimal', () => {
    const xml = generateXCCDF({ report: baseReport, benchmarkVersion: 'cis-1.7' });

    expect(xml).toMatch(/<score[^>]*maximum="100\.0"[^>]*>50\.0<\/score>/);
  });

  it('returns score 0.0 when total is 0', () => {
    const xml = generateXCCDF({
      report: {
        ...baseReport, total: 0, pass: 0, results: [],
      },
      benchmarkVersion: 'cis-1.7',
    });

    expect(xml).toMatch(/<score[^>]*>0\.0<\/score>/);
  });

  it('uses report.nodes for <target> elements when no clusterName is set', () => {
    const xml = generateXCCDF({ report: baseReport, benchmarkVersion: 'cis-1.7' });

    expect(xml).toContain('<target>node-a</target>');
    expect(xml).toContain('<target>node-b</target>');
  });

  it('clusterName argument overrides metadata.clusterName and node-derived targets', () => {
    const xml = generateXCCDF({
      report:           baseReport,
      benchmarkVersion: 'cis-1.7',
      metadata:         { clusterName: 'from-metadata' },
      clusterName:      'from-arg',
    });

    expect(xml).toContain('<target>from-arg</target>');
    expect(xml).not.toContain('<target>from-metadata</target>');
    expect(xml).not.toContain('<target>node-a</target>');
  });

  it('falls back to "not-applicable" for missing target addresses and target facts', () => {
    const xml = generateXCCDF({ report: baseReport, benchmarkVersion: 'cis-1.7' });

    expect(xml).toContain('<target-address>not-applicable</target-address>');
    expect(xml).toContain('<fact name="not-applicable" type="string">not-applicable</fact>');
  });

  it('emits a single placeholder Group when results is empty', () => {
    const xml = generateXCCDF({
      report: {
        version: '1.0', total: 0, pass: 0, results: [],
      },
      benchmarkVersion: 'cis-1.7',
    });

    expect(xml).toContain('<Group id="not-applicable">');
  });

  it('uses STIG metadata to override rule id, version, severity, fix, check system, and CCI idents', () => {
    const xml = generateXCCDF({
      report: {
        ...baseReport,
        results: [{
          id:          'g1',
          description: 'g',
          checks:      [{
            id: 'V-254553-TLS-apiserver', description: 'STIG check', scored: true, state: 'pass',
          }],
        }],
      },
      benchmarkVersion: 'rke2-stig-1.31',
      stigChecks:       {
        'V-254553': {
          ruleId: 'SV-254553r1016525_rule', version: 'SV-254553r1016525_rule', severity: 'high', fixId: 'F-254553', checkId: 'C-254553', cci: ['CCI-000366'],
        },
      },
    });

    expect(xml).toContain('idref="SV-254553r1016525_rule_TLS-apiserver"');
    expect(xml).toContain('severity="high"');
    expect(xml).toContain('<ident system="http://cyber.mil/cci">CCI-000366</ident>');
    expect(xml).toContain('fixref="F-254553"');
    expect(xml).toContain('<check system="C-254553">');
  });

  it('preserves the operator-style rule id when there is no STIG metadata', () => {
    const xml = generateXCCDF({
      report:           baseReport,
      benchmarkVersion: 'cis-1.7',
    });

    expect(xml).toContain('id="xccdf_compliance-operator_rule_5.1.1"');
  });
});
