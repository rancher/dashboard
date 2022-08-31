# Package Management

NPM Package dependencies can be found in the usual `./package.json` file. There is also `./yarn.lock` which fixes referenced dependency's versions.

Changes to these files should be kept to a minimum to avoid regression for seldom used features (caused by newer dependencies changing and breaking them).

Changes to `./yarn.lock` should be reviewed carefully, specifically to ensure no rogue dependency url is introduced.
