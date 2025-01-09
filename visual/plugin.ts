import fs from 'node:fs/promises'
import * as fs1 from 'fs'
import path from 'node:path'
import chalk from 'chalk'
import {diffImageToSnapshot} from 'jest-image-snapshot/src/diff-snapshot'
import {MATCH, RECORD, CHECKSNAP} from './constants'
import type {DiffSnapshotResult, SnapshotOptions} from './types'

/**
 * Add this function in `setupNodeEvents` inside cypress.config.ts
 *
 * Required
 * @type {Cypress.PluginConfig}
 */
export const addMatchImageSnapshotPlugin = (on: Cypress.PluginEvents) => {
  on('after:screenshot', runImageDiffAfterScreenshot)
  on('task', {
    [MATCH]: setOptions,
    [RECORD]: getSnapshotResult,
    [CHECKSNAP]: checkSnapshotExistence,
  })
}

// prevent the plugin running for general screenshots that aren't
// triggered by `matchImageSnapshot`
let isSnapshotActive = false

let options = {} as SnapshotOptions
const setOptions = (commandOptions: SnapshotOptions) => {
  isSnapshotActive = true
  options = commandOptions
  return null
}

const PNG_EXT = '.png'
const SNAP_EXT = `.snap`
const SNAP_PNG_EXT = `${SNAP_EXT}${PNG_EXT}`
const DIFF_EXT = `.diff${PNG_EXT}`
const DEFAULT_DIFF_DIR = '__diff_output__'

let snapshotResult = {} as DiffSnapshotResult
const getSnapshotResult = () => {
  isSnapshotActive = false
  return snapshotResult
}

const checkSnapshotExistence = ({
  screenshotName,
  options,
}: {
  screenshotName: string
  options: SnapshotOptions
}) => {
  const {
    specFileName,
    specRelativeFolder,
    extraFolders,
    screenshotsFolder,
    isUpdateSnapshots,
    customSnapshotsDir,
  } = options
  const snapshotName = screenshotName.replace(/ \(attempt [0-9]+\)/, '')

  const snapshotsDir = customSnapshotsDir
    ? path.join(process.cwd(), customSnapshotsDir, specFileName)
    : path.join(
        screenshotsFolder,
        '..',
        'snapshots',
        specRelativeFolder,
        '..',
        extraFolders,
        specFileName,
      )

  const snapshotDotPath = path.join(
    snapshotsDir,
    `${snapshotName}${SNAP_PNG_EXT}`,
  )
  return isUpdateSnapshots || fs1.existsSync(snapshotDotPath)
}

const runImageDiffAfterScreenshot = async (
  screenshotConfig: Cypress.ScreenshotDetails,
) => {
  const {path: screenshotPath} = screenshotConfig
  //if screenshot command timeout,
  //cypress will throw an error and isSnapshotActive will never be set to false
  //so as additional contion we can check that screenshotConfig.name is set
  if (!isSnapshotActive || screenshotConfig.name === undefined) {
    return {path: screenshotPath}
  }

  // name of the screenshot without the Cypress suffixes for test failures
  const snapshotName = screenshotConfig.name.replace(/ \(attempt [0-9]+\)/, '')

  const receivedImageBuffer = await fs.readFile(screenshotPath)
  await fs.rm(screenshotPath)

  const {
    specFileName,
    specRelativeFolder,
    extraFolders,
    currentTestTitle,
    screenshotsFolder,
    isUpdateSnapshots,
    customSnapshotsDir,
    customDiffDir,
  } = options

  const snapshotsDir = customSnapshotsDir
    ? path.join(process.cwd(), customSnapshotsDir, specFileName)
    : path.join(
        screenshotsFolder,
        '..',
        'snapshots',
        specRelativeFolder,
        '..',
        extraFolders,
        specFileName,
      )

  const snapshotDotPath = path.join(
    snapshotsDir,
    `${snapshotName}${SNAP_PNG_EXT}`,
  )

  const diffDir = customDiffDir
    ? path.join(process.cwd(), customDiffDir, specFileName)
    : path.join(snapshotsDir, DEFAULT_DIFF_DIR)

  const diffDotPath = path.join(diffDir, `${snapshotName}${DIFF_EXT}`)

  //since the snpashot method is called multiple time until it passes
  //we need to delete previous diff otherwise the git repo will wrongly be in a modified state
  if (fs1.existsSync(diffDotPath)) {
    await fs.rm(diffDotPath)
  }

  logTestName(currentTestTitle)
  log('options', options)
  log('paths', {
    screenshotPath,
    snapshotsDir,
    diffDir,
    diffDotPath,
    specFileName,
    snapshotName,
    snapshotDotPath,
  })

  snapshotResult = diffImageToSnapshot({
    ...options,
    snapshotsDir,
    diffDir,
    receivedImageBuffer,
    snapshotIdentifier: snapshotName + SNAP_EXT,
    updateSnapshot: isUpdateSnapshots,
  })
  log(
    'result from diffImageToSnapshot',
    (() => {
      const {imgSrcString, ...rest} = snapshotResult
      return rest
    })(),
  )

  const {pass, added, updated, diffOutputPath} = snapshotResult

  if (!pass && !added && !updated) {
    log('image did not match')

    await fs.copyFile(diffOutputPath, diffDotPath)
    await fs.rm(diffOutputPath)

    snapshotResult.diffOutputPath = diffDotPath

    log(`screenshot write to ${diffDotPath}...`)
    return {
      path: diffDotPath,
    }
  }

  if (pass) {
    log('snapshot matches')
  }
  if (added) {
    log('new snapshot generated')
  }
  if (updated) {
    log('snapshot updated with new version')
  }

  snapshotResult.diffOutputPath = snapshotDotPath

  log('screenshot write to snapshotDotPath')
  return {
    path: snapshotDotPath,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const log = (...message: any) => {
  if (options.isSnapshotDebug) {
    console.log(chalk.blueBright.bold('matchImageSnapshot: '), ...message)
  }
}

const logTestName = (name: string) => {
  log(chalk.yellow.bold(name))
}
