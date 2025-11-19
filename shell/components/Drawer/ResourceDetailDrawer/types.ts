export interface YamlProps {
    resource: any;
    yaml: string;
}

export interface ConfigProps {
    resource: any;
    component: any;
    resourceType: string;
}

export interface ResourceDetailDrawerProps {
    resource: any;

    onClose?: () => void;
}
