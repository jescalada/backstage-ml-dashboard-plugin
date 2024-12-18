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

type DataIngestionJob = {
  id: string;
  data_source_uri: string;
  job_status: string;
  created_at: string;
  completed_at: string;
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString();
};

const JobTable = ({ jobs }: { jobs: DataIngestionJob[] }) => {
  const columns: TableColumn[] = [
    { title: 'Data Source URI', field: 'data_source_uri' },
    { title: 'Job Status', field: 'job_status' },
    { title: 'Created At', field: 'created_at' },
    { title: 'Completed At', field: 'completed_at' },
  ];

  const data = jobs.map(job => ({
    ...job,
    created_at: formatDate(job.created_at),
    completed_at: formatDate(job.completed_at),
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
      <TextField required label="Data Source URI" name="Data Source URI" onChange={handleInputChange} />
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
    return response.json();
  }, []);

  const handleFormSubmit = async (job: Partial<DataIngestionJob>) => {
    try {
      const url = `${await discoveryApi.getBaseUrl('my-custom')}/jobs/add`;
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

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;

  return (
    <>
      <ModelForm onSubmit={handleFormSubmit} />
      <JobTable jobs={jobs || []} />
    </>
  );
};
