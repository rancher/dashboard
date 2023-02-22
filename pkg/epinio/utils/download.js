import JSZip from 'jszip';

/**
 * Custom function since we need to append the filetype, we cannot use the one from the exported '@shell/utils/download'
 * @param {*} files {[fileName1]:data1, [fileName2]:data2}
 * @returns
 */
export async function generateZip(files) {
  const zip = new JSZip();

  for ( const fileName in files) {
    zip.file(fileName === 'values' ? `${ fileName }.yml` : `${ fileName }.gz`, files[fileName]);
  }

  const contents = await zip.generateAsync({ type: 'blob' });

  return contents;
}
