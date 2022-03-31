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

export type ResponseObject = {
    data: any
}
