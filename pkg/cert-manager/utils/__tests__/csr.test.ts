import { parseCsr } from '../csr';

/**
 * PKCS#10 request for CN=example.com, O=Acme, C=US with
 * SANs DNS:example.com, DNS:www.example.com, IP:10.0.0.1.
 */
const CSR_PEM = `-----BEGIN CERTIFICATE REQUEST-----
MIICtzCCAZ8CAQAwMjEUMBIGA1UEAwwLZXhhbXBsZS5jb20xDTALBgNVBAoMBEFj
bWUxCzAJBgNVBAYTAlVTMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
lw7V6C+0qar/QoPRQyQgyyBeJl6o2M06JFjS5lFpShkxqNi8oUFStmDhoGtd2/1U
ymqxgHEvCSabrjSeeLqaTFaqc99k2mLiGNupGpoLFBG9kZohqByGtP8Y/LuLsKaa
jK3UkzG+Jn4lIrN46Cwi1TyIQOc6LLB76hldQaThqJ8t0C2/uzZYJf2EnzgXUQUj
VjpZ9QObqQEVBOOSdSxaCXm+untlnBRi1l3kzoRe4KgnTFunuAr3qQ4Q/TL2dTwY
bbBKwBwMBBjPLx5m6X/Br4B73ruQIVYZjTw03q+uo63o+Xb5fqoapzQp9Rei6x6G
8Rs7LnU/otnVwCHng4jvEQIDAQABoEAwPgYJKoZIhvcNAQkOMTEwLzAtBgNVHREE
JjAkggtleGFtcGxlLmNvbYIPd3d3LmV4YW1wbGUuY29thwQKAAABMA0GCSqGSIb3
DQEBCwUAA4IBAQB0YrQGxnTr6RHfhZvIcAKlSbGH0nSeLPXcL8Y2VmXqJYJXjhWj
WD6CpSQDQcMgrRVKwNETpwb3ZHTREsrMEVP75NoqFIKlORHWBDYAox8rl5hHHqWv
3U7KhgQG2AiI2eRL5u5M5D4YV0mfjiNhbXvCrpRyUH+hEg+vKAIrp4EQ9DGKmlDP
x28gqeFGLkapMwcEU72w8auL4/THX8jHaTmdS1+DZb9eB66PJSneJx1VUrI0oKiK
y+I6UXoRG6cAUZEAZallFK7ODFJPDnD5h2GY/ej8o4Z2zuc1ioApLVfqq0aJJX8e
xwT/j2ik1pNa2Ex5awHjbgJaaiWVyfglrmoh
-----END CERTIFICATE REQUEST-----`;

const base64 = (value: string) => Buffer.from(value).toString('base64');

describe('parseCsr', () => {
  it('should decode the subject', () => {
    const info = parseCsr(base64(CSR_PEM));

    expect(info?.subject).toBe('/CN=example.com/O=Acme/C=US');
    expect(info?.subjectFields).toStrictEqual([
      { type: 'CN', value: 'example.com' },
      { type: 'O', value: 'Acme' },
      { type: 'C', value: 'US' },
    ]);
  });

  it('should split subject alternative names by kind', () => {
    const info = parseCsr(base64(CSR_PEM));

    expect(info?.dnsNames).toStrictEqual(['example.com', 'www.example.com']);
    expect(info?.ipAddresses).toStrictEqual(['10.0.0.1']);
    expect(info?.uris).toStrictEqual([]);
    expect(info?.emailAddresses).toStrictEqual([]);
  });

  it('should expose the decoded PEM and signature algorithm', () => {
    const info = parseCsr(base64(CSR_PEM));

    expect(info?.pem).toBe(CSR_PEM);
    expect(info?.signatureAlgorithm).toBe('SHA256withRSA');
  });

  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
  ])('should return null for %s', (_label, input) => {
    expect(parseCsr(input)).toBeNull();
  });

  it.each([
    ['plain text', base64('not a certificate request')],
    ['a truncated PEM', base64(CSR_PEM.slice(0, 120))],
    ['input that is not base64 at all', '!!!not base64!!!'],
  ])('should return null rather than throw for %s', (_label, input) => {
    expect(() => parseCsr(input)).not.toThrow();
    expect(parseCsr(input)).toBeNull();
  });
});
