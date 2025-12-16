import { IPlugin, ProductChild, ProductChildGroup, ProductMetadata, ProductChildMetadata, ProductChildPage, ProductSinglePage, ProductChildResource, ResourceTypeConfig } from '@shell/core/types';
import { RouteMeta, RouteRecordRaw, Router } from 'vue-router';
import EmptyProductPage from '@shell/components/EmptyProductPage.vue';
import { DSL, PRODUCT_ALL } from '@shell/store/type-map';

export class PluginResourceType {
  constructor(private type: string, private config: ResourceTypeConfig) {
  };

  apply(plugin: IPlugin, store: any): void {
    // Note: Resource Types are not global and not per-product, so we use a fake product name here as its not used
    //const { basicType, configureType, headers, labelGroup, setGroupDefaultType, virtualType, weightGroup, weightType, product } = plugin.DSL(store, PRODUCT_ALL);

    const {
      product,
      basicType,
      weightType,
      configureType,
      componentForType,
      headers,
      mapType,
      spoofedType,
      virtualType,
    } = DSL(store, PRODUCT_ALL);    

      console.error('Hello');
      console.error(PRODUCT_ALL);

      console.error(this);

      if (this.config.options) {
        configureType(this.type, this.config.options);
      }
      
      if (this.config.listHeaders) {
        console.error('Applying headers for type:', this.type);

        headers(this.type,
          this.config.listHeaders.legacy || [],
          this.config.listHeaders.paginated || []
        );
    };
  }
};
