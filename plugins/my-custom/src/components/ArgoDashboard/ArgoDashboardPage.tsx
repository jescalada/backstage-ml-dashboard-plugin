import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  HeaderLabel,
} from '@backstage/core-components';
import { ArgoAppFetcher } from '../ArgoDashboard/ArgoDashboard';

export const ArgoDashboardPage = () => (
  <Page themeId="tool">
    <Header title="ArgoCD Dashboard" subtitle="View and interact with your ArgoCD applications here.">
      <HeaderLabel label="Owner" value="Team X" />
      <HeaderLabel label="Lifecycle" value="Alpha" />
    </Header>
    <Content>
      <Grid item xs={12}>
        <ArgoAppFetcher />
      </Grid>
    </Content>
  </Page>
);
