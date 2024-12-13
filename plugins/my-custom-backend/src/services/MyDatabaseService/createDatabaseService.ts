import { Knex } from 'knex';
import { Task } from './types';

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

  ensureUsersTableExists().catch(err => {
    console.error('Error creating users table:', err);
  });

  // Ensure table exists before any queries
  ensureTasksTableExists().catch(err => {
    console.error('Error creating tasks table:', err);
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
  };
}
