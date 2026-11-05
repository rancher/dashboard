import { KJUR } from 'jsrsasign';
import { base64Decode } from '@shell/utils/crypto';

export interface CsrInfo {
  /** PEM text, for display and copy-to-clipboard. */
  pem: string;
  /** Distinguished name, e.g. `/CN=example.com/O=Acme`. */
  subject: string;
  subjectFields: { type: string; value: string }[];
  dnsNames: string[];
  ipAddresses: string[];
  uris: string[];
  emailAddresses: string[];
  signatureAlgorithm?: string;
}

const SAN_KEYS: Record<string, keyof Pick<CsrInfo, 'dnsNames' | 'ipAddresses' | 'uris' | 'emailAddresses'>> = {
  dns:    'dnsNames',
  ip:     'ipAddresses',
  uri:    'uris',
  rfc822: 'emailAddresses',
};

/**
 * Decode a `spec.request` (base64-encoded PKCS#10 PEM) into something displayable.
 * Returns null for absent or unparseable input - a malformed CSR must never break the page.
 */
export function parseCsr(request?: string): CsrInfo | null {
  if (!request) {
    return null;
  }

  try {
    const pem = base64Decode(request);
    const parsed: any = KJUR.asn1.csr.CSRUtil.getParam(pem);
    const info: CsrInfo = {
      pem,
      subject:            parsed.subject?.str || '',
      subjectFields:      (parsed.subject?.array || []).flat().map(({ type, value }: any) => ({ type, value })),
      dnsNames:           [],
      ipAddresses:        [],
      uris:               [],
      emailAddresses:     [],
      signatureAlgorithm: parsed.sigalg,
    };

    const san = (parsed.extreq || []).find((ext: any) => ext.extname === 'subjectAltName');

    (san?.array || []).forEach((entry: any) => {
      Object.entries(entry).forEach(([key, value]) => {
        const field = SAN_KEYS[key];

        if (field) {
          info[field].push(value as string);
        }
      });
    });

    return info;
  } catch {
    return null;
  }
}
