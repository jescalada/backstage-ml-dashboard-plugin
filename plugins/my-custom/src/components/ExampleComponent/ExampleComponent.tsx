import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
} from '@backstage/core-components';
import { DataIngestionTracker } from '../DataIngestionTracker';
import { ModelDashboard } from '../ModelDashboard';

export const ExampleComponent = () => (
  <Page themeId="tool">
    <Header title="Machine Learning Dashboard" subtitle="View your models and data ingestion jobs here.">
      <HeaderLabel label="Owner" value="Team X" />
      <HeaderLabel label="Lifecycle" value="Alpha" />
    </Header>
    <Content>
      <ContentHeader title="Machine Learning Dashboard">
        <SupportButton>ML Dashboard</SupportButton>
      </ContentHeader>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <ModelDashboard />
        </Grid>
        <Grid item>
          <DataIngestionTracker />
        </Grid>
        <Grid item>
          <InfoCard title="Welcome to the Machine Learning Dashboard">
            <Typography variant="body1">
              This is a machine learning dashboard that allows you to view your models and data ingestion jobs.
            </Typography>
          </InfoCard>
        </Grid>
      </Grid>
    </Content>
  </Page>
);
