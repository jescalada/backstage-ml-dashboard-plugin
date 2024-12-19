import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { TodoListService } from './services/TodoListService/types';
import { MyDatabaseService } from './services/MyDatabaseService/types';

export async function createRouter({
  httpAuth,
  todoListService,
  myDatabaseService,
}: {
  httpAuth: HttpAuthService;
  todoListService: TodoListService;
  myDatabaseService: MyDatabaseService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

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
    const { name, version, description, model_uri } = req.body;
    res.json(
      await myDatabaseService.addModel(name, version, description, model_uri),
    );
  });

  router.get('/jobs', async (_req, res) => {
    res.json(await myDatabaseService.getDataIngestionJobs());
  });

  router.post('/jobs/add', async (req, res) => {
    const { data_source_uri } = req.body;
    await myDatabaseService.addDataIngestionJob(data_source_uri);
    res.status(201).send();
  });

  router.post('/jobs/start/:id', async (req, res) => {
    const { id } = req.params;
    const job = await myDatabaseService
      .getDataIngestionJobs()
      .then(jobs => jobs.find(j => j.id === Number(id)));

    if (!job) {
      res.status(404).send({ message: 'Job not found' });
      return;
    }

    if (job.status !== 'pending') {
      res.status(409).send({ message: 'Job not in pending state' });
      return;
    }

    await myDatabaseService.startDataIngestionJob(job.id);
    res.status(204).send();
  });

  router.post('/jobs/complete/:id', async (req, res) => {
    const { id } = req.params;
    const job = await myDatabaseService
      .getDataIngestionJobs()
      .then(jobs => jobs.find(j => j.id === Number(id)));

    if (!job) {
      res.status(404).send({ message: 'Job not found' });
      return;
    }

    if (job.status === 'completed' || job.status === 'failed') {
      res.status(409).send({ message: 'Job already completed or failed' });
      return;
    }

    await myDatabaseService.completeDataIngestionJob(job.id);
    res.status(204).send();
  });

  router.post('/jobs/fail/:id', async (req, res) => {
    const { id } = req.params;
    const job = await myDatabaseService
      .getDataIngestionJobs()
      .then(jobs => jobs.find(j => j.id === Number(id)));

    if (!job) {
      res.status(404).send({ message: 'Job not found' });
      return;
    }

    if (job.status === 'completed' || job.status === 'failed') {
      res.status(409).send({ message: 'Job already completed or failed' });
      return;
    }

    await myDatabaseService.failDataIngestionJob(job.id);
    res.status(204).send();
  });

  return router;
}
