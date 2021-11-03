# Create/Edit Forms

# Standard Create/Edit Form Architecture

The reusable CruResource component and its mixins were created to solve a problem particular to Kubernetes resource management. In older Rancher versions, Rancher sometimes restricted fields from being edited or added form validation in Norman, the backend API that predated Steve. Originally, Norman was designed to restrict users from editing resources in the Kubernetes cluster directly so that Norman could control how resources were configured.

But in modern DevOps, many users want the ability to automate their workflows with GitOps, which usually requires tracking all of the YAML files for Kubernetes resources in a Git repository, and also requires users to be able to edit resources through config files instead of only manipulating them through the UI.

The problem was that when Rancher exposed access to Kubernetes clusters directly, users could not only access Kubernetes resources through Norman, but they could also edit the resource’s YAML config files and bypass the restrictions that Norman could impose.

Rancher’s reusable forms are intended to be flexible enough to allow YAML files to be created and edited through the Rancher UI, while also providing form validation for those files at the same time. The reusability also allows Rancher to quickly adapt to new Kubernetes custom resources that are introduced for Helm chart apps that are not primarily developed in-house, such as the monitoring and logging applications.

# Creating a New Create/Edit Form for a Resource

This section describes the workflow for creating forms to create or edit resources in Rancher. We recommend using the CruResource component for create/edit forms because it is designed to handle resource that can also be managed through YAML config files, with process automated through GitOps.

You will need to create a file for the create/edit form. For normal Kubernetes resources, this file should be located in the `@/components/edit` directory. For projects maintained in non-Rancher repositories, all files related to that project should be kept in a product-specific folder in `/products`.

The file will need these imports:
```
import CreateEditView from '@/mixins/create-edit-view/impl';
// An example types file 
import { EPINIO_TYPES } from '@/products/epinio/types';
import { exceptionToErrorsArray } from '@/utils/error';
import CruResource from '@/components/CruResource.vue';

```

The edit component takes a `value` as a prop. This value is created for all /edit components by calling the store to get a new instance of a resource using the resource’s class model. This allows the component to access any prop or method on the resource model by taking it from the newly instantiated value. The value is then passed into CruResource using the`resource` prop.

The CruResource component takes a few important props, such as `save` and `done`, that you don’t have to pass in manually because they are automatically made available from the `CreateEditView` mixin:

- The `save` method from CreateEditView cleans the data. It also populates `exceptionToErrorsArray`, which controls validation errors for the form as a whole. In other words, these validation errors don’t appear next to individual fields, but they each appear at the bottom of the form after the submit button is clicked, and each error includes the name of the field that has a problem. Note: In order to improve the user experience in the future, we are moving toward individual field validation errors that appear as soon as the user types or selects incorrect input. Where possible, you should add pre-submit form validation to input components such as LabeledInput and LabeledSelect. Ideally, the button to submit the form should be disabled by default until the entire form is valid, and no errors should appear next to inputs that haven’t been touched.
- `done` is used to redirect the user after the form is successfully submitted.
- `actuallySave` makes the asynchronous API call to create the resource and it gets the appropriate API route from the resource schema itself. So in this way, the `save` method is reused across many create/edit forms, while the API route called to save the resource is still configured at the resource level. However, any method for managing a resource, including `save`, can be overridden by adding methods of the same name to the resource’s class model.

# Alternative Create/Edit Forms 
This section describes how to make create/edit forms without CruResource or the CreateEditView mixin.

There may be a situation where you need to make a create/edit form that doesn’t automatically get the resource value passed into it because the component is located outside of the same `/edit` folder as the other create/edit forms. In this case, you will need to manually create the skeleton resource from a class model and use that as the form value so that the methods passed into AsyncButton have access to enough information to save the resource.

There may be a situation where you need Rancher to create and edit data that is not a Kubernetes resource. But even in this situation, we recommend using the same basic architecture as is used for saving Kubernetes resources. The reason is that many users want to automate their workflows with GitOps, and they want to be able to manipulate data with both config files and with forms in the Rancher UI. This means that even if it is not currently possible to manage the resource in YAML, that ability may be added later because of the industry’s overarching need for automation and GitOps. The new Rancher UI will need to be able to consistently support GitOps workflows.

A custom create component would typically need at least these imports:

```
import AsyncButton from '@/components/AsyncButton';
import { _CREATE } from '@/config/query-params';
import { EPINIO_TYPES } from '@/products/epinio/types';
import { exceptionToErrorsArray } from '@/utils/error';
```

The AsyncButton should be used to save the resource, and it will show a loading message if the resource takes time to be saved. The below example shows a minimal usage of AsyncButton:

```
<AsyncButton
  :disabled="!validationPassed"
  :mode="mode"
  @click="onSubmit"
/>
```

You can maintain the form validation state in `data()`:

```
data() {
    return {
      errors:           [],
      value:           { name: '' },
      submitted:       false,
      mode:            _CREATE
    };
  },
```

You will also need to provide the resource schema so that it can be used by `save()` to create the resource by calling the appropriate back end route for creating the resource.

When a skeleton resource is not passed into your create/edit form as a value, you can create the new resource instance with a `dispatch` to the store as soon as the form is rendered. Then you can use it as the initial value for your form. An example of calling the store to create the initial resource value is below:

```
this.value = await this.$store.dispatch(`epinio/create`, { type: EPINIO_TYPES.NAMESPACE });
```

When the resource is saved, it should call a `save` method. This can be the `save`defined in the CreateEditView mixin, or it can be a `save` method defined on the resource model, which overrides the mixin:

```
onSubmit() {
  try {
    this.value.save();
    this.close();
  } catch (e) {
    this.errors = exceptionToErrorsArray(e);
  }
},
```

Whichever implementation of `save()` is used, it will need to call `_save()` on the resource. That `_save` method is defined on the root `resource-class` model, which every other model extends.

Note:

When creating a non-standard flow for creating or editing a resource, you may want to ask Lauren to review the design and makes sure it follows the Storybook documentation for how components are meant to be used.
