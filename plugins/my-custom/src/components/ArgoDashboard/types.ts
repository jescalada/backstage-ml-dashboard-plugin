export type ArgoApplication = {
  name: string;
  namespace: string;
  createdAt: string;
  lastDeployedAt?: string;
  lastDeployedBy?: string;
  lastSyncedAt?: string;
  health: ArgoApplicationHealthStatus;
  syncStatus: ArgoApplicationSyncStatus;
  lastSyncResult: ArgoApplicationSyncResultStatus;
  lastSyncMessage?: string;
};

export type ArgoApplicationTableProps = {
  applications: ArgoApplication[];
  handleAction: (appName: string, action: ArgoApplicationAction) => void;
};

export enum ArgoApplicationSyncStatus {
  Synced = 'Synced',
  'OutOfSync' = 'OutOfSync',
  Unknown = 'Unknown',
}

export enum ArgoApplicationHealthStatus {
  Healthy = 'Healthy',
  Degraded = 'Degraded',
  Progressing = 'Progressing',
  Suspended = 'Suspended',
  Missing = 'Missing',
  Unknown = 'Unknown',
}

export enum ArgoApplicationSyncResultStatus {
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Unknown = 'Unknown',
}

export enum ArgoApplicationAction {
  Sync = 'Sync',
}

export type AppActionButtonsProps = {
  appName: string;
  actionHandler: (appName: string, action: ArgoApplicationAction) => void;
};
