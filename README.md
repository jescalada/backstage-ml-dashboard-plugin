# ML Dashboard Plugin for Backstage

This repository contains a custom Backstage plugin, `my-custom`, along with its corresponding backend, `my-custom-backend`. This plugin is designed to integrate with a PostgreSQL database (which may be in a Docker container) and includes functionality for tracking data ingestion jobs, logging ML events, and managing ML model metadata.

---

## Getting Started

Just clone the repo and run `yarn install && yarn dev` to start the Backstage instance with the custom plugin. Accessing `http://localhost:3000/my-custom` will take you to the custom plugin's dashboard, or otherwise just click on the `My Custom Plugin` tab in the sidebar.

## Project Structure

Backstage plugins are divided into frontend plugins (UI components) and backend plugins (business logic and APIs). This project follows the same structure, with the frontend plugin located in `plugins/my-custom` and the backend plugin in `plugins/my-custom-backend`.

Database operations are handled by the backend plugin. Each service receives a connection to the database via a `Knex` instance. This instance is configured in `app-config.yaml` and can be customized to connect to your own database.

## Database Connection
The database connection has been temporarily hard-coded due to my lack of knowledge on how to integrate with Dockerized PostgreSQL databases. This can be changed in the `app-config.yaml` file.

```yaml
backend:
  database:
    client: pg
    connection:
      host: localhost
      user: postgres
      password: admin
      port: 5432
```

### Frontend (`plugins/my-custom`)

The frontend plugin contains all the UI components and routing logic. Right now, there are no extra routes or pages. Everything is accessible from http://localhost:3000/my-custom assuming you are running the Backstage instance locally.

#### Components:
- **DataIngestionTracker**: Tracks and displays the status of data ingestion jobs. Interacts with the backend to fetch job details and change job status.
  - Has a form that allows "uploading" a job by adding its string URI to the DB.
  - Each job can be started, completed, or failed.
- **EventLog**: A dashboard to view a chronological log of events, such as job status changes or model updates.
  - Events are fetched from the backend and displayed in a list.
  - Events are logged in the backend using the `MyLoggerService`.
- **ExampleComponent**: A placeholder/example component showcasing how to build a new UI component.
  - Right now, this is the main component displayed on the dashboard when accessing `/my-custom`.
- **ExampleFetchComponent**: Demonstrates how to fetch data from the backend using the `discoveryApi`.
  - Dummy component that fetches a list of to-do items from the backend. Will remove in the future.
  - Demonstrates how to use authentication to access backend services.
- **ModelDashboard**: Displays metadata about machine learning models, such as their current status, version, and linked data ingestion jobs.
  - Currently allows uploading model URIs to the DB and viewing the list of models.
  - **TODO: Integrate with a model registry/tracker.**

#### Other Files:
- **`index.ts`**: The entry point for the frontend plugin, exporting the main components and features.
- **`plugin.ts`**: Registers the plugin with Backstage and defines routes and extension points.
- **`routes.ts`**: Defines the **Front-End** routing structure for the plugin.
- **`setupTests.ts`**: Sets up the testing environment for frontend components (none at the moment).
- **`.eslintrc.js`**: Linting configuration for maintaining consistent coding standards.
- **`README.md`**: Auto-generated when scaffolding new plugin using the Backstage CLI.

---

### Backend (`plugins/my-custom-backend`)

The backend plugin handles business logic, database interaction, and provides REST APIs to be consumed by the frontend. The API is automatically running at `localhost:7007` as defined in `app-config.yaml`. 

#### Services:
- **MyDatabaseService**: Handles database operations, such as fetching and updating data ingestion jobs or model metadata.
  - Uses `Knex.js` to interact with the PostgreSQL database.
  - Handles all database operations except logging.
  - May be split into multiple services in the future for better separation of concerns.
- **MyLoggerService**: Responsible for logging events, such as job status changes or errors, into the `EventLog`.
  - Logs events to the database, which can be fetched by the frontend.
  - Can be extended to log to external services or monitoring tools.
- **TodoListService**: (Placeholder/Example) A service for managing a simple to-do list. Included for demonstration purposes.
  - This service makes use of auth to fetch to-do items and log the current user's identity to the plugin's database.
  - It will be removed in the future, as it is not part of the main functionality.

#### Other Files:
- **`index.ts`**: The entry point for the backend plugin.
- **`plugin.ts`**: Registers backend features and services with Backstage.
- **`router.ts`**: Defines the API endpoints exposed by the backend plugin.
- **`router.test.ts`**: Contains tests for the API endpoints (none at the moment).
- **`setupTests.ts`**: Sets up the testing environment for backend services.
- **`.eslintrc.js`**: Linting configuration for the backend code.
- **`README.md`**: Auto-generated when scaffolding new plugin using the Backstage CLI.

---

## Features

### 1. **Data Ingestion Tracker**
- View the list of data ingestion jobs.
- Start, complete, or fail jobs and track their progress.
- Fetch data from a PostgreSQL database through the backend.

### 2. **Model Dashboard**
- Display information about machine learning models (e.g., name, version).
- Add new models to the database and view the list of existing models.

### 3. **Event Logging**
- Track any user-triggered actions (job status changes, model updates, etc.).
- View events in a chronological order in the `EventLog` table (may be refactored into a more visually appealing format).

---

## Contributing

Contributions are welcome! Please follow Backstage contribution guidelines and the code of conduct when submitting pull requests or issues.

## Contact

For any questions or feedback, feel free to [email me](mailto:juanescalada175@gmail.com).