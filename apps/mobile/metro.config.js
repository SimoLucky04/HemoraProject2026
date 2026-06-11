// Configurazione Metro per monorepo (npm workspaces + Expo).
// Questa e la parte piu delicata dell'hoisting: Metro deve "vedere" i
// node_modules hoistati alla root del monorepo oltre a quelli locali dell'app,
// e deve osservare i file dei pacchetti condivisi (packages/shared-types).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Osserva tutti i file del monorepo (cosi le modifiche a packages/* sono viste).
config.watchFolders = [monorepoRoot];

// 2. Risolvi i moduli sia dai node_modules dell'app sia da quelli hoistati alla root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Resolution deterministica: non risalire oltre i percorsi indicati sopra.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
