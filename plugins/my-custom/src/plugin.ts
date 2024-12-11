import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const myCustomPlugin = createPlugin({
  id: 'my-custom',
  routes: {
    root: rootRouteRef,
  },
});

export const MyCustomPage = myCustomPlugin.provide(
  createRoutableExtension({
    name: 'MyCustomPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
