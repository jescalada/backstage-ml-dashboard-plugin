import { Pool } from 'pg';
import { Task } from './types';

export function createDatabaseService(pool: Pool) {
  return {
    async getTasks(): Promise<Task[]> {
      // Select tasks along with associated user name
      const result = await pool.query(
        `SELECT tasks.id, tasks.title, tasks.user_id, tasks.completion_time, users.name AS user_name
         FROM tasks
         JOIN users ON tasks.user_id = users.id`,
      );
      return result.rows;
    },

    async addTask(
      title: string,
      userId: number,
      completionTime?: Date,
    ): Promise<Task> {
      // Insert task with the required user_id and optional completion_time
      const result = await pool.query(
        `INSERT INTO tasks (title, user_id, completion_time) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [title, userId, completionTime || null], // If no completionTime is provided, it defaults to null
      );
      return result.rows[0];
    },
  };
}
