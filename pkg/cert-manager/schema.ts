/**
 * The parts of the cert-manager API this extension reads. Not exhaustive - fields we only ever
 * round-trip through the YAML editor are deliberately left off.
 * https://cert-manager.io/docs/reference/api-docs/
 */
import { Condition } from './utils/conditions';
import { IssuerRef } from './utils/issuer-ref';

export interface CertificateSpec {
  secretName?: string;
  issuerRef?: IssuerRef;
  commonName?: string;
  dnsNames?: string[];
  ipAddresses?: string[];
  uris?: string[];
  emailAddresses?: string[];
  duration?: string;
  renewBefore?: string;
  isCA?: boolean;
  usages?: string[];
  privateKey?: {
    algorithm?: string;
    size?: number;
    encoding?: string;
    rotationPolicy?: string;
  };
}

export interface CertificateStatus {
  conditions?: Condition[];
  notBefore?: string;
  notAfter?: string;
  renewalTime?: string;
  revision?: number;
  failedIssuanceAttempts?: number;
  lastFailureTime?: string;
  nextPrivateKeySecretName?: string;
}

export interface AcmeSolver {
  selector?: {
    dnsZones?: string[];
    dnsNames?: string[];
    matchLabels?: Record<string, string>;
  };
  http01?: {
    ingress?: { ingressClassName?: string; class?: string; name?: string; serviceType?: string };
    [key: string]: any;
  };
  /** Keyed by provider name, e.g. `cloudflare`. Contents are provider specific. */
  dns01?: Record<string, any>;
}

export interface AcmeIssuerConfig {
  server?: string;
  email?: string;
  preferredChain?: string;
  skipTLSVerify?: boolean;
  privateKeySecretRef?: { name?: string; key?: string };
  solvers?: AcmeSolver[];
}

export interface IssuerSpec {
  acme?: AcmeIssuerConfig;
  ca?: { secretName?: string };
  selfSigned?: Record<string, any>;
  vault?: { server?: string; path?: string; [key: string]: any };
  venafi?: Record<string, any>;
}

export interface IssuerStatus {
  conditions?: Condition[];
  acme?: { uri?: string; lastRegisteredEmail?: string };
}

export interface CertificateRequestSpec {
  /** base64-encoded PKCS#10 PEM. */
  request?: string;
  issuerRef?: IssuerRef;
  duration?: string;
  isCA?: boolean;
  usages?: string[];
}

export interface CertificateRequestStatus {
  conditions?: Condition[];
  certificate?: string;
  ca?: string;
  failureTime?: string;
}

export interface OrderSpec {
  request?: string;
  issuerRef?: IssuerRef;
  commonName?: string;
  dnsNames?: string[];
}

export interface OrderStatus {
  state?: string;
  reason?: string;
  url?: string;
  finalizeURL?: string;
  certificate?: string;
  failureTime?: string;
  authorizations?: {
    identifier?: string;
    wildcard?: boolean;
    url?: string;
    challenges?: { type?: string }[];
  }[];
}

export interface ChallengeSpec {
  url?: string;
  authorizationURL?: string;
  dnsName?: string;
  wildcard?: boolean;
  type?: string;
  token?: string;
  key?: string;
  solver?: AcmeSolver;
  issuerRef?: IssuerRef;
}

export interface ChallengeStatus {
  state?: string;
  reason?: string;
  processing?: boolean;
  presented?: boolean;
}
