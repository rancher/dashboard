import {
  ProductChild, ProductChildGroup, ProductMetadata,
  ProductSinglePage, ProductChildCustomPage, ProductChildResourcePage, ProductChildSpoofedTypePage
} from '@shell/core/plugin-types';

/**
 * Type guard functions for discriminating union types
 * @internal
 */

export function isProductSinglePage(product: ProductMetadata | ProductSinglePage): product is ProductSinglePage {
  return 'component' in product && product.component !== undefined;
}

export function isProductChildGroup(child: ProductChild): child is ProductChildGroup {
  return 'children' in child;
}

export function isProductChildWithComponent(child: ProductChild): child is ProductChildCustomPage {
  return 'component' in child && child.component !== undefined && !isProductChildGroup(child);
}

export function isProductChildWithType(child: ProductChild): child is ProductChildResourcePage {
  return 'type' in child && typeof child.type === 'string' && !isProductChildGroup(child) && !('getInstances' in child);
}

export function isProductChildSpoofed(child: ProductChild): child is ProductChildSpoofedTypePage {
  return 'getInstances' in child && typeof child.getInstances === 'function';
}

export function hasNameProperty(child: ProductChild): child is ProductChild & { name: string } {
  return 'name' in child && typeof child.name === 'string';
}

export function hasTypeProperty(child: ProductChild): child is ProductChild & { type: string } {
  return 'type' in child && typeof child.type === 'string';
}
