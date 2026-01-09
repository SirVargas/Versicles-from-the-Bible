import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};
let client;
let clientPromise;

if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI');

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { endpoint } = req.body;
    
    if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });

    const client = await clientPromise;
    const db = client.db('biblia_app');
    const collection = db.collection('subscriptions');

    // Borrar suscripción de la DB
    await collection.deleteOne({ endpoint: endpoint });

    return res.status(200).json({ message: 'Unsubscribed successfully.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
