# Advanced

## Machine Template Model

Each cluster has one or more Machine Templates, which specify to create a particular number of machines using a specified Machine Config + Cloud Credential.  Basic information about the template is shown later on detail screens, such as the machine size and location.  This is done by providing a model class for your driver's template and overriding methods.

Your model should be called `models/rke-machine.cattle.io.[your driver in lowercase]template.js` (corresponding to the schema that shows up once the driver is installed).  It should extend the generic MachineTemplate and override methods as appropriate:

```javascript
import MachineTemplate from '@shell/models/rke-machine.cattle.io.machinetemplate';

export default class MyDriverMachineTemplate extends MachineTemplate {
  get provider() {
    return 'mydriver';
  }

  get providerLocation() {
    return this.spec.template.spec.zone;
  }

  get providerSize() {
    return this.spec.template.spec.instanceType;
  }
}
```

## Using a Custom Store

If you have several different API calls to make or expensive information that can be cached after it's retrieved once, consider making a `store` with getters and actions to handle making your API calls and managing the caching.  Most of the standard built-in drivers have these.

For more complicated providers (e.g. AWS) you can also consider importing their Javascript SDK and using their client to make calls.  But unless there is an extension point to manipulate the request before they send it, you'll probably have to monkey patch their client to get the `X-Api-CattleAuth-Header` injected and the request sent through the proxy instead of direct to them.  The SDK should also be dynamically `import('…')`ed as needed at runtime so it's not loaded all the time.  Regular `import … as …;` at the top of the file will become part of the basic app bundle js that's always loaded and has to be downloaded before the page can render.  `store/aws.js` has examples of all of this.
