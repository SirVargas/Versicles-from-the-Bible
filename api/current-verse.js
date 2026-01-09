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
  try {
    const client = await clientPromise;
    const db = client.db('biblia_app');
    const collectionState = db.collection('app_state');

    // Buscar el último versículo guardado
    const record = await collectionState.findOne({ id: 'latest_verse' });

    if (record && record.data) {
        return res.status(200).json(record.data);
    } else {
        // Si es la primera vez y no hay nada en DB
        return res.status(404).json({ message: 'No hay versículo sincronizado aún' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
