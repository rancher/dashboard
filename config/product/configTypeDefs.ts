export type HeaderDetails = {
    align?: string;
    canBeVariable?: boolean;
    dashIfEmpty?: boolean;
    default?: string;
    getValue?: Function;
    formatter?: string;
    label?: string;
    labelKey?: string;
    name?: string;
    search?: boolean;
    sort?: string | string[] | boolean;
    value: string | Function;
    width?: number;
  }
export type ConfigureTypeDetails = {
    isCreatable: boolean; // If false, disable create even if schema says it's allowed
    isEditable: boolean; //  Ditto, for edit
    isRemovable?: boolean; // Ditto, for remove/delete
    showState?: boolean; // If false, hide state in columns and masthead
    showAge?: boolean; // If false, hide age in columns and masthead
    showConfigView?: boolean; // If false, hide masthead config button in view mode
    showListMasthead?: boolean; // If false, hide masthead in list view
    canYaml?: boolean; //
    resource?: any; // Use this resource in ResourceDetails instead
    resourceDetail?: any; // Use this resource specifically for ResourceDetail's detail component
    resourceEdit?: any; // Use this resource specifically for ResourceDetail's edit component
    depaginate?: boolean; // Use this to depaginate requests for this type
}

export type ProductDetails = {
    removable: boolean;
    weight: number;
    ifHaveGroup: string;
    icon: string;
    showNamespaceFilter: boolean;
}

export type TypeDetails = {
  icon: string;
  label: string;
  name: string;
  namespaced: boolean;
  route: { name: string };
  weight: number;
}

export type HeaderData = {
    [key: string]: HeaderDetails[];
}

export type TypeConfigurationData = {
    [key: string]: ConfigureTypeDetails;
}

export type WeightData = {
    [key: string]: number
}

export type TypeData = {
    [key: string]: TypeDetails;
}

export type SideNavProductConfig = {
      headers: HeaderData;
      typeConfigurations: TypeConfigurationData;
      basicTypes: string[];
      product: ProductDetails;
      virtualTypes: TypeData;
      weights: WeightData;
  }
