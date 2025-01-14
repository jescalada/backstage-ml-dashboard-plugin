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
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { useTableStyles } from '../../styles/useTableStyles';
import { DataIngestionJob, JobStatus, JobTableProps } from './types';

/**
 * A utility function to format an ISO string to a human-readable date.
 * @param isoString The ISO string to format
 */
const formatDate = (isoString: string) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString();
};

/**
 * A badge component to display the status of a data ingestion job.
 * @param status The status of the job
 */
const StatusBadge = ({ status }: { status: string }) => {
  const classes = useTableStyles();

  const statusClassMap: Record<string, string> = {
    'Pending': classes.green,
    'In Progress': classes.yellow,
    'Completed': classes.purple,
    'Failed': classes.red,
    'Unknown': classes.gray,
  };

  const badgeClass = statusClassMap[status] || classes.gray;

  return (
    <span className={`${classes.badge} ${badgeClass}`}>
      {status}
    </span>
  );
};

/**
 * A set of action buttons to switch the status of a job, hidden behind a "three-dot" menu.
 * @param jobId The ID of the job to switch status
 * @param switchHandler The handler function to switch the status of a job
 */
const StatusSwitchButtons = ({
  jobId,
  switchHandler
}: {
  jobId: string,
  switchHandler: (jobId: string, status: JobStatus) => void
}) => {
  const classes = useTableStyles();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (status: JobStatus) => {
    switchHandler(jobId, status);
    handleCloseMenu();
  };

  const statusClassMap: Record<string, string> = {
    'Pending': classes.green,
    'In Progress': classes.yellow,
    'Completed': classes.purple,
    'Failed': classes.red,
    'Unknown': classes.gray,
  };

  return (
    <>
      <Button
        className={classes.threeDotButton}
        onClick={handleOpenMenu}
        aria-controls="status-menu"
        aria-haspopup="true"
      >
        •••
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {Object.values(JobStatus).map(status => {
          if (status === JobStatus.PENDING) return null;
          const buttonClass = statusClassMap[status] || classes.gray;
          return (
            <MenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              className={buttonClass}
            >
              {status}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

/**
 * A table component to display data ingestion jobs.
 * @param jobs The list of data ingestion jobs to display
 * @param handleJobStatusSwitch The handler function to switch the status of a job
 */
const JobTable = ({ jobs, handleJobStatusSwitch }: JobTableProps) => {
  const columns: TableColumn<DataIngestionJob>[] = [
    { title: 'Data Source URI', field: 'data_source_uri', width: '25%' },
    { title: 'Created At', field: 'created_at', width: '20%' },
    { title: 'Completed At', field: 'completed_at', width: '20%' },
    { title: 'Job Status', field: 'status', render: (job: DataIngestionJob) => <StatusBadge status={job.status} />, width: '15%' },
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

/**
 * A form component to add a new data ingestion job.
 * @param onSubmit The handler function to submit the form which takes a partial `DataIngestionJob` object
 */
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
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        mt: 2,
        p: 2,
        border: '1px solid #ccc',
        borderRadius: 2,
        display: 'flex',
        flexWrap: 'nowrap', // Prevent wrapping
        alignItems: 'center', // Align items vertically in the center
      }}
    >
      <TextField
        required
        label="Data Source URI"
        name="data_source_uri"
        onChange={handleInputChange}
        style={{ flexShrink: 1, minWidth: 200 }} // Adjust width and shrinkability
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        style={{ whiteSpace: 'nowrap' }} // Prevent button text wrapping
      >
        Register Job
      </Button>
    </Box>

  );
};

/**
 * A component to track data ingestion jobs.
 */
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
    const fetchedJobs = await response.json();
    return fetchedJobs;
  }, []);

  /**
   * Handler function to submit the form and add a new data ingestion job.
   * @param job The partial `DataIngestionJob` object to add
   * @error relay error to `alertApi` if failed
   */
  const handleFormSubmit = async (job: Partial<DataIngestionJob>) => {
    try {
      const url = `${await discoveryApi.getBaseUrl('my-custom')}/jobs/add`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });
      if (!response.ok) throw new Error(`Error adding job: ${response.statusText}`);
      alertApi.post({ message: 'Model added successfully!', severity: 'success' });

      // TODO: Refresh only table data
      // Refresh page after adding job and short delay
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      alertApi.post({ message: `Failed to add job: ${e.message}`, severity: 'error' });
    }
  };

  /**
   * Handler function to switch the status of a data ingestion job.
   * @param jobId The ID of the job to switch status
   * @param status The new status to switch to
   */
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
