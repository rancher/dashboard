
/**
 * Type guard functions for discriminating union types
 * @internal
 */

import {
  ProductChild, ProductChildCustomPage, ProductChildGroup, ProductChildResourcePage, ProductMetadataAdd, ProductMetadataSinglePage
} from '@shell/core/plugin-products-external';
import { ProductMetadataAddInternal } from '@shell/core/plugin-products-internal';

export function isProductConfigInternal(product: ProductMetadataAdd | ProductMetadataSinglePage): product is ProductMetadataAddInternal {
  const props = ['category', 'hideNamespaceLocation', 'version', 'renameGroups', 'moveToGroup', 'ignoreGroups'];

  return props.some((prop) => prop in product);
}

export function isProductSinglePage(product: ProductMetadataAdd | ProductMetadataSinglePage): product is ProductMetadataSinglePage {
  return 'component' in product && product.component !== undefined;
}

export function isProductAdd(product: ProductMetadataAdd | ProductMetadataSinglePage): product is ProductMetadataAdd {
  return !('component' in product && product.component !== undefined);
}

export function isProductChildGroup(child: ProductChild): child is ProductChildGroup {
  return child.resourceMenu !== undefined && 'children' in child.resourceMenu;
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
