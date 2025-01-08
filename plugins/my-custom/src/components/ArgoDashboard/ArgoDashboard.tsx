import React, { useState } from 'react';
import { discoveryApiRef, googleAuthApiRef, useApi, fetchApiRef } from '@backstage/core-plugin-api';
import { Table, TableColumn } from '@backstage/core-components';

interface ArgoApplication {
  name: string;
  namespace: string;
  status: string;
  createdAt: string;
  syncStatus: string;
}

const ArgoApplicationsTable = ({ applications }: { applications: ArgoApplication[] }) => {
  const columns: TableColumn<ArgoApplication>[] = [
    { title: 'Name', field: 'name' },
    { title: 'Namespace', field: 'namespace' },
    { title: 'Status', field: 'status' },
    { title: 'Sync Status', field: 'syncStatus' },
    { title: 'Created At', field: 'createdAt' },
  ];

  const data = applications.map(app => ({
    ...app,
    createdAt: new Date(app.createdAt).toLocaleString(), // Format the creation date
  }));

  return (
    <Table
      title="Argo Applications"
      options={{ search: true, paging: true, pageSize: 10, filtering: true }}
      columns={columns}
      data={data}
    />
  );
};

export const ArgoAppFetcher = () => {
  const googleAuth = useApi(googleAuthApiRef);
  const { fetch } = useApi(fetchApiRef);
  const [applications, setApplications] = useState<ArgoApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discoveryApi = useApi(discoveryApiRef);

  const fetchArgoApplications = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${await discoveryApi.getBaseUrl('my-custom')}/argo/applications`;
      const token = await googleAuth.getIdToken();
      console.log('Google Access Token:', token);

      // backend request to fetch ArgoCD applications
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ArgoCD applications: ${response.statusText}`);
      }
      console.log('ArgoCD Applications Response:', response);
      const data = await response.json();
      console.log('ArgoCD Applications:', data);
      setApplications(data);
    } catch (err: any) {
      console.error('Error fetching ArgoCD applications:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchArgoApplications} disabled={loading}>
        {loading ? 'Fetching Applications...' : 'Fetch Argo Applications'}
      </button>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {applications.length > 0 ? (
        <ArgoApplicationsTable applications={applications} />
      ) : (
        !loading && <p>No applications to display</p>
      )}
    </div>
  );
};
