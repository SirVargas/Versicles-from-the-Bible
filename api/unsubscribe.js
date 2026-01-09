import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};
let client;
let clientPromise;

if (!process.env.MONGODB_URI) throw new Error('Falta la variable MONGODB_URI');

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
  // Validar método
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { endpoint } = req.body;
    
    // Validar datos
    if (!endpoint) {
      return res.status(400).json({ error: 'Falta el endpoint de la suscripción' });
    }

    const client = await clientPromise;
    const db = client.db('biblia_app');
    const collection = db.collection('subscriptions');

    // Borrar suscripción de la DB
    const result = await collection.deleteOne({ endpoint: endpoint });

    if (result.deletedCount === 0) {
       // Opcional: Si no existía, igual retornamos éxito o un aviso
       console.log("El endpoint no existía en la BD, pero se procedió.");
    }

    return res.status(200).json({ message: 'Desuscrito correctamente.' });

  } catch (error) {
    console.error("Error al desuscribir:", error);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}
