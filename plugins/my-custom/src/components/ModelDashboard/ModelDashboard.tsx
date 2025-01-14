import React, { useState } from 'react';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { alertApiRef, discoveryApiRef, fetchApiRef, identityApiRef, useApi } from '@backstage/core-plugin-api';
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
  registered_by: string | null;
};

/**
 * A utility function to format an ISO string to a human-readable date.
 * @param isoString The ISO string to format
 * @returns A human-readable date string
 */
const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString();
};

/**
 * A table component to display a list of models.
 * @param models The list of models to display
 */
const ModelTable = ({ models }: { models: Model[] }) => {
  const columns: TableColumn<Model>[] = [
    { title: 'Name', field: 'name' },
    { title: 'Version', field: 'version' },
    { title: 'Description', field: 'description' },
    { title: 'Model URI', field: 'model_uri' },
    { title: 'Registered At', field: 'registered_at' },
    {
      title: 'Registered By',
      field: 'registered_by',
      render: model => {
        const userId = model.registered_by ?? 'user:default/unknown'; // Default to unknown user
        // Extract the entity and namespace using string manipulation
        const [, namespace, user] = userId.split(/[:/]/); // Splits "user:default/jescalada" into parts
        const url = `http://localhost:3000/catalog/${namespace}/user/${user}`;

        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: '#1976d2' }}
          >
            {user}
          </a>
        );
      },
    },
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

/**
 * A form component to add a new model.
 * @param onSubmit The handler function to submit the form which takes a partial `Model` object
 */
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

/**
 * A component to manage models.
 */
export const ModelDashboard = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const { fetch } = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);
  const identityApi = useApi(identityApiRef);

  const { value: models, loading, error } = useAsync(async (): Promise<Model[]> => {
    const url = `${await discoveryApi.getBaseUrl('my-custom')}/models`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) {
      throw new Error(`Error fetching models: ${response.statusText}`);
    }
    return response.json();
  }, []);

  /**
   * Handler function to submit the form and add a new model (takes a partial `Model` object).
   * @param model The partial `Model` object to add
   */
  const handleFormSubmit = async (model: Partial<Model>) => {
    try {
      const user = await identityApi.getBackstageIdentity();
      const username = user.userEntityRef;

      const url = `${await discoveryApi.getBaseUrl('my-custom')}/models/add`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...model, registered_by: username }), // Include the user's email
      });
      if (!response.ok) throw new Error(`Error adding model: ${response.statusText}`);
      alertApi.post({ message: 'Model added successfully!', severity: 'success' });

      // TODO: Refresh only table data
      setTimeout(() => window.location.reload(), 1000); // Refresh page after short delay
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
