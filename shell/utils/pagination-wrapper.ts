import paginationUtils from '@shell/utils/pagination-utils';
import { PaginationArgs, PaginationResourceContext } from '@shell/types/store/pagination.types';
import { VuexStore } from '@shell/types/store/vuex';
import { ActionFindPageArgs, ActionFindPageTransientResponse } from '@shell/types/store/dashboard-store.types';
import { STEVE_WATCH_EVENT_TYPES, STEVE_WATCH_MODE } from '@shell/types/store/subscribe.types';
import { Reactive, reactive } from 'vue';
import { STEVE_UNWATCH_EVENT_PARAMS, STEVE_WATCH_EVENT_LISTENER_CALLBACK, STEVE_WATCH_EVENT_PARAMS, STEVE_WATCH_EVENT_PARAMS_COMMON } from '@shell/types/store/subscribe-events.types';
import backOff from '@shell/utils/back-off';
import { SteveRevision } from '@shell/plugins/steve/revision';
import { STEVE_RESPONSE_CODE } from '@shell/types/rancher/steve.api';

interface Args {
  $store: VuexStore,
  /**
   * Unique ID for this request. Used for watch purposes
   */
  id: string,
  /**
   * Args used when determining if this resource type supports SSP
   */
  enabledFor: PaginationResourceContext,
  /**
   * Callback called when the resource is changed (notified by socket)
   */
  onChange?: STEVE_WATCH_EVENT_LISTENER_CALLBACK,

  formatResponse?: {
    /**
     * Convert the response into a model class instance
     */
    classify?: boolean,
    reactive?: boolean,
  }
}

interface Result<T> extends Omit<ActionFindPageTransientResponse<T>, 'data'> {
  data: Reactive<T[]> | T[]
}

/**
 * This is a helper class that will assist in fetching a resource via the new Server-Side Pagination API
 *
 * This is designed to work in places where we don't/can't store the resource in the store
 * - There already exists a resource we don't want to overwrite
 * - We're transient and want something nicer than just `cluster/request` + all the trimmings
 *
 * It ...
 * - Handles if the resource can be fetched by the new pagination api
 * - Makes a request to get a page (including optional classify & reactive)
 * - Provide updates when the resource changes
 */
class PaginationWrapper<T extends object> {
  private $store: VuexStore;
  private enabledFor: PaginationResourceContext;
  private onChange?: STEVE_WATCH_EVENT_LISTENER_CALLBACK;
  public id: string;
  private backOffId: string;
  private classify: boolean;
  private reactive: boolean;
  private cachedRevision?: string;
  private cachedResult?: Result<T>;

  public isEnabled: boolean;
  private steveWatchParams: STEVE_WATCH_EVENT_PARAMS_COMMON | undefined;

  constructor(args: Args) {
    const {
      $store, id, enabledFor, onChange, formatResponse
    } = args;

    this.$store = $store;
    this.id = id;
    this.backOffId = `${ this.id }`;
    this.enabledFor = enabledFor;
    this.onChange = onChange;
    this.classify = formatResponse?.classify || false;
    this.reactive = formatResponse?.reactive || false;

    this.isEnabled = paginationUtils.isEnabled({ rootGetters: $store.getters, $extension: this.$store.$extension }, enabledFor);
  }

  async request(requestArgs: {
    forceWatch?: boolean,
    pagination: PaginationArgs,
    revision?: string,
  }): Promise<Result<T>> {
    const { pagination, forceWatch, revision } = requestArgs;
    const type = this.enabledFor.resource?.id;

    if (!this.isEnabled) {
      throw new Error(`Wrapper for type '${ this.enabledFor.store }/${ type }' in context '${ this.enabledFor.resource?.context }' not supported`);
    }

    const backOffId = this.backOffId;

    const activeRevisionSt = backOff.getBackOff(backOffId)?.metadata.revision;
    const cachedRevisionSt = this.cachedRevision;

    const targetRevision = new SteveRevision(revision);
    const activeRevision = new SteveRevision(activeRevisionSt);
    const cachedRevision = new SteveRevision(cachedRevisionSt);
    const currentRevision = new SteveRevision(activeRevisionSt || cachedRevisionSt);

    // Three cases to support HA scenarios 2 + 3
    // 1. current version is newer than target revision - abort/ignore (don't overwrite new with old)
    // 2. current version in cache is older than target revision - reset previous (drop older requests with older revision, use new revision)
    // 3. current version in cache is same as target revision - we're retrying

    // There are two places we do this to cover the two cases we make http request following socket changes
    // shell/utils/pagination-wrapper.ts - request
    // shell/plugins/steve/subscribe.js - fetchPageResources

    if (currentRevision.isNewerThan(targetRevision)) {
      if (activeRevision.isNewerThan(targetRevision)) {
        // eslint-disable-next-line no-console
        console.info(`Ignoring event listener request to update '${ this.id }' with revision '${ targetRevision.revision }' (newer in-progress revision '${ activeRevision.revision }'). `);

        // Case 1 - abort/ignore (don't overwrite new with old). Specifically we're fetching something with a higher revision, ignore the newer request with older revision
        return Promise.reject(new Error('Ignoring current request in favour of other in-progress request with newer revision')); // This will abort the current batch of updates, meaning the other in-progress can update with the newer revision
      }

      if (cachedRevision.isNewerThan(targetRevision)) {
        // eslint-disable-next-line no-console
        console.info(`Ignoring event listener request to update '${ this.id }' with revision '${ targetRevision.revision }' (newer cached revision '${ cachedRevision.revision }'). `);

        // Case 1 - abort/ignore (don't overwrite new with old). Specifically we're already fetched something with a higher revision, ignore the newer request with older revision and just return the cached version
        if (this.cachedResult) {
          return this.cachedResult;
        }

        return Promise.reject(new Error('Cache has higher revision than target revision... but no cached results?'));
      }
    }

    if (targetRevision.isNewerThan(activeRevision)) {
      // Case 2 - reset previous (drop older requests with older revision, use new revision)

      // eslint-disable-next-line no-console
      console.info(`Dropping event listener request to update '${ this.id }' with revision '${ currentRevision.revision }' (newer target revision '${ targetRevision.revision }'). `);

      backOff.reset(backOffId);
    }

    // Keep making requests until we make one that succeeds, fails with unknown revision or we run out of retries
    const out = await backOff.recurse<any, ActionFindPageTransientResponse<T>>({
      id:              backOffId,
      metadata:        { revision },
      description:     `Fetching resources for ${ type } (wrapper). Initial request, or triggered by web socket`,
      continueOnError: async(err) => {
        // Have we made a request to a stale replica that does not know about the required revision? If so continue to try until we hit a ripe replica
        return err?.status === 400 && err?.code === STEVE_RESPONSE_CODE.UNKNOWN_REVISION;
      },
      delayedFn: async() => {
        const opt: ActionFindPageArgs = {
          watch:     false,
          pagination,
          transient: true,
          revision
        };
        const res: ActionFindPageTransientResponse<T> = await this.$store.dispatch(`${ this.enabledFor.store }/findPage`, { opt, type });

        this.cachedRevision = res.pagination?.result.revision;

        return res;
      },
    });

    if (!out) {
      // Skip
      throw new Error(`Wrapper for type '${ this.enabledFor.store }/${ type }' in context '${ this.enabledFor.resource?.context }' failed to fetch resources`);
    }

    // Watch
    const firstTime = !this.steveWatchParams;

    if (this.onChange && (firstTime || forceWatch) ) {
      this.steveWatchParams = {
        event:  STEVE_WATCH_EVENT_TYPES.CHANGES,
        id:     this.id,
        params: {
          type:  type as string,
          mode:  STEVE_WATCH_MODE.RESOURCE_CHANGES,
          force: forceWatch,
        },

      };

      this.watch();
    }

    // Convert Response
    if (this.classify) {
      out.data = await this.$store.dispatch(`${ this.enabledFor.store }/createMany`, out.data);
    }

    if (this.reactive) {
      this.cachedResult = {
        ...out,
        data: reactive(out.data)
      };
    } else {
      this.cachedResult = out;
    }

    return this.cachedResult;
  }

  private async watch() {
    if (!this.steveWatchParams) {
      console.error('Calling watch but no watch params created'); // eslint-disable-line no-console

      return;
    }
    const watchParams: STEVE_WATCH_EVENT_PARAMS = {
      ...this.steveWatchParams,
      callback: this.onChange as STEVE_WATCH_EVENT_LISTENER_CALLBACK, // we must have onChange by now
    };

    await this.$store.dispatch(`${ this.enabledFor.store }/watchEvent`, watchParams);
  }

  private async unWatch() {
    if (!this.steveWatchParams) {
      // We're unwatching before we've made the initial request
      return;
    }

    const unWatchParams: STEVE_UNWATCH_EVENT_PARAMS = { ...this.steveWatchParams };

    await this.$store.dispatch(`${ this.enabledFor.store }/unwatchEvent`, unWatchParams);
  }

  async onDestroy() {
    await this.unWatch();
  }
}

export default PaginationWrapper;
