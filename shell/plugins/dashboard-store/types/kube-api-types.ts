import { StateDetails, MapOfStrings } from './rancher-api-types';

export type Metadata = {
    name?: string;
    namespace?: string;
    uid?: string;
    annotations?: MapOfStrings;
    state?: StateDetails;
    resourceVersion?: string;
    ownerReferences?: any;
    relationships?: any[];
}
