import { requireBrandMetadata } from '@shell/utils/require-asset';

/**
 * Brand/Theme metadata
 */
export interface BrandMeta {
  // Does the banner have a stylesheet?
  hasStylesheet?: string;
  banner?: {
    // Text alignment for the banner text overlayed on the banner image
    textAlign?: string;
  }
}

/**
 * Get the brand/theme meta information for the specified brand
 *
 * @param brand - The brand identifier
 * @returns Brand meta information or empty object if none available
 */
export function getBrandMeta(brand: string): BrandMeta {
  let brandMeta: BrandMeta = {};

  if (brand) {
    brandMeta = requireBrandMetadata(`~shell/assets/brand/${ brand }/metadata.json`) || {};
  }

  return brandMeta;
}
