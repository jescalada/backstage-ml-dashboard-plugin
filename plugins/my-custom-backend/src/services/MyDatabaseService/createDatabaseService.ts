import { Knex } from 'knex';
import { Model, Task } from './types';

/**
 * Create a new instance of the MyDatabaseService
 *
 * @param client the Knex client to use for database operations
 * @returns MyDatabaseService instance with various methods to interact with the database
 */
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

  /**
   * Ensure the users table exists in the database
   * If it does not exist, create it
   *
   * @returns Promise<void>
   */
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

  /**
   * Ensure the models table exists in the database
   * If it does not exist, create it
   *
   * @returns Promise<void>
   */
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
   * Ensure the data_ingestion_jobs table exists in the database
   */
  async function ensureIngestionJobsTableExists() {
    const hasTable = await client.schema.hasTable('data_ingestion_jobs');
    if (!hasTable) {
      await client.schema.createTable('data_ingestion_jobs', table => {
        table.increments('id').primary();
        table.string('data_source_uri').notNullable();
        table.string('status').notNullable();
        table.timestamp('created_at').defaultTo(client.fn.now());
        table.timestamp('completed_at').nullable();
      });
      await populateIngestionJobsTable();
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

  /**
   * Populate the data_ingestion_jobs table with some dummy data
   */
  async function populateIngestionJobsTable() {
    const jobs = [
      {
        data_source_uri: 'https://example.com/data.csv',
        status: 'completed',
        created_at: new Date('2024-01-01'),
        completed_at: new Date('2024-01-02'),
      },
      {
        data_source_uri: 'https://example.com/data2.csv',
        status: 'failed',
        created_at: new Date('2024-01-03'),
        completed_at: new Date('2024-01-04'),
      },
      {
        data_source_uri: 'https://example.com/data3.csv',
        status: 'in_progress',
        created_at: new Date('2024-01-05'),
        completed_at: null,
      },
    ];

    await client('data_ingestion_jobs').insert(jobs);
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

  ensureIngestionJobsTableExists().catch(err => {
    console.error('Error creating data ingestion jobs table:', err);
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

    async getDataIngestionJobs() {
      try {
        const result = await client('data_ingestion_jobs').select('*');
        return result;
      } catch (error) {
        console.log('Failed to fetch data ingestion jobs: ', error);
        return [];
      }
    },

    async addDataIngestionJob(data_source_uri: string): Promise<void> {
      await client('data_ingestion_jobs').insert({
        data_source_uri,
        status: 'in_progress',
      });
    },
  };
}
