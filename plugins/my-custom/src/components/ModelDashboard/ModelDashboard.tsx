import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { alertApiRef, discoveryApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';

const useStyles = makeStyles({
  avatar: {
    height: 32,
    width: 32,
    borderRadius: '50%',
  },
});

type Model = {
  id: string;
  name: string;
  version: string;
  description: string;
  model_uri: string;
  registered_at: string;
};

type ModelTableProps = {
  models: Model[];
};

export const ModelTable = ({ models }: ModelTableProps) => {
  const classes = useStyles();

  const columns: TableColumn[] = [
    { title: 'Name', field: 'name' },
    { title: 'Version', field: 'version' },
    { title: 'Description', field: 'description' },
    { title: 'Model URI', field: 'model_uri' },
    { title: 'Registered At', field: 'registered_at' },
  ];

  const data = models.map(model => {
    return {
      name: model.name,
      version: model.version,
      description: model.description,
      model_uri: model.model_uri,
      registered_at: model.registered_at,
    };
  });

  return (
    <Table
      title="Model List"
      options={{ search: true, paging: true, pageSize: 10, filtering: true }}
      columns={columns}
      data={data}
    />
  );
};

export const ModelDashboard = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const { fetch } = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);

  const { value, loading, error } = useAsync(async (): Promise<Model[]> => {
    const url = `${await discoveryApi.getBaseUrl('my-custom')}/models`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Error fetching models: ${response.statusText} ${await response.text()}`);
    }
    const data = await response.json();
    console.log('data', data);
    return data;
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return <ModelTable models={value || []} />;
};
