import { ExtensionMetadata, IExtension, Extension } from './index';

export type RegisterFn = (metadata: ExtensionMetadata) => IExtension;
export type ConfigureFn = (registerMetadata: RegisterFn) => Promise<void>

export class ExtensionProvider {
    app: any;

    constructor(app: any) {
      this.app = app;
    }

    async create(configureFn: ConfigureFn) {
      // Typescript can't know that the extension was set within the configureFn so this type conversion is necessary because TS will think api is never assigned
      let extension: Extension = null as unknown as Extension;
      let called = false;

      await configureFn((metadata: ExtensionMetadata) => {
        if (called) {
          throw new Error(`The RegisterFn has already been called once for the ${ metadata.name } extension`);
        }

        called = true;
        extension = new Extension(metadata, this.app);

        return extension;
      });

      extension._afterConfiguration();

      return extension;
    }
}
