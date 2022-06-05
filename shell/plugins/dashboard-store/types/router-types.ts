export type DetailLocation = {
    name: string;
    params: {
        product: any;
        cluster: any;
        resource: string;
        namespace?: string;
        id?: string;
    };
    query?: any;
}
