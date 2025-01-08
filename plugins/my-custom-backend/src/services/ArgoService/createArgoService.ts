import fetch, { RequestInit } from 'node-fetch';
import https from 'https';

interface ArgoServiceConfig {
  baseUrl: string;
}

/**
 * Service for interacting with the ArgoCD API
 *
 * @public
 */
export class ArgoService {
  private baseUrl: string;

  constructor(config: ArgoServiceConfig) {
    this.baseUrl = config.baseUrl;
  }

  private getHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async fetchApplications(token: string): Promise<any> {
    const dangerouslyAllowSelfSignedCertsAgent = new https.Agent({
      rejectUnauthorized: false, // This allows self-signed certs. DO NOT USE IN PRODUCTION
    });
    const response = await fetch(`${this.baseUrl}/api/v1/applications`, {
      method: 'GET',
      headers: this.getHeaders(token),
      agent: dangerouslyAllowSelfSignedCertsAgent,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.statusText}`);
    }
    return response.json();
  }

  async triggerSync(appName: string, token: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/applications/${appName}/sync`,
      {
        method: 'POST',
        headers: this.getHeaders(token),
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
