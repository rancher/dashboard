export async function downloadFile(fileName, content, contentType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: contentType });
  const { saveAs } = await import('file-saver');

  return saveAs(blob, fileName);
}

// [{name: 'file1', file: 'data'}, {name: 'file2', file: 'data2'}]
export async function generateZip(files) {
  const JSZip = await import('jszip');

  const zip = new JSZip();

  for ( let i = 0 ; i < files.length ; i++ ) {
    const file = files[i];

    zip.file(file.name, file.file);
  }

  return zip.generateAsync({ type: 'blob' }).then((contents) => {
    return contents;
  });
}
