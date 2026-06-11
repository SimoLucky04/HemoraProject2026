import { registerRootComponent } from 'expo';

import App from './App';

// In un monorepo Expo l'entry di default (node_modules/expo/AppEntry.js) usa un
// path relativo che, con l'hoisting dei node_modules alla root, non punta piu a
// questa app. Registriamo il root component esplicitamente: e robusto a
// prescindere da dove venga installato il pacchetto `expo`.
registerRootComponent(App);
