# Directory Structure

The directory structure is mostly flat, with each top level dir being for a different important thing (or just required by Nuxt to be there).


## Other commonly changed stuff

| Path       | Used for                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------- |
| assets     | CSS, fonts, images, translations, etc resources which get processed during build                |
| components | All general components which don't have a separate special directory elsewhere                  |
| layouts    | The outermost components for rendering different kinds of pages (Nuxt)                          |
| store      | [Vuex](https://vuex.vuejs.org/) stores which maintain all the state for the life of a page load |
| utils      | Misc parsers, utilities, and other (usually) standalone code that doesn't fit anywhere else     |

## The rest
These are mostly standard Nuxt dirs that you won't need to go into very often.

| Path       | Used for                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| static     | Static files which get directly copied into the build with no processing                                       |
| middleware | Hooks called on every page load                                                                                |
| mixins     | Code that is defined once and then applied to several different other components                               |
| pages      | The structure in here defines the routes that are available, and what gets rendered when one is hit            |
| plugins    | Add-ons to modify vue/nuxt or load additional 3rd-party code.  The "steve" API client also notably lives here. |
| scripts    | Shell scripts for building and related tasks, used by CI and `npm run ...` commands                            |
| server     | Server-side middleware and dev SSL cert                                                                        |
| test       | Unit tests (or lack thereof)                                                                                   |