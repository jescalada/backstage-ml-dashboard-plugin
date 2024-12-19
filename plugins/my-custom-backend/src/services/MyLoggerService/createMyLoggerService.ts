import { Knex } from 'knex';
import { Event, EventType } from './types';

/**
 * Create a new instance of MyLoggerService
 *
 * @param client the Knex client to use for database operations
 * @returns MyLoggerService instance with various methods to interact with the database
 */
export function createMyLoggerService(client: Knex) {
  /**
   * Ensure the events table exists in the database
   */
  async function ensureEventsTableExists() {
    const hasTable = await client.schema.hasTable('events');
    if (!hasTable) {
      await client.schema.createTable('events', table => {
        table.increments('id').primary();
        table.string('event_type').notNullable();
        table.string('description');
        table.integer('reference_id').unsigned();
        table.timestamp('created_at').defaultTo(client.fn.now());
      });
      await populateEventsTable();
    }
  }

  /**
   * Populate the events table with some initial data
   */
  async function populateEventsTable() {
    await client('events').insert([
      {
        event_type: EventType.MODEL_ADDED,
        description: 'A new model was added',
        reference_id: '1',
        created_at: new Date(),
      },
      {
        event_type: EventType.JOB_ADDED,
        description: 'A new data ingestion job was added',
        reference_id: '2',
        created_at: new Date(),
      },
    ]);
  }

  ensureEventsTableExists().catch(err => {
    console.error('Error creating events table:', err);
  });

  return {
    async logEvent(
      eventType: EventType,
      description: string,
      referenceId: string,
    ): Promise<Event> {
      const [result] = await client('events')
        .insert({
          event_type: eventType,
          description,
          reference_id: referenceId,
          created_at: new Date(),
        })
        .returning('*');

      return result;
    },

    async getEvents(): Promise<Event[]> {
      return client('events').select('*');
    },
  };
}
