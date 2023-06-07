import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import auditLogRoutes from './routes/audit-log-routes';
import './styles/vxe-table.scss';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/product'));

  // Routes
  plugin.addRoutes(auditLogRoutes);
}
