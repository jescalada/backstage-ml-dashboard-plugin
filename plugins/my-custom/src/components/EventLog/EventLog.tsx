import React, { useState } from 'react';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { alertApiRef, discoveryApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';

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
  created_at: string;
}

type EventTableProps = {
  events: Event[];
}

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString();
};

const EventTable = ({ events }: EventTableProps) => {
  const columns: TableColumn<Event>[] = [
    { title: 'Event Type', field: 'event_type' },
    { title: 'Description', field: 'description' },
    { title: 'Reference ID', field: 'reference_id' },
    { title: 'Created At', field: 'created_at' },
  ];

  const data = events.map(event => ({
    ...event,
    created_at: formatDate(event.created_at),
  }));

  return (
    <Table
      title="Event Log"
      options={{ search: true, paging: true, pageSize: 10, filtering: true }}
      columns={columns}
      data={data}
    />
  );
};

export const EventLog = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const { fetch } = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);

  const { value: events, loading, error } = useAsync(async (): Promise<Event[]> => {
    const url = `${await discoveryApi.getBaseUrl('my-custom')}/events`;

    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) {
      throw new Error(`Error fetching events: ${response.statusText}`);
    }
    const fetchedEvents = await response.json();
    return fetchedEvents;
  }, []);

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;

  return (
    <>
      <EventTable events={events || []} />
    </>
  );
};
