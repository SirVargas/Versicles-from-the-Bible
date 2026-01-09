import { MongoClient } from 'mongodb';
import webPush from 'web-push';

const uri = process.env.MONGODB_URI;
const options = {};

// Configuración VAPID (El mailto es solo para identificación técnica ante Google)
webPush.setVapidDetails(
  'mailto:admin@bibliapp.com', 
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

    // 1. Guardar o Actualizar suscripción
    await collection.updateOne(
      { endpoint: subscription.endpoint },
      { $set: subscription },
      { upsert: true }
    );

    // 2. Enviar Bienvenida Inmediata
    const payload = JSON.stringify({
      title: '¡Suscripción Activa!',
      body: 'Recibirás versículos de bendición automáticamente. 🙏',
      icon: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      badge: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      url: "./"
    });

    // Intentamos enviar la bienvenida, pero no bloqueamos si falla
    try {
        await webPush.sendNotification(subscription, payload);
    } catch (e) {
        console.log("Error enviando bienvenida (posiblemente ya estaba suscrito):", e);
    }

    return res.status(201).json({ message: 'Guardado correctamente.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno.' });
  }
}
