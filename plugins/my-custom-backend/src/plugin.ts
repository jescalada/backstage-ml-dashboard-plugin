import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { createTodoListService } from './services/TodoListService';
import { createMyDatabaseService } from './services/MyDatabaseService';
import { createMyLoggerService } from './services/MyLoggerService';

/**
 * myCustomPlugin backend plugin
 *
 * @public
 */
export const myCustomPlugin = createBackendPlugin({
  pluginId: 'my-custom',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        catalog: catalogServiceRef,
        database: coreServices.database,
      },
      async init({ logger, auth, httpAuth, httpRouter, catalog, database }) {
        const todoListService = await createTodoListService({
          logger,
          auth,
          catalog,
        });

        const client = await database.getClient();

        const myDatabaseService = createMyDatabaseService(client);
        const myLoggerService = createMyLoggerService(client);

        httpRouter.use(
          await createRouter({
            httpAuth,
            todoListService,
            myDatabaseService,
            myLoggerService,
          }),
        );
      },
    });
  },
});
