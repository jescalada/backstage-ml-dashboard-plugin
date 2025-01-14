import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { argoRouteRef, rootRouteRef } from './routes';

/**
 * My custom plugin. Takes in references to the routes. The routes are /my-custom and /my-custom/argo.
 */
export const myCustomPlugin = createPlugin({
  id: 'my-custom',
  routes: {
    root: rootRouteRef,
    argo: argoRouteRef,
  },
});

/**
 * The Dashboard page that is routable.
 */
export const MyCustomPage = myCustomPlugin.provide(
  createRoutableExtension({
    name: 'DashboardPage',
    component: () =>
      import('./components/MLDashboardPage').then(m => m.MLDashboardPage),
    mountPoint: rootRouteRef,
  }),
);

/**
 * The Argo plugin dashboard that is routable.
 */
export const ArgoDashboardPage = myCustomPlugin.provide(
  createRoutableExtension({
    name: 'ArgoDashboardPage',
    component: () =>
      import('./components/ArgoDashboard').then(m => m.ArgoDashboardPage),
    mountPoint: argoRouteRef,
  }),
);
