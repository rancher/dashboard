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

In order to provision a cluster, we need to provide a [cloud credential](../cloud-credential.md), identically to node driver cloud credentials, and a main [component](./components.md) declared in provisioner.ts.

Inside of that component,you can define UI to provision, edit, view, and import clusters. We recommend breaking down this functionalities into smaller components.

You can read more on folder structure [here](../../folder-structure)