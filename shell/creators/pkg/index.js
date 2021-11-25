import { importTypes } from '@ranch/auto-import';

// Init the package
export default function(router, store, $extension) {
  // Auto-import model, detail, edit from the folders
  importTypes($extension);
}
