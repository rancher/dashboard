# Extension Structure

A typical hosted provider extension has the following file structure:

```
pkg/
└── <provisioner-name>/
    ├── index.ts                # Plugin entry point
    ├── provisioner.ts          # The provisioner class definition
    ├── package.json            # Extension metadata
    ├── icon.svg                # Icon for the provider
    ├── cloud-credential/
    │   └── <provisioner-name>.vue  # Component for cloud credentials
    └── components/
        └── Cru<ProvisionerName>.vue # Main component for create/edit/import
```

In order to provision a cluster, we need to provide a [cloud credential](../cloud-credential.md), which matches how it is done for node drivers, and a main [component](../hosted-provider/components.md) declared in provisioner.ts.
```ts
  get component(): Component {
    return Cru<PROVISIONER_NAME>;
  }
```
Inside of that component, you can define the behavior for provisioning, edit, view, and import. We recommend breaking down this functionalities into smaller components.