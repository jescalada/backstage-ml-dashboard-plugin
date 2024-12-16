import { Knex } from 'knex';
import { Model, Task } from './types';

export function createMyDatabaseService(client: Knex) {
  /**
   * Ensure the tasks table exists in the database
   * If it does not exist, create it
   *
   * @returns Promise<void>
   */
  async function ensureTasksTableExists() {
    const hasTable = await client.schema.hasTable('tasks');
    if (!hasTable) {
      await client.schema.createTable('tasks', table => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.integer('user_id').unsigned().references('users.id');
        table.timestamp('completion_time').nullable();
      });
      await populateTasksTable();
    }
  }

  async function ensureUsersTableExists() {
    const hasTable = await client.schema.hasTable('users');
    if (!hasTable) {
      await client.schema.createTable('users', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
      });
      await populateUsersTable();
    }
  }

  async function ensureModelsTableExists() {
    const hasTable = await client.schema.hasTable('models');
    if (!hasTable) {
      await client.schema.createTable('models', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('version').notNullable();
        table.string('description');
        table.string('model_uri').notNullable();
        table.timestamp('registered_at').defaultTo(client.fn.now());
      });
      await populateModelsTable();
    }
  }

  /**
   * Populate the tasks table with some dummy data
   */
  async function populateTasksTable() {
    const tasks = [
      {
        title: 'Complete project documentation',
        user_id: 1,
        completion_time: new Date('2024-01-15'),
      },
      {
        title: 'Review pull requests',
        user_id: 2,
        completion_time: null,
      },
      {
        title: 'Deploy to production',
        user_id: 3,
        completion_time: new Date('2024-01-10'),
      },
      {
        title: 'Update dependencies',
        user_id: 1,
        completion_time: null,
      },
      {
        title: 'Write unit tests',
        user_id: 2,
        completion_time: new Date('2024-01-05'),
      },
    ];

    await client('tasks').insert(tasks);
  }

  /**
   * Populate the users table with some dummy data
   */
  async function populateUsersTable() {
    const users = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlemagne' }];

    await client('users').insert(users);
  }

  /**
   * Populate the models table with some dummy data
   */
  async function populateModelsTable() {
    const models = [
      {
        name: 'Model 1',
        version: '1.0.0',
        description: 'The first model',
        model_uri: 'https://example.com/models/model1',
      },
      {
        name: 'Model 2',
        version: '1.0.0',
        description: 'The second model',
        model_uri: 'https://example.com/models/model2',
      },
    ];

    await client('models').insert(models);
  }

  ensureUsersTableExists().catch(err => {
    console.error('Error creating users table:', err);
  });

  ensureTasksTableExists().catch(err => {
    console.error('Error creating tasks table:', err);
  });

  ensureModelsTableExists().catch(err => {
    console.error('Error creating models table:', err);
  });

  return {
    async getTasks(): Promise<Task[]> {
      try {
        const result = await client('tasks')
          .select(
            'tasks.id',
            'tasks.title',
            'tasks.user_id',
            'tasks.completion_time',
            'users.name AS user_name',
          )
          .join('users', 'tasks.user_id', '=', 'users.id');
        return result;
      } catch (error) {
        console.log('Failed to fetch tasks: ', error);
        return [];
      }
    },

    async addTask(
      title: string,
      userId: number,
      completionTime?: Date,
    ): Promise<Task> {
      const [result] = await client('tasks')
        .insert({
          title,
          user_id: userId,
          completion_time: completionTime || null,
        })
        .returning('*');

      return result;
    },

    async getModels() {
      try {
        const result = await client('models').select('*');
        return result;
      } catch (error) {
        console.log('Failed to fetch models: ', error);
        return [];
      }
    },

    async addModel(
      name: string,
      version: string,
      description: string,
      modelUri: string,
    ): Promise<Model> {
      const [result] = await client('models')
        .insert({
          name,
          version,
          description,
          model_uri: modelUri,
        })
        .returning('*');

      return result;
    },
  };
}
