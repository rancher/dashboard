import Resource from '~/plugins/steve/resource-class';

export type State = {
    color: string;
    icon: string;
}
export interface MapOfStrings {
    [key: string]: string;
}

export interface MapOfNumbers {
    [key: string]: number;
}

export type StateInfoForTypes = {
    info: string[];
    error: string[],
    success: string[],
    warning: string[],
    unknown: string[]
}

export type StateList = {
    [index: string]: State;
}

export const enum StateColor {
    info = 'info',
    error = 'error',
    success = 'success',
    warning = 'warning',
    unknown = 'unknown'
}

export type Context = {
    getters: any,
    rootGetters: any,
    dispatch: any,
    state: any,
    rootState: any
}

export type Metadata = {
    name?: string;
    namespace?: string;
    uid?: string;
    annotations?: MapOfStrings;
    state?: {
        transitioning?: boolean;
        error?: boolean;
        message?: string;
    };
    resourceVersion?: string;
    ownerReferences?: any;
    relationships?: any;
}

export type DetailLocation = {
    name: string;
    params: {
        product: any;
        cluster: any;
        resource: string;
        namespace: string | undefined;
        id: string;
    };
    query?: any;
}

export type RehydrateObject = {
    value: string,
    enumerable: boolean,
    configurable: boolean
}

export type CloneObject = {
    value: boolean,
    enumerable: boolean,
    configurable: boolean,
    writable: boolean
}

export interface ResourceProperties {
    // Allows constructor to work by setting anything in data
    // as a property in the Resource class
    [index: string]: any;
    __clone?: CloneObject;
    __rehydrate?: RehydrateObject;
}

export type HttpRequest = {
    ignoreFields?: string[];
    urlSuffix?: string;
    url?: string;
    method?: string;
    headers?: {
        'content-type'?: string;
        accept?: string;
    };
    data?: any;
}

export type CustomValidationRule = {
    nullable: boolean;
    path: string;
    requiredIf: string;
    validators: string[];
    type: string;
    translationKey?: string;
}

export type OwnerReferenceContent = {
    key: string;
    row: Resource;
    col: any;
    value: string;
}

export type ResourceDetails = {
    label: string;
    formatter: string;
    content: any;
    formatterOpts?: {
        addSuffix?: boolean;
    };
}
