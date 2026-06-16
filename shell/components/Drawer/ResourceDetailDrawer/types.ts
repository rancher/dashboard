export interface YamlProps {
    resource: any;
    yaml: string;
}

export interface ConfigProps {
    resource: any;
    component: any;
    resourceType: string;
    defaultTab?: string;
}

export interface ResourceDetailDrawerProps {
    resource: any;
    defaultTab?: string;
    onClose?: () => void;
}
