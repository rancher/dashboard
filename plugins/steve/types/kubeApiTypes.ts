import { StateDetails } from '~/plugins/steve/types/rancherApiTypes';
import { MapOfStrings } from './rancherApiTypes';

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
