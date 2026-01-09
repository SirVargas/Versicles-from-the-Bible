import { MongoClient } from 'mongodb';
import webPush from 'web-push'; // Importamos esto para enviar el mensaje

const uri = process.env.MONGODB_URI;
const options = {};

// Configurar llaves también aquí para el mensaje de bienvenida
webPush.setVapidDetails(
  'mailto:tu-email@ejemplo.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
    const subscription = req.body;
    const client = await clientPromise;
    const db = client.db('biblia_app'); 
    const collection = db.collection('subscriptions');

    // 1. Guardar suscripción
    await collection.updateOne(
      { endpoint: subscription.endpoint },
      { $set: subscription },
      { upsert: true }
    );

    // 2. ENVIAR NOTIFICACIÓN DE BIENVENIDA (INMEDIATA)
    const payload = JSON.stringify({
      title: '¡Bienvenido!',
      body: 'Has activado los versículos diarios correctamente. Dios te bendiga.',
      icon: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      badge: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      url: "./"
    });

    try {
        await webPush.sendNotification(subscription, payload);
    } catch (pushError) {
        console.error("Error enviando bienvenida:", pushError);
        // No fallamos la petición si esto falla, pero lo registramos
    }

    return res.status(201).json({ message: 'Guardado y notificado.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno.' });
  }
}
