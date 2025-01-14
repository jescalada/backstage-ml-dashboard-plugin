import React, { useEffect, useState } from 'react';
import { discoveryApiRef, googleAuthApiRef, useApi, fetchApiRef, alertApiRef } from '@backstage/core-plugin-api';
import { Table, TableColumn } from '@backstage/core-components';
import { useTableStyles } from '../../styles/useTableStyles';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import {
  AppActionButtonsProps,
  ArgoApplication,
  ArgoApplicationAction,
  ArgoApplicationTableProps,
} from './types';

/**
 * Extracts ArgoCD applications from the raw data returned by the API 
 * @param data Raw data returned by the API
 * @returns parsed ArgoApplication objects
 */
const extractArgoApplications = (data: any): ArgoApplication[] => {
  if (!data || !Array.isArray(data.items)) {
    throw new Error("Invalid data format");
  }

  return data.items.map((item: any) => {
    const {
      metadata: { name, namespace, creationTimestamp },
      status: { health, history, operationState, reconciledAt, sync },
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
      lastSyncResult: operationState.phase || "Unknown",
      lastSyncMessage: operationState.syncResult.resources[0].message || undefined,
    };
  });
}

/**
 * Badge component that displays the colour-coded sync status of an ArgoCD application
 * @param status Sync status of the application
 */
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

/**
 * Badge component that displays the colour-coded health status of an ArgoCD application
 * @param status Health status of the application
 */
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

/**
 * Badge component that displays the colour-coded result of the last sync operation of an ArgoCD application
 * @param result Last sync result of the application
 * @param message Optional message to display on hover (usually on error)
 */
const LastSyncResultBadge = ({ result, message }: { result: string; message?: string }) => {
  const classes = useTableStyles();
  const statusClassMap: Record<string, string> = {
    Succeeded: classes.green,
    Failed: classes.red,
    Unknown: classes.gray,
  };
  const badgeClass = statusClassMap[result] || classes.gray;

  return (
    <Box display="inline-flex" alignItems="center">
      <span className={`${classes.badge} ${badgeClass}`}>{result}</span>
      {message && (
        <Tooltip title={message} arrow>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginLeft: 4,
            }}
          >
            <Typography
              style={{
                color: '#fff',
                fontSize: 12,
                fontWeight: 'bold',
              }}
            >
              ?
            </Typography>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

/**
 * Component that displays a set of action buttons to operate on an ArgoCD application
 * @param appName Name of the application
 * @param actionHandler Function to handle the action
 */
const AppActionButtons = ({
  appName,
  actionHandler
}: AppActionButtonsProps) => {
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

/**
 * Table component that displays all ArgoCD applications available to the authenticated user
 * @param applications List of ArgoCD applications
 * @param handleAction Function to handle actions on an application (such as syncing)
 */
const ArgoApplicationsTable = ({ applications, handleAction }: ArgoApplicationTableProps) => {
  const columns: TableColumn<ArgoApplication>[] = [
    { title: 'Name', field: 'name' },
    { title: 'Namespace', field: 'namespace' },
    { title: 'Created At', field: 'createdAt' },
    { title: 'Last Deployed At', field: 'lastDeployedAt' },
    { title: 'Last Deployed By', field: 'lastDeployedBy' },
    { title: 'Last Synced At', field: 'lastSyncedAt' },
    { title: 'Sync Status', field: 'syncStatus', render: app => <SyncStatusBadge status={app.syncStatus} /> },
    { title: 'Health', field: 'health', render: app => <HealthStatusBadge status={app.health} /> },
    { title: 'Last Sync Result', field: 'lastSyncResult', render: app => <LastSyncResultBadge result={app.lastSyncResult} message={app.lastSyncMessage} /> },
    {
      title: 'Actions',
      field: 'name',
      render: app => (
        <AppActionButtons
          appName={app.name}
          actionHandler={handleAction}
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

/**
 * Component that fetches ArgoCD applications and displays them in a table
 */
export const ArgoAppFetcher = () => {
  const googleAuth = useApi(googleAuthApiRef);
  const { fetch } = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);

  const [applications, setApplications] = useState<ArgoApplication[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches ArgoCD applications from the backend
   * @returns List of ArgoCD applications
   * @throws Error if fetching fails
   */
  const fetchArgoApplications = async () => {
    setLoading(true);

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
      setApplications(extractArgoApplications(data));
    } catch (err: any) {
      alertApi.post({ message: `${err}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles an action on an ArgoCD application
   * @param appName Name of the application
   * @param action Action to perform
   * @error Displays an error message if the action fails
   */
  const handleAction = async (appName: string, action: ArgoApplicationAction) => {
    const actionToEndpointMap: Record<ArgoApplicationAction, string> = {
      [ArgoApplicationAction.Sync]: 'sync',
    };

    try {
      const url = `${await discoveryApi.getBaseUrl('my-custom')}/argo/applications/${appName}/${actionToEndpointMap[action]}`;
      const token = await googleAuth.getIdToken();

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!response.ok) throw new Error(response.statusText);

      alertApi.post({ message: `Syncing ${appName}...`, severity: 'success' });

      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      alertApi.post({ message: `Failed to start syncing ${appName}: ${e}`, severity: 'error', display: 'transient' });
    }
  };

  useEffect(() => {
    fetchArgoApplications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {loading && <p>Loading applications...</p>}
      {applications.length > 0 ? (
        <ArgoApplicationsTable applications={applications} handleAction={handleAction} />
      ) : (
        !loading && <p>No applications to display</p>
      )}
    </div>
  );
};
