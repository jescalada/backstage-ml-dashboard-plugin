export interface Task {
  id: number;
  title: string;
  user_id: number;
  completion_time: Date | null; // Completion time can be null if not provided
  user_name: string; // User's name, obtained from the join
}

export interface Model {
  id: number;
  name: string;
  version: string;
  description: string;
  model_uri: string;
}

export interface MyDatabaseService {
  getTasks(): Promise<Task[]>;
  addTask(title: string, userId: number, completionTime?: Date): Promise<Task>;
  getModels(): Promise<Model[]>;
  addModel(
    name: string,
    version: string,
    description: string,
    modelUri: string,
  ): Promise<Model>;
}
