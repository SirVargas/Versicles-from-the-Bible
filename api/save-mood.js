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
    const { image, emotion, verse, confidence } = req.body;
    
    if (!emotion || !image) return res.status(400).json({ error: 'Faltan datos' });

    const client = await clientPromise;
    const db = client.db('biblia_app');
    const collection = db.collection('mood_history');

    // Guardamos el registro
    const record = {
      timestamp: new Date(),
      emotion: emotion,
      confidence: confidence,
      verse_text: verse.t,
      verse_ref: verse.r,
      image_data: image // Cuidado: Esto ocupa espacio. Base64 string.
    };

    await collection.insertOne(record);

    return res.status(200).json({ message: 'Momento guardado con éxito.' });
  } catch (error) {
    console.error("Error guardando mood:", error);
    return res.status(500).json({ error: error.message });
  }
}
