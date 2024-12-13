export interface Task {
  id: number;
  title: string;
  user_id: number;
  completion_time: Date | null; // Completion time can be null if not provided
  user_name: string; // User's name, obtained from the join
}

export interface MyDatabaseService {
  getTasks(): Promise<Task[]>;
  addTask(title: string, userId: number, completionTime?: Date): Promise<Task>;
}
