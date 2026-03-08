const { Client } = require("@elastic/elasticsearch");
const { elasticSchema } = require("../model/elasticSearchModel");

const ELASTICSEARCH_URL =
  process.env.ELASTICSEARCH_URL || "http://localhost:9200";

let esClient = null;

const connectElasticSearch = async () => {
  try {
    console.log("initializing client");
    esClient = new Client({
      node: "http://localhost:9200",
      maxRetries: 5,
      requestTimeout: 10000,
    });
    // console.log(esClient);
  } catch (err) {
    // console.log(err.message);
  }
};

const getElasticsearchClient = () => {
  // console.log(esClient);
  if (!esClient) {
    throw new Error("Elasticsearch client not initialized");
  }
  return esClient;
};

const ensureelasticSchema = async () => {
  const client = getElasticsearchClient();
  const { index, settings, mappings } = elasticSchema;
  const exists = await client.indices.exists({ index });
  console.log(index, settings);
  // console.log(await client.indices.exists());
  console.log(exists);
  if (!exists) {
    await client.indices.create({ index, settings, mappings });
    console.log(`Elasticsearch index created: ${index}`);
  }
};

module.exports = {
  connectElasticSearch,
  getElasticsearchClient,
  ensureelasticSchema,
  elasticSchema,
};
