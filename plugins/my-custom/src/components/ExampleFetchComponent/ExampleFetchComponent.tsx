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

type Todo = {
  title: string;
  id: string;
  user_name: string;
  completion_time: string;
};

type TodosTableProps = {
  todos: Todo[];
};

export const TodosTable = ({ todos }: TodosTableProps) => {
  const classes = useStyles();

  const columns: TableColumn[] = [
    { title: 'Title', field: 'title' },
    { title: 'Id', field: 'id' },
    { title: 'Created By', field: 'createdBy' },
    { title: 'Completion Time', field: 'completionTime' },
  ];

  const data = todos.map(todo => {
    return {
      title: todo.title,
      id: todo.id,
      createdBy: todo.user_name,
      // Parse the completion time as a human-readable string
      completionTime: todo.completion_time ? new Date(todo.completion_time).toLocaleString() : '-',
    };
  });

  return (
    <Table
      title="Example Todo List"
      options={{ search: false, paging: false }}
      columns={columns}
      data={data}
    />
  );
};

export const ExampleFetchComponent = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const { fetch } = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);

  const { value, loading, error } = useAsync(async (): Promise<Todo[]> => {
    const url = `${await discoveryApi.getBaseUrl('my-custom')}/todos`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Error fetching todos: ${response.statusText} ${await response.text()}`);
    }
    const data = await response.json();
    return data;
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return <TodosTable todos={value || []} />;
};
