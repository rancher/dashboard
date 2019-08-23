import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function downloadFile(fileName, content, contentType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: contentType });

  saveAs(blob, fileName);
}

// [{name: 'file1', file: 'data'}, {name: 'file2', file: 'data2'}]
export function generateZip(files) {
  const zip = new JSZip();

  for ( let i = 0 ; i < files.length ; i++ ) {
    const file = files[i];

    zip.file(file.name, file.file);
  }

  return zip.generateAsync({ type: 'blob' }).then((contents) => {
    return contents;
  });
}
