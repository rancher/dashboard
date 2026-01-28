// Types & Interfaces
export interface FilterRule {
  action: string;
  requestURI: string;
}

export interface RedactionRule {
  headers?: string[];
  paths?: string[];
}

export interface VerbosityDetails {
  headers?: boolean;
  body?: boolean;
}

export interface Verbosity {
  level: number;
  request?: VerbosityDetails;
  response?: VerbosityDetails;
}

export interface AuditPolicy {
  enabled?: boolean;
  verbosity?: Verbosity;
  filters?: FilterRule[];
  additionalRedactions?: RedactionRule[];
}
