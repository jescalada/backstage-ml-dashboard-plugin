import { createRouteRef } from '@backstage/core-plugin-api';

/**
 * A reference to the root of the my-custom plugin (`/my-custom`).
 */
export const rootRouteRef = createRouteRef({
  id: 'my-custom',
});

/**
 * A reference to the Argo CD page (`/my-custom/argo`).
 */
export const argoRouteRef = createRouteRef({
  id: 'my-custom-argo',
});
