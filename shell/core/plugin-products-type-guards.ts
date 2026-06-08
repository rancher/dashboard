import {
  ProductChild, ProductChildGroup,
  ProductMetadataSinglePage, ProductChildCustomPage, ProductChildResourcePage,
  ProductOptions,
  ProductOptionsSinglePage
} from '@shell/core/plugin-types';

/**
 * Type guard functions for discriminating union types
 * @internal
 */

export function isProductSinglePage(product: ProductOptions | ProductOptionsSinglePage): product is ProductMetadataSinglePage {
  return 'component' in product && product.component !== undefined;
}

export function isProductChildGroup(child: ProductChild): child is ProductChildGroup {
  return 'children' in child;
}

export function isProductChildWithComponent(child: ProductChild): child is ProductChildCustomPage {
  return 'component' in child && child.component !== undefined && !isProductChildGroup(child);
}

export function isProductChildWithType(child: ProductChild): child is ProductChildResourcePage {
  return 'type' in child && typeof child.type === 'string' && !isProductChildGroup(child);
}

export function hasNameProperty(child: ProductChild): child is ProductChild & { name: string } {
  return 'name' in child && typeof child.name === 'string';
}

export function hasTypeProperty(child: ProductChild): child is ProductChild & { type: string } {
  return 'type' in child && typeof child.type === 'string';
}
