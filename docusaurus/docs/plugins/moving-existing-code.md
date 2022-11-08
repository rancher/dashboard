# Moving Existing Code

During the transition to the new folder structure in 2.6.5 required by the plugin work ...
- Run the script `./scripts/rejig` to move folders to their new location in the `shell` folder and update the appropriate import statements
  Use this to convert older PRs to the new format
- Run the script `./scripts/rejig -d` to move folders to their old location and update imports again
  Use this to convert newer branches to the old format (possibly useful for branches)
  > IMPORTANT - This script contains a `git reset --hard`

## Step 1
The basis of this step 1 is to move the majority of the code under the `shell` folder. Additionally, the top-level `nuxt.config.js` is updated
to extend a base version now located within the `shell` folder. This includes updated nuxt and webpack configuration to get everything working with the
moved folders.

Note that this represents the minimum to get things working - the next step would be to move the Rancher and Harvester code out from the `shell` folder into a number
of UI Package folders under the top-level `pkg` folder. This would then reduce the scope of what's in the `shell` folder to be the core common UI that we would
want to share across our UIs. So, bear in mind, that ultimately, we wouldn't just be moving all of the code under `shell`.

The rework supports a number of use cases, which we will talk through below.
