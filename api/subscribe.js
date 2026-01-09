import { MongoClient } from 'mongodb';
import webPush from 'web-push';

const uri = process.env.MONGODB_URI;
const options = {};

// Validación crítica al inicio
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error("❌ [API] Error Crítico: Faltan llaves VAPID en Vercel.");
}

webPush.setVapidDetails(
  'mailto:admin@bibliapp.com', 
  process.env.VAPID_PUBLIC_KEY,
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
    const { subscription, firstVerse } = req.body;
    
    if (!subscription || !subscription.endpoint) {
        console.warn("⚠️ [API] Intento de suscripción inválida recibida.");
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    const client = await clientPromise;
    const db = client.db('biblia_app'); 
    const collection = db.collection('subscriptions');

    await collection.updateOne(
      { endpoint: subscription.endpoint },
      { $set: subscription },
      { upsert: true }
    );

    // Preparar Bienvenida
    const title = firstVerse ? `¡Bienvenido! Tu palabra de hoy:` : '¡Suscripción Activa!';
    const body = firstVerse ? `${firstVerse.t} (${firstVerse.r})` : 'Recibirás versículos de bendición automáticamente. 🙏';

    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: "https://versicles-from-the-bible.vercel.app/img/icon.png",
      badge: "https://versicles-from-the-bible.vercel.app/img/icon.png",
      url: "./"
    });

    // --- LOG CRÍTICO SOLO SI FALLA ---
    try {
        await webPush.sendNotification(subscription, payload);
        console.log("✅ [API] Bienvenida enviada correctamente.");
    } catch (e) {
        console.error("❌ [API] Error enviando Push de Bienvenida:");
        console.error(`👉 Status: ${e.statusCode}`);
        console.error(`👉 Google dice: ${e.body}`);
    }

    return res.status(201).json({ message: 'Suscrito correctamente.' });

  } catch (error) {
    console.error("❌ [API] Error Interno del Servidor:", error);
    return res.status(500).json({ error: 'Error interno' });
  }
}
