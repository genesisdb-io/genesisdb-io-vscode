// The actions the explorer offers, one per GenesisDB 2.0 route.

export type Action = {
  id: string;
  label: string;
  method: 'GET' | 'POST';
  path: string;
  /** Example request body. Undefined for actions without a body. */
  body?: string;
  /** Changes or replaces data, the UI asks before sending. */
  destructive?: boolean;
  hint: string;
};

const commitExample = `{
  "events": [
    {
      "source": "io.genesisdb.app",
      "subject": "/customer",
      "type": "io.genesisdb.app.customer-added",
      "data": {
        "firstName": "Bruce",
        "lastName": "Wayne",
        "emailAddress": "bruce.wayne@enterprise.wayne"
      }
    },
    {
      "source": "io.genesisdb.app",
      "subject": "/customer",
      "type": "io.genesisdb.app.customer-added",
      "data": {
        "firstName": "Alfred",
        "lastName": "Pennyworth",
        "emailAddress": "alfred.pennyworth@enterprise.wayne"
      },
      "options": { "storeDataAsReference": true }
    },
    {
      "source": "io.genesisdb.store",
      "subject": "/article",
      "type": "io.genesisdb.store.article-added",
      "data": {
        "name": "Tumbler",
        "color": "black",
        "price": 2990000.00
      }
    }
  ],
  "preconditions": [
    {
      "type": "isQueryResultTrue",
      "payload": {
        "query": "STREAM e FROM events WHERE e.data.emailAddress == 'bruce.wayne@enterprise.wayne' MAP COUNT() == 0"
      }
    }
  ]
}`;

const schemaExample = `{
  "type": "io.genesisdb.app.customer-added",
  "schema": {
    "type": "object",
    "properties": {
      "firstName": { "type": "string" },
      "lastName": { "type": "string" },
      "emailAddress": { "type": "string" },
      "phoneNumber": { "type": "string" }
    },
    "required": ["firstName", "lastName", "emailAddress"],
    "additionalProperties": true
  }
}`;

const restoreExample = `[
  {
    "source": "io.genesisdb.app",
    "subject": "/customer/6b6f5aa7-56b5-42ba-b093-fe6e921c863d",
    "type": "io.genesisdb.app.customer-added",
    "id": "d8605ee4-9507-4974-8a2a-190baaea2b50",
    "time": "2026-01-02T15:40:01.188557875Z",
    "data": {
      "firstName": "Bruce",
      "lastName": "Wayne",
      "emailAddress": "bruce.wayne@enterprise.wayne"
    }
  }
]`;

export const actions: Action[] = [
  {
    id: 'commit',
    label: 'Commit',
    method: 'POST',
    path: '/api/v2/commit',
    body: commitExample,
    hint: 'Commits the events atomically after checking the preconditions. Answers with the stored events. A failed precondition answers 412 and writes nothing.',
  },
  {
    id: 'fetch',
    label: 'Fetch',
    method: 'POST',
    path: '/api/v2/fetch',
    body: '{\n  "subject": "/customer"\n}',
    hint: 'Returns the events of the subject and all of its descendants in commit order. Options are optional: lowerBound, includeLowerBoundEvent, upperBound, includeUpperBoundEvent, latestByEventType.',
  },
  {
    id: 'query',
    label: 'Query',
    method: 'POST',
    path: '/api/v2/query',
    body: `{
  "query": "STREAM e FROM events WHERE e.subject UNDER '/customer' ORDER BY e.time DESC MAP { id: e.id, firstName: e.data.firstName }"
}`,
    hint: 'Runs a GDBQL query. Answers one row per line, a bare aggregate such as MAP COUNT() answers the value.',
  },
  {
    id: 'subjects',
    label: 'Subjects',
    method: 'GET',
    path: '/api/v2/subjects',
    hint: 'Lists the distinct top level subjects.',
  },
  {
    id: 'types',
    label: 'Types',
    method: 'GET',
    path: '/api/v2/types',
    hint: 'Lists the distinct event types.',
  },
  {
    id: 'register-schema',
    label: 'Register Schema',
    method: 'POST',
    path: '/api/v2/schemas',
    body: schemaExample,
    hint: 'Registers a schema for an event type. Commits of that type are validated from then on. Answers 409 if the type already has a schema. Administrator token.',
  },
  {
    id: 'schemas',
    label: 'Schemas',
    method: 'GET',
    path: '/api/v2/schemas',
    hint: 'Lists every registered schema.',
  },
  {
    id: 'erase',
    label: 'Erase',
    method: 'POST',
    path: '/api/v2/admin/erase',
    body: '{\n  "subject": "/customer/6b6f5aa7-56b5-42ba-b093-fe6e921c863d"\n}',
    destructive: true,
    hint: 'Erases every reference payload below the subject (events committed with storeDataAsReference). The events and the hash chain stay intact. Inline data is immutable and answers 422. Administrator token.',
  },
  {
    id: 'status',
    label: 'Status',
    method: 'GET',
    path: '/api/v2/status',
    hint: 'Engine version, system, event counts and storage readiness.',
  },
  {
    id: 'audit',
    label: 'Audit',
    method: 'GET',
    path: '/api/v2/admin/audit',
    hint: 'Verifies the hash chain of the whole store. Commits wait while it runs. Administrator token.',
  },
  {
    id: 'restore',
    label: 'Restore',
    method: 'POST',
    path: '/api/v2/admin/restore',
    body: restoreExample,
    destructive: true,
    hint: 'Restores a backup (plain event array or extended form) into an empty store. Use "Load file" to read a backup file. Answers 409 if the store is not empty. Hash chains are recomputed. Administrator token.',
  },
];
