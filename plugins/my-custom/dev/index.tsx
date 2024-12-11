import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { myCustomPlugin, MyCustomPage } from '../src/plugin';

createDevApp()
  .registerPlugin(myCustomPlugin)
  .addPage({
    element: <MyCustomPage />,
    title: 'Root Page',
    path: '/my-custom',
  })
  .render();
