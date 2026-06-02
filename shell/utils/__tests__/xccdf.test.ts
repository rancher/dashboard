import { generateXCCDF, generateXCCDFPerNode } from '@shell/utils/xccdf';

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

  it('applies a per-check decoration verbatim when the decoration key matches the check id exactly', () => {
    const xml = generateXCCDF({
      report: {
        ...baseReport,
        results: [{
          id:          '5.1',
          description: 'g',
          checks:      [{
            id: '5.1.1', description: 'exact', scored: true, state: 'pass',
          }],
        }],
      },
      benchmarkVersion: 'cis-1.7',
      decorations:      {
        '5.1.1': {
          ruleId: 'CIS-5.1.1-rule', version: '2024-01', severity: 'high', fixId: 'F-5.1.1', checkId: 'C-5.1.1',
        },
      },
    });

    expect(xml).toContain('id="CIS-5.1.1-rule"');
    expect(xml).toContain('idref="CIS-5.1.1-rule"');
    expect(xml).toMatch(/id="CIS-5\.1\.1-rule"[^>]*severity="high"/);
    expect(xml).toContain('<version>2024-01</version>');
    expect(xml).toContain('fixref="F-5.1.1"');
    expect(xml).toContain('<check system="C-5.1.1">');
  });

  it('applies a group-keyed decoration with a suffix derived from the check id', () => {
    const xml = generateXCCDF({
      report: {
        ...baseReport,
        results: [{
          id:          'V-254553',
          description: 'STIG group',
          checks:      [{
            id: 'V-254553-TLS-apiserver', description: 'STIG check', scored: true, state: 'pass',
          }],
        }],
      },
      benchmarkVersion: 'rke2-stig-1.31',
      decorations:      {
        'V-254553': {
          ruleId: 'SV-254553r1016525_rule', version: 'SV-254553r1016525_rule', severity: 'high', fixId: 'F-254553', checkId: 'C-254553',
        },
      },
    });

    expect(xml).toContain('id="SV-254553r1016525_rule_TLS-apiserver"');
    expect(xml).toContain('idref="SV-254553r1016525_rule_TLS-apiserver"');
    expect(xml).toContain('severity="high"');
    expect(xml).toContain('fixref="F-254553"');
    expect(xml).toContain('<check system="C-254553">');
  });

  it('falls back to the full check id as suffix when the check id does not start with the group id', () => {
    const xml = generateXCCDF({
      report: {
        ...baseReport,
        results: [{
          id:          'group-a',
          description: 'g',
          checks:      [{
            id: 'unrelated-check', description: 'c', scored: true, state: 'pass',
          }],
        }],
      },
      benchmarkVersion: 'cis-1.7',
      decorations:      { 'group-a': { ruleId: 'GROUP-A-rule' } },
    });

    expect(xml).toContain('id="GROUP-A-rule_unrelated-check"');
    expect(xml).toContain('idref="GROUP-A-rule_unrelated-check"');
  });

  it('emits generic XCCDF idents from the decoration with their declared system unchanged', () => {
    const xml = generateXCCDF({
      report: {
        ...baseReport,
        results: [{
          id:          '5.1.1',
          description: 'g',
          checks:      [{
            id: '5.1.1', description: 'c', scored: true, state: 'pass',
          }],
        }],
      },
      benchmarkVersion: 'cis-1.7',
      decorations:      {
        '5.1.1': {
          idents: [
            { system: 'https://www.cisecurity.org/controls/', value: 'CIS-CSC-3' },
            { system: 'http://cyber.mil/cci', value: 'CCI-000366' },
          ],
        },
      },
    });

    expect(xml).toContain('<ident system="https://www.cisecurity.org/controls/">CIS-CSC-3</ident>');
    expect(xml).toContain('<ident system="http://cyber.mil/cci">CCI-000366</ident>');
  });

  it('emits a not-applicable ident placeholder when the decoration has no idents', () => {
    const xml = generateXCCDF({
      report:           baseReport,
      benchmarkVersion: 'cis-1.7',
      decorations:      { '5.1.1': { ruleId: 'r-5.1.1' } },
    });

    expect(xml).toMatch(/id="r-5\.1\.1"[\s\S]*?<ident system="not-applicable">not-applicable<\/ident>/);
  });

  it('falls back to the operator-style rule id when no decoration matches either the check id or the group id', () => {
    const xml = generateXCCDF({
      report:           baseReport,
      benchmarkVersion: 'cis-1.7',
      decorations:      { 'no-match': { ruleId: 'should-not-apply' } },
    });

    expect(xml).toContain('id="xccdf_compliance-operator_rule_5.1.1"');
    expect(xml).not.toContain('should-not-apply');
  });

  it('prefers a per-check decoration over a group-keyed decoration when both are present', () => {
    const xml = generateXCCDF({
      report: {
        ...baseReport,
        results: [{
          id:          '5.1',
          description: 'g',
          checks:      [{
            id: '5.1.1', description: 'c', scored: true, state: 'pass',
          }],
        }],
      },
      benchmarkVersion: 'cis-1.7',
      decorations:      {
        '5.1':   { ruleId: 'group-rule', severity: 'low' },
        '5.1.1': { ruleId: 'check-rule', severity: 'high' },
      },
    });

    expect(xml).toContain('id="check-rule"');
    expect(xml).not.toContain('id="group-rule_5.1.1"');
    expect(xml).toMatch(/id="check-rule"[^>]*severity="high"/);
  });

  it('preserves the operator-style rule id when no decorations are supplied', () => {
    const xml = generateXCCDF({
      report:           baseReport,
      benchmarkVersion: 'cis-1.7',
    });

    expect(xml).toContain('id="xccdf_compliance-operator_rule_5.1.1"');
  });
});

describe('xccdf util: generateXCCDFPerNode', () => {
  const multiNodeReport = {
    version: '1.0',
    total:   3,
    pass:    1,
    nodes:   { master: ['m-1'], node: ['w-1', 'w-2'] },
    results: [{
      id:          '1.1',
      description: 'Master Node Configuration',
      checks:      [{
        id:          '1.1.1',
        description: 'master check',
        scored:      true,
        state:       'pass' as const,
      }],
    }, {
      id:          '4.1',
      description: 'Worker Node Configuration',
      checks:      [{
        id:          '4.1.1',
        description: 'mixed check',
        scored:      true,
        state:       'mixed' as const,
        nodes:       ['w-2'],
      }, {
        id:          '4.1.2',
        description: 'failing check',
        scored:      false,
        state:       'fail' as const,
      }],
    }],
  };

  it('emits a single <target> equal to the hostname', () => {
    const xml = generateXCCDFPerNode({
      report: multiNodeReport, benchmarkVersion: 'cis-1.7', hostname: 'w-1', role: 'node',
    });

    expect(xml).toContain('<target>w-1</target>');
    expect(xml).not.toContain('<target>w-2</target>');
    expect(xml).not.toContain('<target>m-1</target>');
  });

  it('assigns each per-node document a TestResult id suffixed with the hostname so co-loaded files do not collide', () => {
    const a = generateXCCDFPerNode({
      report: multiNodeReport, benchmarkVersion: 'cis-1.7', hostname: 'w-1', role: 'node',
    });
    const b = generateXCCDFPerNode({
      report: multiNodeReport, benchmarkVersion: 'cis-1.7', hostname: 'w-2', role: 'node',
    });

    expect(a).toContain('<TestResult id="xccdf_compliance-operator_testresult_1_w-1"');
    expect(b).toContain('<TestResult id="xccdf_compliance-operator_testresult_1_w-2"');
    expect(a).not.toContain('id="xccdf_compliance-operator_testresult_1_w-2"');
  });

  it('emits every rule from the cluster report regardless of role', () => {
    const workerXml = generateXCCDFPerNode({
      report: multiNodeReport, benchmarkVersion: 'cis-1.7', hostname: 'w-1', role: 'node',
    });
    const masterXml = generateXCCDFPerNode({
      report: multiNodeReport, benchmarkVersion: 'cis-1.7', hostname: 'm-1', role: 'master',
    });

    [workerXml, masterXml].forEach((xml) => {
      expect(xml).toContain('xccdf_compliance-operator_rule_1.1.1');
      expect(xml).toContain('xccdf_compliance-operator_rule_4.1.1');
      expect(xml).toContain('xccdf_compliance-operator_rule_4.1.2');
    });
  });

  it('maps mixed-state checks to fail for dissenting hosts and pass for the rest', () => {
    const dissenter = generateXCCDFPerNode({
      report: multiNodeReport, benchmarkVersion: 'cis-1.7', hostname: 'w-2', role: 'node',
    });
    const compliant = generateXCCDFPerNode({
      report: multiNodeReport, benchmarkVersion: 'cis-1.7', hostname: 'w-1', role: 'node',
    });

    expect(dissenter).toMatch(/idref="xccdf_compliance-operator_rule_4\.1\.1"[\s\S]*?<result>fail<\/result>/);
    expect(compliant).toMatch(/idref="xccdf_compliance-operator_rule_4\.1\.1"[\s\S]*?<result>pass<\/result>/);
  });

  it('treats mixed-state checks with no dissent list as pass for all nodes', () => {
    const report = {
      ...multiNodeReport,
      results: [{
        id:          '4.1',
        description: 'g',
        checks:      [{
          id: '4.1.9', description: 'm', state: 'mixed' as const,
        }],
      }],
    };
    const xml = generateXCCDFPerNode({
      report, benchmarkVersion: 'cis-1.7', hostname: 'w-1', role: 'node',
    });

    expect(xml).toMatch(/idref="xccdf_compliance-operator_rule_4\.1\.9"[\s\S]*?<result>pass<\/result>/);
  });

  it('recomputes pass count per node while preserving cluster total as the scoring denominator', () => {
    const report = {
      version: '1.0',
      total:   2,
      pass:    1,
      nodes:   { node: ['w-1', 'w-2'] },
      results: [{
        id:          '1',
        description: 'g',
        checks:      [
          {
            id: 'a', description: 'a', state: 'pass' as const
          },
          {
            id: 'b', description: 'b', state: 'mixed' as const, nodes: ['w-2'],
          },
        ],
      }],
    };
    const compliant = generateXCCDFPerNode({
      report, benchmarkVersion: 'cis-1.7', hostname: 'w-1', role: 'node',
    });
    const dissenter = generateXCCDFPerNode({
      report, benchmarkVersion: 'cis-1.7', hostname: 'w-2', role: 'node',
    });

    expect(compliant).toMatch(/<score[^>]*>100\.0<\/score>/);
    expect(dissenter).toMatch(/<score[^>]*>50\.0<\/score>/);
  });

  it('preserves full rule metadata (title, fixtext, idents, check) from the cluster report', () => {
    const report = {
      version: '1.0',
      total:   1,
      pass:    1,
      nodes:   { node: ['w-1'] },
      results: [{
        id:          'V-254554',
        description: 'controller manager group',
        checks:      [{
          id:          'V-254554',
          description: 'use-service-account-credentials',
          audit:       '/bin/ps -fC kube-controller-manager',
          remediation: 'set use-service-account-credentials=true',
          scored:      true,
          state:       'pass' as const,
        }],
      }],
    };
    const xml = generateXCCDFPerNode({
      report, benchmarkVersion: 'rke2-stig-1.31-rgs', hostname: 'w-1', role: 'node',
    });

    expect(xml).toContain('<Group id="V-254554">');
    expect(xml).toContain('<check-content>/bin/ps -fC kube-controller-manager</check-content>');
    expect(xml).toContain('set use-service-account-credentials=true');
  });

  it('passes through non-mixed states unchanged', () => {
    const report = {
      ...multiNodeReport,
      results: [{
        id:          '4.1',
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
    const xml = generateXCCDFPerNode({
      report, benchmarkVersion: 'cis-1.7', hostname: 'w-1', role: 'node',
    });

    expect(xml).toContain('<result>pass</result>');
    expect(xml).toContain('<result>fail</result>');
    expect(xml).toContain('<result>notselected</result>');
    expect(xml).toContain('<result>informational</result>');
    expect(xml).toContain('<result>notapplicable</result>');
  });
});
