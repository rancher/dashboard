# Localization

Extensive documentation on translations and localizations can be found in the [On-screen Text and Translations](../../code-base-works/on-screen-text-and-translations.md) section. Apart from directory location, the same rules for Rancher Dashboard apply for extensions.

Generating localizations in extensions is done per package via a translation YAML file found in the `./pkg/<extension-name>/l10n` directory. If a translation is not included in the user's selected language, it will fall back to English.
