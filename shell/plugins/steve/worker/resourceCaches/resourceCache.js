import axios from 'axios'; // we'll need this to get resourcelists
import { quickHashObj } from '@shell/utils/crypto';
import { NORMAN_NAME } from '@shell/config/labels-annotations';
import { sortableNumericSuffix, multiSorter } from '@shell/utils/sort';
import { stateDisplay, stateSort, colorForState } from '@shell/plugins/dashboard-store/resource-class';
import { ucFirst } from '@shell/utils/string';
import { allHash } from '@shell/utils/promise';
import { multiFieldFilter } from '@shell/utils/array';

const watchStatuses = {
  PENDING:    'pending', // created but not requested of the socket yet
  REQUESTED:  'requested', // requested but not confirmed by the socket yet
  WATCHING:   'watching', // confirmed as active by the socket
  REFRESHING: 'refreshing', // temporarily stopped while we make a full request to the API, will be rewatched afterwards
  CANCELLED:  'cancelled', // has been flagged to send a stop request to the socket
  REMOVED:    'removed' // stop request has been sent to the socket or it's been stopped by the socket itself and is now awaiting cleanup by the maintenanceInterval
};

const cacheStatuses = {
  STARTING: 'starting', // still just spinning up, doesn't have a real status yet
  INACTIVE: 'inactive', // not currently in use, ready to be purged
  ACTIVE:   'active', // currently in use by the UI thread
  REQUIRED: 'required' // not actually in use by the UI thread, but required by another cache
};

// It might be ugly but it's fast
const remapExtraFields = (keys = [], resources = []) => {
  // we make a copy first so we don't accidentally kill the field in the cache
  const resourcesCopy = JSON.parse(JSON.stringify(resources));

  for (let resourceIndex = 0; resourceIndex < resources.length; resourceIndex++) {
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
      delete resourcesCopy[resourceIndex][keys[keyIndex]];
    }
  }

  return resourcesCopy;
};

const waitFor = (testFn) => {
  return new Promise((resolve) => {
    if (testFn()) {
      resolve(this);
    }
    const timeout = setTimeout(() => {
      clearInterval(interval);
      clearTimeout(timeout);
    }, 3000000); // timeout set to 5 minutes (!)
    const interval = setInterval(() => {
      if ( testFn() ) {
        clearInterval(interval);
        clearTimeout(timeout);
        resolve(this);
      }
    }, 100);
  });
};

// ToDo: long-term, it might be preferable to make these caches available to the UI thread to replace our models and/or not even classify resources in VUEX at all and let the various do that as needed in the component
const {
  // PENDING, REQUESTED, WATCHING, REFRESHING, CANCELLED, REMOVED
  WATCHING
} = watchStatuses;
const {
  // STARTING, INACTIVE, ACTIVE, REQUIRED
  STARTING
} = cacheStatuses;

export default class ResourceCache {
  _type;
  #schema;
  _status=STARTING
  #currentPage;
  #pageSize;
  #search;
  #sortBy;
  _cache ={};
  #revision;
  relatedTypes=[];
  _relatedTypeCaches={};
  _requesting=false;

  // a collection of functions we use to map custom fields onto a resource for filtering/sorting purposes, designed to be modified by subclasses
  _extraFields = [];

  // these are closures we use to talk to the worker thread when it needs to know something
  _stopWatch = () => {}; // only used when we're killing the cache altogether
  _startWatch = () => {}; // used after the request kicks off or if I need to heal the subscription by restarting it
  watchStatus = () => {}; // used to look at the status of it's subscription
  _getCacheByType = () => ({}); // gets a resource list from another cache
  #sendResponse = () => {}; // sends a response with a message hash for resolving requests
  #updateBatch = () => {}; // used to passively update outgoing batches, mostly resulting from socket traffic

  // a bunch of hashes that we use to know what's mutated in the cache
  _resourceHashes = {}; // hashes for individual resources
  #lastPayloadHash // hash to check the last payload we sent

  constructor(schema, opt, workerMethods) {
    this._type = schema.id;
    this.#schema = schema;
    this.#currentPage = 1;
    this.#pageSize = opt?.pagination?.pageSize || 0;
    this._resourceHashes = {};
    this._cache = {};
    this._stopWatch = workerMethods.stopWatch || this._stopWatch;
    this._startWatch = workerMethods.startWatch || this._startWatch;
    this.watchStatus = workerMethods.watchStatus || this.watchStatus;
    this._getCacheByType = workerMethods.getCacheByType || this._getCacheByType;
    this.#sendResponse = workerMethods.sendResponse || this.#sendResponse;
    this.#updateBatch = workerMethods.updateBatch || this.#updateBatch;

    // we're gonna do a bit of extra work to have these in an array but that'll let us keep the order they are in which is important
    // ToDo: split this into { name<string>, func<function> } to make the code a bit easier to grok in the "add fields"
    // ToDo: it'd be nice if this were an exportable list of functions so we could use it outside of the caches
    this._extraFields = [
      { creationTimestamp: resource => resource.metadata?.creationTimestamp },
      {
        shortId:           (resource) => {
          const splitId = resource.id.split('/');

          return splitId.length > 1 ? splitId[1] : splitId[0];
        }
      },
      {
        ownersByType: (resource) => {
          const ownerReferences = resource.metadata?.ownerReferences || [];
          const ownersByType = {};

          ownerReferences.forEach((owner) => {
            if (!ownersByType[owner.kind]) {
              ownersByType[owner.kind] = [owner];
            } else {
              ownersByType[owner.kind].push(owner);
            }
          });

          return ownersByType;
        }
      },
      { owners: resource => [] }, // I can't do owners because I need a bunch of resource collections first
      // schema: resource => this.#schema, // commenting out unless I need it for memory
      // typeDisplay: resource => '', // leaving out most labels for right now since they'll most be useful only in the UI thread
      {
        nameDisplay: (resource) => {
          const returnValue = resource.displayName ||
        resource.spec?.displayName ||
        resource.metadata?.annotations?.[NORMAN_NAME] ||
        resource.name ||
        resource.metadata?.name ||
        resource.id;

          return returnValue;
        }
      },
      {
        nameSort:    (resource) => {
          const nameDisplay = resource.nameDisplay;

          return sortableNumericSuffix(nameDisplay).toLowerCase();
        }
      },
      {
        namespacedName: (resource) => {
          const namespace = resource.metadata?.namespace;
          const name = resource.nameDisplay;

          if ( namespace ) {
            return `${ namespace }:${ name }`;
          }

          return name;
        }
      },
      {
        namespacedNameSort: (resource) => {
          const namespacedName = resource.namespacedName;

          return sortableNumericSuffix(namespacedName).toLowerCase();
        }
      },
      // groupByLabel: resource => '',
      { stateObj: resource => resource.metadata?.state },
      { state: resource => resource.metadata?.state?.name || 'unknown' },
      { stateDisplay: resource => stateDisplay(resource.state) },
      {
        stateColor:   (resource) => {
          return colorForState.call(
            resource,
            resource.state,
            resource.stateObj?.error,
            resource.stateObj?.transitioning
          );
        }
      },
      // stateBackground: resource => '',
      // stateIcon: resource => '',
      { stateSort: resource => stateSort(resource.stateColor, resource.stateDisplay) },
      {
        stateDescription: (resource) => {
          const stateObj = resource.stateObj;

          if (stateObj) {
            const { transitioning: trans, error, message } = resource.stateObj;

            return trans || error ? ucFirst(message) : '';
          }
        }
      },
      // details: resource => [];
      // t: resource => {} // it'd be nice to get this one in but have to decouple from store first

    ];

    // ToDo: the constructor itself should kick off it's initial and potentially only query, the worker can observe when it's ready because it's subscription will hit "WATCHING" status
  }

  setStatus(status) {
    this.status = status;

    return this;
  }

  getStatus() {
    return this.status;
  }

  _addExtraField(appendedResource, extraField, index) {
    const [fieldName] = Object.keys(extraField);
    const fieldFunction = extraField[fieldName];

    return {
      ...appendedResource,
      extraFields: {
        ...appendedResource.extraFields,
        [fieldName]: fieldFunction(appendedResource)
      },
      [fieldName]: fieldFunction(appendedResource)
    };
  }

  // otw: it turns the cache into an array for packaging it up in various ways
  get asList() {
    return Object.keys(this._resourceHashes).map(key => this._cache[key]);
  }

  get #totalResources() {
    return Object.keys(this._resourceHashes).length;
  }

  // otw: gets the resource collection from the API
  async makeRequest() {
    const requestParams = {
      url:     this.#schema?.links?.collection,
      headers: { Accept: 'application/json' } // ToDo: should probably make this more complete but it works for now and seems faster
    };

    if (this.watchStatus() !== WATCHING) {
      if (this._requesting) {
        await waitFor(() => {
          return !this._requesting;
        });

        return this;
      } else {
        this._requesting = true;
        const { resourceResponse } = await allHash({
          resourceResponse: axios(requestParams),
          ...(this.relatedTypes.reduce((typesIndex, type) => {
            return {
              ...typesIndex,
              [type]: this._getCacheByType(type).then((res) => {
                this._relatedTypeCaches[type] = res;

                return res;
              })
            };
          }, {}))
        });

        this._requesting = false;

        if (resourceResponse instanceof Error) {
          // ToDo: should probably fire off a message from the worker to the UI to report the error - logging to console all the time just floods the console
          console.error(`error retrieving collection for ${ this._type }`, resourceResponse); // eslint-disable-line no-console

          // ToDo: should record the error in the object itself so we can detect an error state later on
          return this;
        }

        await waitFor(() => {
          return Object.values(this._relatedTypeCaches).every(cache => cache.watchStatus() === WATCHING);
        });

        this.#revision = resourceResponse?.data?.revision;
        (resourceResponse?.data?.data || [])
          .map((resource) => {
            return this._extraFields.reduce(this._addExtraField, { ...resource });
          })
          .forEach((resource) => { // we hash the resource after the extraFields, that's important...
            this._resourceHashes[resource.id] = quickHashObj(resource);
            this._cache[resource.id] = resource;
          });

        return this;
      }
    }

    return this;
  }

  async #refreshRevision() {
    const requestParams = {
      url:     this.#schema?.links?.collection,
      headers: { Accept: 'application/json' }, // ToDo: should probably make this more complete but it works for now and seems faster
      params:  { limit: 1 }
    };

    this.#revision = await axios(requestParams)?.data?.revision;
  }

  // otw: it coordinates the actual getting and setting of the collection
  async getLatest(messageHash) {
    // if we're watching the subscription then we can assume the cache is the latest data so skip the request and send it
    if (this.watchStatus() === WATCHING) {
      return this;
    }

    await this.makeRequest();
    await this.syncCollection(this.#revision); // we only pass in the revision to syncCollection if we're confident in the #revision

    return this; // returning this so we can chain methods like a boss
  }

  // otw: it packages up a message payload and sends it back to the worker to resolve an awaiting message
  #sendLatest(messageHash) {
    // ToDo: there should be two of these, one for a full list that we don't filter/sort/paginate and a paginated payload
    const { page, totalResults } = this.#makePage();
    const updatePayload = {
      list:  remapExtraFields(this._extraFields.map(extraField => Object.keys(extraField)[0]), page),
      total: this.#totalResources,
      totalResults
    };

    const payloadHash = quickHashObj(updatePayload);

    // ToDo: #sendResponse and #updateBatch could be the same closure and the presence of messageHash could be used to direct them in the worker
    // ToDo: currently a logical issue wherein an active page might also be another caches dependency in which case we're only bumping that cache if the update is on the currentPage
    if (messageHash) {
      this.#lastPayloadHash = payloadHash;
      this.#sendResponse(messageHash, updatePayload);
    } else if (payloadHash !== this.#lastPayloadHash) {
      this.#lastPayloadHash = payloadHash;
      this.#updateBatch(updatePayload);
    }
  }

  // otw: it returns a page of results
  #makePage() {
    const sorter = multiSorter((this.#sortBy || 'nameSort'));
    const searchFilter = multiFieldFilter(this.#search || []);
    const indexFrom = this.#pageSize * (this.#currentPage - 1);
    const indexTo = this.#pageSize > 0 ? indexFrom + (this.#pageSize) : this.#totalResources - 1; // if pageSize is zero then we want the whole thing

    const results = this.asList
      .filter(searchFilter);

    const page = results
      .sort(sorter)
      .slice(indexFrom, indexTo);

    return { page, totalResults: results.length }; // ToDo: I'm incorrectly reporting back the results size by just depending on
  }

  // otw: compares the resource it's called with against the existing resource in the cache and updates it if required
  updateResource(resource) {
    const { id } = resource;
    const cachedHash = this._resourceHashes[id];
    const updatedResource = { ...this._extraFields.reduce(this._addExtraField, { ...resource }) };
    // return this._extraFields.reduce(this._addExtraField, { ...resource });
    const updateHash = quickHashObj(updatedResource);

    if (updateHash !== cachedHash) {
      this._resourceHashes[id] = updateHash;
      this._cache[id] = updatedResource;
      this.#sendLatest();
    }
  }

  createResource(resource) {
    const { id } = resource;
    const cachedHash = this._resourceHashes[id];

    // we check to see if the update is real because making a page isn't free
    if (!cachedHash) {
      const updatedResource = { ...this._extraFields.reduce(this._addExtraField, { ...resource }) };

      this._resourceHashes[id] = quickHashObj(updatedResource);
      this._cache[id] = updatedResource;
      this.#sendLatest();
    }
  }

  removeResource(resource) {
    const { id } = resource;
    const cachedHash = this._resourceHashes[id];

    // we check to see if the update is real because making a page isn't free
    if (cachedHash) {
      delete this._resourceHashes[id];
      delete this._cache[id];
      this.#sendLatest();
    }
  }

  bumpCache() {
    this.#sendLatest();
  }

  // otw: it sets paging parameter and fires it down the line
  // public because it lets the worker set these params and get results without having to worry about the request
  async requestPage({
    currentPage, pageSize, search, sortBy
  }, messageHash) {
    this.#currentPage = currentPage;
    this.#pageSize = pageSize;
    this.#search = search;
    this.#sortBy = sortBy;

    await this.getLatest();

    const { page, totalResults } = this.#makePage();

    if (messageHash) {
      this.#sendResponse(messageHash, { list: remapExtraFields(this._extraFields.map(extraField => Object.keys(extraField)[0]), page), total: this.#totalResources });

      return;
    }
    this.#updateBatch({
      list: remapExtraFields(this._extraFields.map(extraField => Object.keys(extraField)[0]), page), total: this.#totalResources, totalResults
    });
  }

  // public void method:
  async requestAll(messageHash) {
    await this.getLatest();
    if (messageHash) {
      this.#sendResponse(messageHash, { list: remapExtraFields(this._extraFields.map(extraField => Object.keys(extraField)[0]), this.asList), total: this.#totalResources });

      return;
    }
    this.#updateBatch({ list: remapExtraFields(this._extraFields.map(extraField => Object.keys(extraField)[0]), this.asList), total: this.#totalResources });
  }

  getById(id) {
    return this._cache[id]; // ToDo: should I strip out the extraFields? This one's not really used outside of schemas so I don't have to worry too much about it right now.
  }

  // public because the watcher in the worker needs to be able to kick this off if it decides if the watch needs to be killed and/or started
  // otw: it gets an updated revision before kicking off the watch again if the revision isn't passed in.
  async syncCollection(rev) {
    const { revision } = await rev ? { revision: rev } : this.#refreshRevision().data;

    this.#revision = revision; // ToDo: there's an edgecase somewhere where "this" gets lost
    this._startWatch(revision);
    await waitFor(() => {
      return this.watchStatus() === WATCHING;
    });

    return this;
  }
}
