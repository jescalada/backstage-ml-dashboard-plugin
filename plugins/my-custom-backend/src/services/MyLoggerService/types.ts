export enum EventType {
  MODEL_ADDED = 'Model Added',
  JOB_ADDED = 'Data Ingestion Job Added',
  JOB_STARTED = 'Data Ingestion Job Started',
  JOB_COMPLETED = 'Data Ingestion Job Completed',
  JOB_FAILED = 'Data Ingestion Job Failed',
}

export interface Event {
  event_type: EventType;
  description: string;
  reference_id: string;
  created_at: Date;
}

export interface MyLoggerService {
  logEvent(
    eventType: EventType,
    description: string,
    referenceId: string,
  ): Promise<Event>;
  getEvents(): Promise<Event[]>;
}
