import { importTypes } from '@ranch/auto-import';

// Init the package
export default function($plugin) {
  // Auto-import model, detail, edit from the folders
  importTypes($plugin);
}
