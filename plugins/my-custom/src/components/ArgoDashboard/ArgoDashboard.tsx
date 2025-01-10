import React, { useEffect, useState } from 'react';
import { discoveryApiRef, googleAuthApiRef, useApi, fetchApiRef } from '@backstage/core-plugin-api';
import { Table, TableColumn } from '@backstage/core-components';
import { useTableStyles } from '../../styles/useTableStyles';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

interface ArgoApplication {
  name: string;
  namespace: string;
  createdAt: string;
  lastDeployedAt?: string;
  lastDeployedBy?: string;
  lastSyncedAt?: string;
  health: ArgoApplicationHealthStatus;
  syncStatus: ArgoApplicationSyncStatus;
}

enum ArgoApplicationSyncStatus {
  Synced = 'Synced',
  'OutOfSync' = 'OutOfSync',
  Unknown = 'Unknown',
}

enum ArgoApplicationHealthStatus {
  Healthy = 'Healthy',
  Degraded = 'Degraded',
  Progressing = 'Progressing',
  Suspended = 'Suspended',
  Missing = 'Missing',
  Unknown = 'Unknown',
}

enum ArgoApplicationAction {
  Sync = 'Sync',
}

const extractArgoApplications = (data: any): ArgoApplication[] => {
  if (!data || !Array.isArray(data.items)) {
    throw new Error("Invalid data format");
  }

  return data.items.map((item: any) => {
    const {
      metadata: { name, namespace, creationTimestamp },
      status: { health, history, reconciledAt, sync },
    } = item;

    return {
      name: name || "Unknown",
      namespace: namespace || "Unknown",
      createdAt: creationTimestamp || "Unknown",
      lastDeployedAt: history[history.length - 1].deployedAt || "Unknown",
      lastDeployedBy: history[history.length - 1].initiatedBy.username || "Unknown",
      lastSyncedAt: reconciledAt || "Unknown",
      health: health?.status || "Unknown",
      syncStatus: sync?.status || "Unknown",
    };
  });
}

const SyncStatusBadge = ({ status }: { status: string }) => {
  const classes = useTableStyles();

  const statusClassMap: Record<string, string> = {
    'Synced': classes.green,
    'OutOfSync': classes.yellow,
    'Unknown': classes.gray,
  };

  const badgeClass = statusClassMap[status] || classes.gray;

  return (
    <span className={`${classes.badge} ${badgeClass}`}>
      {status}
    </span>
  );
};

const HealthStatusBadge = ({ status }: { status: string }) => {
  const classes = useTableStyles();

  const statusClassMap: Record<string, string> = {
    'Healthy': classes.green,
    'Degraded': classes.red,
    'Progressing': classes.blue,
    'Suspended': classes.gray,
    'Missing': classes.yellow,
    'Unknown': classes.gray,
  };

  const badgeClass = statusClassMap[status] || classes.gray;

  return (
    <span className={`${classes.badge} ${badgeClass}`}>
      {status}
    </span>
  );
}

const AppActionButtons = ({
  appName,
  actionHandler
}: {
  appName: string,
  actionHandler: (appName: string, action: ArgoApplicationAction) => void
}) => {
  const classes = useTableStyles();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: ArgoApplicationAction) => {
    actionHandler(appName, action);
    handleCloseMenu();
  };

  const actionClassMap: Record<string, string> = {
    'Sync': classes.blue,
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
        {Object.values(ArgoApplicationAction).map(action => {
          const buttonClass = actionClassMap[action] || classes.gray;
          return (
            <MenuItem
              key={action}
              onClick={() => handleAction(action)}
              className={buttonClass}
            >
              {action}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

const ArgoApplicationsTable = ({ applications }: { applications: ArgoApplication[] }) => {
  const columns: TableColumn<ArgoApplication>[] = [
    { title: 'Name', field: 'name' },
    { title: 'Namespace', field: 'namespace' },
    { title: 'Created At', field: 'createdAt' },
    { title: 'Last Deployed At', field: 'lastDeployedAt' },
    { title: 'Last Deployed By', field: 'lastDeployedBy' },
    { title: 'Last Synced At', field: 'lastSyncedAt' },
    { title: 'Sync Status', field: 'syncStatus', render: app => <SyncStatusBadge status={app.syncStatus} /> },
    { title: 'Health', field: 'health', render: app => <HealthStatusBadge status={app.health} /> },
    {
      title: 'Actions',
      field: 'name',
      render: app => (
        <AppActionButtons
          appName={app.name}
          actionHandler={(appName, action) => console.log(`Triggering action ${action} for app ${appName}`)}
        />
      ),
    },
  ];

  const data = applications.map(app => ({
    ...app,
    createdAt: new Date(app.createdAt).toLocaleString(),
    lastDeployedAt: new Date(app.lastDeployedAt ?? '').toLocaleString(),
    lastSyncedAt: new Date(app.lastSyncedAt ?? '').toLocaleString(),
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
      const data = await response.json();
      console.log('Argo raw data:', data);
      setApplications(extractArgoApplications(data));
    } catch (err: any) {
      console.error('Error fetching ArgoCD applications:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArgoApplications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {loading && <p>Loading applications...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {applications.length > 0 ? (
        <ArgoApplicationsTable applications={applications} />
      ) : (
        !loading && <p>No applications to display</p>
      )}
    </div>
  );
};