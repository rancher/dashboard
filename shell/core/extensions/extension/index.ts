import Router, { IRouter } from './router';

export interface ExtensionMetadata {
  name: string;
  version: string;
  description: string;
  icon: string;
}

export interface IExtension {
  id: string;
  name: string;
  description: string;
  metadata: ExtensionMetadata;

  isInitialized: boolean;
  router: IRouter;
}

export class Extension implements IExtension {
  private _isInitialized: boolean = false;
  private _router: Router;
  private _metadata: ExtensionMetadata;

  /**
   * @param metadata - Metadata that can be used by the APIs to do things like namespaces routes if necessary
   * @param app - Gives the API access to the internals of the Vue application
   */
  constructor(metadata: ExtensionMetadata, app: any) {
    this._isInitialized = true;
    this._router = new Router(metadata, app);
    this._metadata = metadata;
  }

  /**
   * @returns the extension id
   */
  get id(): string {
    return this._metadata.name;
  }

  /**
   * @returns the extension name
   */
  get name(): string {
    return this._metadata.name;
  }

  /**
   * @returns the extension description
   */
  get description(): string {
    return this._metadata.description;
  }

  /**
   * @returns the extension metadata {@link @ExtensionMetadata}
   */
  get metadata(): ExtensionMetadata {
    return this._metadata;
  }

  /**
   * @returns a boolean which indicates whether or not the API object has been initialized.
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * @returns an object which implements the IRouter interface
   */
  get router(): IRouter {
    return this._router;
  }

  /**
   * Responsible for doing any post configuration cleanup
   */
  _afterConfiguration() {
  }
}
