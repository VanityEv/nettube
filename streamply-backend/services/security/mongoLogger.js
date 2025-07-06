// services/security/mongoLogger.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'streamply_logs';
const collectionName = 'security_events';

let client, collection;

export async function connectLogger() {
  if (!client) {
    client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();
    collection = client.db(dbName).collection(collectionName);
  }
}

export async function logSecurityEvent(event) {
  await connectLogger();
  await collection.insertOne({ ...event, timestamp: new Date() });
}

export async function getRecentSecurityEvents(limit = 100) {
  await connectLogger();
  return collection.find().sort({ timestamp: -1 }).limit(limit).toArray();
}
