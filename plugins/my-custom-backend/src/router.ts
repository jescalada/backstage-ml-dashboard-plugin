import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { TodoListService } from './services/TodoListService/types';
import { MyDatabaseService } from './services/MyDatabaseService';
import { EventType, MyLoggerService } from './services/MyLoggerService';
import { ArgoService } from './services/ArgoService/createArgoService';
import { getRootLogger } from '@backstage/backend-common';

export async function createRouter({
  httpAuth,
  todoListService,
  myDatabaseService,
  myLoggerService,
  argoService,
}: {
  httpAuth: HttpAuthService;
  todoListService: TodoListService;
  myDatabaseService: MyDatabaseService;
  myLoggerService: MyLoggerService;
  argoService: ArgoService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const logger = getRootLogger();

  // TEMPLATE NOTE:
  // Zod is a powerful library for data validation and recommended in particular
  // for user-defined schemas. In this case we use it for input validation too.
  //
  // If you want to define a schema for your API we recommend using Backstage's
  // OpenAPI tooling: https://backstage.io/docs/next/openapi/01-getting-started
  const todoSchema = z.object({
    title: z.string(),
    entityRef: z.string().optional(),
  });

  // TODO: Add Zod schema for each endpoint
  // TODO: Remove the following example endpoint
  router.post('/todos', async (req, res) => {
    const parsed = todoSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await todoListService.createTodo(parsed.data, {
      credentials: await httpAuth.credentials(req, { allow: ['user'] }),
    });

    res.status(201).json(result);
  });

  router.get('/todos', async (_req, res) => {
    res.json(await myDatabaseService.getTasks());
  });

  router.get('/todos/:id', async (req, res) => {
    res.json(await todoListService.getTodo({ id: req.params.id }));
  });

  router.get('/models', async (_req, res) => {
    res.json(await myDatabaseService.getModels());
  });

  router.post('/models/add', async (req, res) => {
    const { name, version, description, model_uri, registered_by } = req.body;
    const model = await myDatabaseService.addModel(
      name,
      version,
      description,
      model_uri,
      registered_by,
    );
    await myLoggerService.logEvent(
      EventType.MODEL_ADDED,
      `New model added: ${model.name}`,
      String(model.id),
    );
    res.json(model);
  });

  router.get('/jobs', async (_req, res) => {
    res.json(await myDatabaseService.getDataIngestionJobs());
  });

  router.post('/jobs/add', async (req, res) => {
    const { data_source_uri } = req.body;
    const job = await myDatabaseService.addDataIngestionJob(data_source_uri);
    await myLoggerService.logEvent(
      EventType.JOB_ADDED,
      `Job ID ${job.id} was added.`,
      String(job.id),
    );
    res.json(job);
  });

  router.post('/jobs/start/:id', async (req, res) => {
    const { id } = req.params;
    const job = await myDatabaseService
      .getDataIngestionJobs()
      .then(jobs => jobs.find(j => j.id === Number(id)));

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    if (job.status !== 'pending') {
      res.status(409).json({ message: 'Job not in pending state' });
      return;
    }

    await myDatabaseService.startDataIngestionJob(job.id);
    const message = `Job ID ${job.id} has started.`;

    await myLoggerService.logEvent(
      EventType.JOB_STARTED,
      message,
      String(job.id),
    );

    res.status(200).json({ message });
  });

  router.post('/jobs/complete/:id', async (req, res) => {
    const { id } = req.params;
    const job = await myDatabaseService
      .getDataIngestionJobs()
      .then(jobs => jobs.find(j => j.id === Number(id)));

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    if (job.status === 'completed' || job.status === 'failed') {
      res.status(409).json({ message: 'Job already completed or failed' });
      return;
    }

    await myDatabaseService.completeDataIngestionJob(job.id);
    const message = `Job ID ${job.id} has been completed.`;
    await myLoggerService.logEvent(
      EventType.JOB_COMPLETED,
      message,
      String(job.id),
    );
    res.status(200).json({ message });
  });

  router.post('/jobs/fail/:id', async (req, res) => {
    const { id } = req.params;
    const job = await myDatabaseService
      .getDataIngestionJobs()
      .then(jobs => jobs.find(j => j.id === Number(id)));

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    if (job.status === 'completed' || job.status === 'failed') {
      res.status(409).json({ message: 'Job already completed or failed' });
      return;
    }

    await myDatabaseService.failDataIngestionJob(job.id);
    const message = `Job ID ${job.id} has failed.`;

    await myLoggerService.logEvent(
      EventType.JOB_FAILED,
      message,
      String(job.id),
    );
    res.status(200).json({ message });
  });

  router.get('/events', async (_req, res) => {
    res.json(await myLoggerService.getEvents());
  });

  router.post('/argo/applications', async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(401).json({ error: req.body });
        return;
      }

      const applications = await argoService.fetchApplications(token);
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/argo/applications/:appName/sync', async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(401).json({ error: 'Unauthorized: Missing token' });
        return;
      }

      const appName = req.params.appName;
      const result = await argoService.triggerSync(appName, token);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
