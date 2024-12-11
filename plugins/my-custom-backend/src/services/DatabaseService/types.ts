export interface Task {
  id: number;
  title: string;
  userId: number;
  completion_time: Date | null;
  userName: string;
}

export interface DatabaseService {
  getTasks: Promise<Task[]>;
  addTask(title: string, userId: number, completionTime?: Date): Promise<Task>;
}
