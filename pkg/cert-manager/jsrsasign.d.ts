/**
 * jsrsasign ships no type declarations and there is no @types package for it.
 * Only the surface this extension uses is declared here; see utils/csr.ts.
 */
declare module 'jsrsasign' {
  export const KJUR: {
    asn1: {
      csr: {
        CSRUtil: {
          getParam(pem: string): {
            subject?: { str?: string; array?: { type: string; value: string }[][] };
            extreq?: { extname: string; array?: Record<string, string>[] }[];
            sigalg?: string;
          };
        };
      };
    };
  };
}
