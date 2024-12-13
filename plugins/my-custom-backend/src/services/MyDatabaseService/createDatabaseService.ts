import { Knex } from 'knex';
import { Task } from './types';

export function createMyDatabaseService(client: Knex) {
  return {
    async getTasks(): Promise<Task[]> {
      // Use Knex to query the tasks and join with the users table
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
    },

    async addTask(
      title: string,
      userId: number,
      completionTime?: Date,
    ): Promise<Task> {
      // Insert a new task with the required user_id and optional completion_time
      const [result] = await client('tasks')
        .insert({
          title,
          user_id: userId,
          completion_time: completionTime || null, // If no completionTime is provided, it defaults to null
        })
        .returning('*'); // Returning the inserted row

      return result;
    },
  };
}
