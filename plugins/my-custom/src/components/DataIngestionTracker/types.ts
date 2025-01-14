export type DataIngestionJob = {
  id: string;
  data_source_uri: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};

export enum JobStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
}

export type JobTableProps = {
  jobs: DataIngestionJob[];
  handleJobStatusSwitch: (jobId: string, status: JobStatus) => void;
};
