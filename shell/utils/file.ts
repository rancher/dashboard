/**
 * Reads the contents of a file selected by the user, either as plain text or as
 * a data URL.
 */
export function readFileContents(file: File, asDataUrl = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (ev) => resolve(ev.target?.result as string);
    reader.onerror = (err) => reject(err);

    if (asDataUrl) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}

/**
 * Determines whether a drag event carries files, as opposed to text dragged
 * from elsewhere in the page.
 */
export function isFileDrag(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types || []).includes('Files');
}
