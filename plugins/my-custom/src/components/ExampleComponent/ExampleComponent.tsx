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
import { ModelDashboard } from '../ModelDashboard/ModelDashboard';

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
          <InfoCard title="Information card">
            <Typography variant="body1">
              All content should be wrapped in a card like this.
            </Typography>
            <Typography variant="body2">
              My Custom plugin is working! 🎉
            </Typography>
          </InfoCard>
        </Grid>
        <Grid item>
          <ModelDashboard />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
