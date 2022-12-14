# Storybook

# Dependencies

Storybook requires its own set of dependencies - to avoid interfering with the main dashboard dependencies, it
has its only `package.json` file.

> Note: You still need to run `yarn install` from the top-level folder before running Storybook

# Running Storybook

Run the following:

```
yarn install
cd storybook
yarn install
yarn storybook
```

You can access Storybook at the URL: http://127.0.0.1:6006

## Building Storybook

Run the following:

```
cd storybook
yarn install
yarn build-storybook
```

The build static Storybook site is stored in the top-level `storybook-static` folder.

## Next Steps

- Port design-system pages to Storybook
- Add Typography page (for headers etc and padding and margin classes)
- Write short developer reference for how to document components and write stories
- Build out stories for components
- Auto-build via CI and publish to Github pages ?
- Add some content to the Welcome page
- Get i18n working
- Get store working (where required by a component)

## Useful links

Useful documentation links:

- https://vue-styleguidist.github.io/docs/Documenting.html#code-comments
- https://storybook.js.org/docs/react/writing-docs/doc-blocks#description
- https://github.com/storybookjs/storybook/blob/next/addons/docs/docs/docspage.md
- https://github.com/storybookjs/storybook/tree/master/addons/docs
- https://storybook.js.org/docs/react/essentials/controls
- https://storybook.js.org/docs/react/writing-docs/build-documentation
- https://storybook.js.org/docs/react/writing-docs/doc-blocks
- https://storybook.js.org/docs/react/addons/addons-api