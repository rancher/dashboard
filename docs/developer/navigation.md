
# Navigation

## Products & Side Nav

Products are top level features that are reached via the header top left menu. Some are built in (`Cluster Explorer`, `Apps & Marketplace`, `Users & Authentication`) and some are enabled after installing the required helm charts via `Apps & Marketplace` (see 'Rancher' charts in the `Charts` page ).

Configuration for each product can be found in `/config/product`. These define the product itself, menu items in side nav, spoofed types, etc. These settings are stored in the `type-map` section of the store and manipulated with functions in `/store/type-map.js`. Some stand out functions include

- `basicType` - Defines a type or group of types that will show in the side nav
-  `weightGroup`/`weightType` - Set the position of the group/tye for this product. Pay attention to the `forBasic` boolean which should be true if the menu item is classed as basic.
- `configureType` - Provider/Override UI features for the type (is creatable, show state in header/table, etc). These are accessible via the `type-map/optionsFor` action

> There's some docs for these functions are the top of the `type-map.js` file

## Virtual and Spoofed Resource Types

The side nav is populated by resource types that have been applied to the current product. Virtual Types are a way to add additional menu items. These are purely for adding navigation and do not support tables or details views. Examples of virtual types can be found by searching for `virtualType`. For instance the `Users & Authentication` product has a virtual type of 'config' to show the `Auth Providers` page.

Spoofed Types, like virtual types, add menu items but also define a spoofed schema and a `getInstances` function. The latter provides a list of objects of the spoofed type. This allows the app to then make use of the generic list, detail, edit, etc pages used for standard types.

> Any resources returned by `getInstances` should have a `kind` matching required type. This results in the tables showing the correct actions, handling create/edit, etc.
