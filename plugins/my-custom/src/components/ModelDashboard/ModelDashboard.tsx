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

type Model = {
  id: string;
  name: string;
  version: string;
  description: string;
  model_uri: string;
  registered_at: string;
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString();
};

const ModelTable = ({ models }: { models: Model[] }) => {
  const columns: TableColumn[] = [
    { title: 'Name', field: 'name' },
    { title: 'Version', field: 'version' },
    { title: 'Description', field: 'description' },
    { title: 'Model URI', field: 'model_uri' },
    { title: 'Registered At', field: 'registered_at' },
  ];

  const data = models.map(model => ({
    ...model,
    registered_at: formatDate(model.registered_at),
  }));

  return (
    <Table
      title="Model List"
      options={{ search: true, paging: true, pageSize: 10, filtering: true }}
      columns={columns}
      data={data}
    />
  );
};

const ModelForm = ({ onSubmit }: { onSubmit: (model: Partial<Model>) => Promise<void> }) => {
  const [formState, setFormState] = useState<Partial<Model>>({});

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
        label="Name"
        name="name"
        onChange={handleInputChange}
        style={{ flexShrink: 1, minWidth: 100 }}
      />
      <TextField
        required
        label="Version"
        name="version"
        onChange={handleInputChange}
        style={{ flexShrink: 1, minWidth: 100 }}
      />
      <TextField
        label="Description"
        name="description"
        onChange={handleInputChange}
        style={{ flexShrink: 1, minWidth: 150 }}
      />
      <TextField
        required
        label="Model URI"
        name="model_uri"
        onChange={handleInputChange}
        style={{ flexShrink: 1, minWidth: 150 }}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        style={{ whiteSpace: 'nowrap' }}
      >
        Add Model
      </Button>
    </Box>
  );
};

export const ModelDashboard = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const { fetch } = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);

  const { value: models, loading, error } = useAsync(async (): Promise<Model[]> => {
    const url = `${await discoveryApi.getBaseUrl('my-custom')}/models`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) {
      throw new Error(`Error fetching models: ${response.statusText}`);
    }
    return response.json();
  }, []);

  const handleFormSubmit = async (model: Partial<Model>) => {
    try {
      const url = `${await discoveryApi.getBaseUrl('my-custom')}/models/add`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
      });
      if (!response.ok) throw new Error(`Error adding model: ${response.statusText}`);
      alertApi.post({ message: 'Model added successfully!', severity: 'success' });

      // TODO: Refresh only table data
      // Refresh page after adding model and short delay
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      alertApi.post({ message: `Failed to add model: ${e.message}`, severity: 'error' });
    }
  };

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;

  return (
    <>
      <ModelForm onSubmit={handleFormSubmit} />
      <ModelTable models={models || []} />
    </>
  );
};
