import React, { useState } from 'react';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { alertApiRef, discoveryApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

type DataIngestionJob = {
  id: string;
  data_source_uri: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};

enum JobStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
}

type JobTableProps = {
  jobs: DataIngestionJob[];
  handleJobStatusSwitch: (jobId: string, status: JobStatus) => void;
}

const useStyles = makeStyles({
  badge: {
    padding: '0.25rem 0.5rem', // equivalent to px-2 py-1
    fontSize: '0.75rem', // equivalent to text-xs
    lineHeight: '1rem', // line-height: 1rem
    fontWeight: 500, // font-medium
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '9999px', // rounded-full for perfectly round corners
    textAlign: 'center',
    color: '#4B5563', // default text color (gray-600)
    borderWidth: '1px', // setting a 1px border width
    borderStyle: 'solid', // solid border style
  },
  gray: {
    backgroundColor: '#F9FAFB', // bg-gray-50
    color: '#4B5563', // text-gray-600
    borderColor: '#E5E7EB', // ring-gray-500/10 (light gray border)
  },
  red: {
    backgroundColor: '#FEF2F2', // bg-red-50
    color: '#B91C1C', // text-red-700
    borderColor: '#FECACA', // ring-red-600/10 (light red border)
  },
  yellow: {
    backgroundColor: '#FFFBEB', // bg-yellow-50
    color: '#92400E', // text-yellow-800
    borderColor: '#FBBF24', // ring-yellow-600/20 (light yellow border)
  },
  green: {
    backgroundColor: '#ECFDF5', // bg-green-50
    color: '#047857', // text-green-700
    borderColor: '#34D399', // ring-green-600/20 (light green border)
  },
  blue: {
    backgroundColor: '#EFF6FF', // bg-blue-50
    color: '#1D4ED8', // text-blue-700
    borderColor: '#3B82F6', // ring-blue-700/10 (light blue border)
  },
  indigo: {
    backgroundColor: '#EEF2FF', // bg-indigo-50
    color: '#4338CA', // text-indigo-700
    borderColor: '#6366F1', // ring-indigo-700/10 (light indigo border)
  },
  purple: {
    backgroundColor: '#F5F3FF', // bg-purple-50
    color: '#6D28D9', // text-purple-700
    borderColor: '#7C3AED', // ring-purple-700/10 (light purple border)
  },
  pink: {
    backgroundColor: '#FDF2F8', // bg-pink-50
    color: '#BE185D', // text-pink-700
    borderColor: '#F472B6', // ring-pink-700/10 (light pink border)
  },
  switchButton: {
    width: '100%',
    marginBottom: '0.5rem',
    '&:hover': {
      backgroundColor: '#c2c9db', // hover:bg-gray-200
    }
  }
});

const formatDate = (isoString: string) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString();
};

const StatusBadge = ({ status }: { status: string }) => {
  const classes = useStyles();

  const statusClassMap: Record<string, string> = {
    'Pending': classes.green,
    'In Progress': classes.yellow,
    'Completed': classes.purple,
    'Failed': classes.red,
    'Unknown': classes.gray,
  };

  const badgeClass = statusClassMap[status] || classes.secondary;

  return (
    <span className={`${classes.badge} ${badgeClass}`}>
      {status}
    </span>
  );
};

/**
 * A set of action buttons to switch the status of a job
 */
const StatusSwitchButtons = ({ jobId, switchHandler }: { jobId: string, switchHandler: (jobId: string, status: JobStatus) => void }) => {
  const classes = useStyles();

  const statusClassMap: Record<string, string> = {
    'Pending': classes.green,
    'In Progress': classes.yellow,
    'Completed': classes.purple,
    'Failed': classes.red,
    'Unknown': classes.gray,
  };

  return (
    <>
      {Object.values(JobStatus).map(status => {
        if (status === JobStatus.PENDING) return null;
        const buttonClass = statusClassMap[status] || classes.gray;
        return (
          <Button
            key={status}
            variant="contained"
            color="primary"
            className={`${classes.switchButton} ${buttonClass}`}
            onClick={() => switchHandler(jobId, status)}
            size='small'
          >
            {status}
          </Button>
        );
      })}
    </>
  );
}

const JobTable = ({ jobs, handleJobStatusSwitch }: JobTableProps) => {
  const columns: TableColumn<DataIngestionJob>[] = [
    { title: 'Data Source URI', field: 'data_source_uri', width: '30%' },
    { title: 'Created At', field: 'created_at', width: '20%' },
    { title: 'Completed At', field: 'completed_at', width: '20%' },
    { title: 'Job Status', field: 'status', render: (job: DataIngestionJob) => <StatusBadge status={job.status} />, width: '10%' },
    { title: 'Actions', field: 'id', render: (job: DataIngestionJob) => <StatusSwitchButtons jobId={job.id} switchHandler={handleJobStatusSwitch} />, width: '20%' },
  ];

  const data = jobs.map(job => ({
    ...job,
    status: JobStatus[job.status.toUpperCase() as keyof typeof JobStatus] || "Unknown",
    created_at: formatDate(job.created_at),
    completed_at: formatDate(job.completed_at || ''),
  }));

  return (
    <Table
      title="Data Ingestion Jobs"
      options={{ search: true, paging: true, pageSize: 10, filtering: true }}
      columns={columns}
      data={data}
    />
  );
};

const ModelForm = ({ onSubmit }: { onSubmit: (model: Partial<DataIngestionJob>) => Promise<void> }) => {
  const [formState, setFormState] = useState<Partial<DataIngestionJob>>({});

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(formState);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <TextField required label="Data Source URI" name="data_source_uri" onChange={handleInputChange} />
      <Button type="submit" variant="contained" color="primary">Register Job</Button>
    </Box>
  );
};

export const DataIngestionTracker = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const { fetch } = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);

  const { value: jobs, loading, error } = useAsync(async (): Promise<DataIngestionJob[]> => {
    const url = `${await discoveryApi.getBaseUrl('my-custom')}/jobs`;

    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) {
      throw new Error(`Error fetching models: ${response.statusText}`);
    }
    const jobs = await response.json();
    console.log('fetched jobs: ', jobs);
    return jobs;
  }, []);

  const handleFormSubmit = async (job: Partial<DataIngestionJob>) => {
    try {
      const url = `${await discoveryApi.getBaseUrl('my-custom')}/jobs/add`;
      console.log('adding job: ', job);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });
      if (!response.ok) throw new Error(`Error adding model: ${response.statusText}`);
      alertApi.post({ message: 'Model added successfully!', severity: 'success' });

      // TODO: Refresh only table data
      // Refresh page after adding job and short delay
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      alertApi.post({ message: `Failed to add job: ${e.message}`, severity: 'error' });
    }
  };

  const handleJobStatusSwitch = async (jobId: string, status: JobStatus) => {
    const statusToEndpointMap: Record<JobStatus, string> = {
      [JobStatus.PENDING]: 'pending',
      [JobStatus.IN_PROGRESS]: 'start',
      [JobStatus.COMPLETED]: 'complete',
      [JobStatus.FAILED]: 'fail',
    };

    try {
      const url = `${await discoveryApi.getBaseUrl('my-custom')}/jobs/${statusToEndpointMap[status]}/${jobId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const responseJson = await response.json();
      if (!response.ok) throw new Error(responseJson.message);
      alertApi.post({ message: 'Job status updated successfully!', severity: 'success' });

      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      alertApi.post({ message: `Failed to update job status: ${e}`, severity: 'error', display: 'transient' });
    }
  };

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;

  return (
    <>
      <ModelForm onSubmit={handleFormSubmit} />
      <JobTable jobs={jobs || []} handleJobStatusSwitch={handleJobStatusSwitch} />
    </>
  );
};
