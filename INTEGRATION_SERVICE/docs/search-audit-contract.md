# Search & Audit Contract

## Index Queue Payload (body)

Payload mirrors `src/models/historyModel.js`:

```json
{
  "apiKey": "string",
  "requestId": "string",
  "serviceType": "NIN|BVN|DRIVERS_LICENSE|PASSPORT",
  "requestedAt": "ISO date",
  "status": "SUCCESS|FAILED|PARTIAL",
  "errorMessage": "string|null",
  "errorCode": "string|null",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

## Trace Propagation

`traceId` is propagated through RabbitMQ headers:

- `x-trace-id`
- `traceparent`

The index worker reads `traceId` from headers and stores it in Elasticsearch.

## Elasticsearch Document Shape

Stored fields:

- all payload fields above
- `traceId`
- `indexedAt`
- `searchText`

`_id` strategy:

1. Use `requestId` when present.
2. Fallback deterministic SHA-256 hash of key history fields.
