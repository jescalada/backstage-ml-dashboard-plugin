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

export interface DataIngestionJob {
  id: number;
  data_source_uri: string;
  status: string;
  created_at: Date;
  completed_at: Date | null;
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
    registeredBy: string | null,
  ): Promise<Model>;
  getDataIngestionJobs(): Promise<DataIngestionJob[]>;
  addDataIngestionJob(data_source_uri: string): Promise<DataIngestionJob>;
  startDataIngestionJob(id: number): Promise<void>;
  completeDataIngestionJob(id: number): Promise<void>;
  failDataIngestionJob(id: number): Promise<void>;
}
