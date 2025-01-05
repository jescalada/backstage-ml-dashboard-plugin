import fetch, { RequestInit } from 'node-fetch';

interface ArgoServiceConfig {
  baseUrl: string;
  token?: string; // Bearer token for auth
}

/**
 * Service for interacting with the ArgoCD API
 *
 * @public
 */
export class ArgoService {
  private baseUrl: string;
  private token?: string;

  constructor(config: ArgoServiceConfig) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async fetchApplications(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/v1/applications`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.statusText}`);
    }
    return response.json();
  }

  async triggerSync(appName: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/applications/${appName}/sync`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to sync application: ${response.statusText}`);
    }
    return response.json();
  }
}

export const createArgoService = (config: ArgoServiceConfig) => {
  return new ArgoService(config);
};
