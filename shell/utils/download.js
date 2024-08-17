import JSZip from 'jszip';

export async function downloadFile(fileName, content, contentType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: contentType });
  const saveAs = (await import('file-saver')).default;

  return saveAs(blob, fileName);
}

// {[fileName1]:data1, [fileName2]:data2}
export function generateZip(files) {
  // Moving this to a dynamic const JSZip = import('jszip') didn't work... figure out later
  const zip = new JSZip();

  for ( const fileName in files) {
    zip.file(fileName, files[fileName]);
  }

  return zip.generateAsync({ type: 'blob' }).then((contents) => {
    return contents;
  });
}

export function downloadUrl(url, id = '__downloadIframe') {
  let iframe = document.getElementById(id);

  if ( !iframe ) {
    iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.id = id;
    document.body.appendChild(iframe);
  }

  iframe.src = url;
}
