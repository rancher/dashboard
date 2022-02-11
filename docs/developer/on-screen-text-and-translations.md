
# On-screen Text and Translations

This page covers Internationalisation (i18n) and localisation (i10n).

## i18n
All on screen text should be localised and implemented in the default `en-US` locale. There are different ways to access localised text

> `t` can be exposed via adding the i18n getter as a computed property with `...mapGetters({ t: 'i18n/t' })`

In HTML

```
<t k="<path to localisation>" />
{{ t("<path to localisation>") }}
```

Many components will also accept a localisation path via a `value-key` property, instead of the translated text in `value`.

In JS

```
this.t('<path to localisation>')
```

A localisation can be checked with

```
this.$store.getters['i18n/exists']('<path to localisation>')

this.$store.getters['i18n/withFallback']('<path to localisation>', null, '<fallback>'))
```

## Using Variables in i18n Paths

In Javascript files, variables in localisation paths must be wrapped in quotation marks when the variable contains a slash.

For example, if we want to dynamically fill in the description of a resource based on its type, we can use a `type` variable when referencing the localisation path to the description:

```
{
  description: this.t(`secret.typeDescriptions.'${ type }'.description`),
}
```

In this case, the quotation marks are required because some Secret types, such as `kubernetes.io/basic-auth`, include a slash.

## i10n 

Localisation files can be found in `./assets/translations/en-us.yaml`.

Please follow precedents in file to determine where new translations should be place.

Form fields are conventionally defined in translations as <some prefix>.<field name>.{label,description,enum options if applicable} e.g.

```
account:
  apiKey:
    description:
      label: Description
      placeholder: Optionally enter a description to help you identify this API Key
```