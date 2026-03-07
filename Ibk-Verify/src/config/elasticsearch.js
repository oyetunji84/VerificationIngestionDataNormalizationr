const { Client } = require("@elastic/elasticsearch");
const { elasticSchema } = require("../model/elasticSearchModel");

const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL || "http://localhost:9200";

let esClient = null;

const connectElasticsearch = async () => {
  esClient = new Client({
    node: ELASTICSEARCH_URL,
    maxRetries: 5,
    requestTimeout: 10000,
  });
};

const getElasticsearchClient = () => {
  if (!esClient) {
    throw new Error("Elasticsearch client not initialized");
  }
  return esClient;
};

const ensureelasticSchema = async () => {
  const client = getElasticsearchClient();
  const { index, settings, mappings } = elasticSchema;
  const exists = await client.indices.exists({ index });
  if (!exists) {
    await client.indices.create({ index, settings, mappings });
    console.log(`Elasticsearch index created: ${index}`);
  }
};

module.exports = {
  connectElasticsearch,
  getElasticsearchClient,
  ensureelasticSchema,
  elasticSchema,
};
