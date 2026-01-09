import { MongoClient } from 'mongodb';
import webPush from 'web-push';

const uri = process.env.MONGODB_URI;
const options = {};

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
    // Recibimos la suscripción Y el primer versículo del frontend
    const { subscription, firstVerse } = req.body;
    
    // Validación simple
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Falta suscripción' });
    }

    const client = await clientPromise;
    const db = client.db('biblia_app'); 
    const collection = db.collection('subscriptions');

    await collection.updateOne(
      { endpoint: subscription.endpoint },
      { $set: subscription },
      { upsert: true }
    );

    // --- PREPARAR MENSAJE DE BIENVENIDA ---
    // Si el frontend nos mandó un versículo, lo usamos. Si no, usamos uno genérico.
    const title = firstVerse 
        ? `¡Bienvenido! Tu palabra de hoy:` 
        : '¡Suscripción Activa!';
        
    const body = firstVerse 
        ? `${firstVerse.t} (${firstVerse.r})` 
        : 'Recibirás versículos de bendición automáticamente. 🙏';

    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      badge: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      url: "./"
    });

    try {
        await webPush.sendNotification(subscription, payload);
    } catch (e) {
        console.log("Error enviando bienvenida:", e);
    }

    return res.status(201).json({ message: 'Guardado correctamente.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno.' });
  }
}
