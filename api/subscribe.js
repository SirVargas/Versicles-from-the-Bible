import { MongoClient } from 'mongodb';
import webPush from 'web-push';

const uri = process.env.MONGODB_URI;
const options = {};

// 1. Configuración VAPID
try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
        console.error("❌ [API] Error: Faltan las llaves VAPID en Vercel.");
    } else {
        webPush.setVapidDetails(
          'mailto:admin@bibliapp.com', 
          publicKey,
          privateKey
        );
        console.log("✅ [API] VAPID configurado correctamente.");
    }
} catch (configError) {
    console.error("❌ [API] Error configurando VAPID:", configError);
}

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
    
    // Log de seguridad
    console.log("📥 [API] Datos recibidos:", JSON.stringify({
        endpoint: subscription?.endpoint ? 'OK' : 'FALTA',
        hasVerse: !!firstVerse
    }));

    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Falta suscripción válida' });
    }

    const client = await clientPromise;
    const db = client.db('biblia_app'); 
    const collection = db.collection('subscriptions');

    await collection.updateOne(
      { endpoint: subscription.endpoint },
      { $set: subscription },
      { upsert: true }
    );

    // Bienvenida
    const title = firstVerse ? `¡Bienvenido! Tu palabra de hoy:` : '¡Suscripción Activa!';
    const body = firstVerse ? `${firstVerse.t} (${firstVerse.r})` : 'Recibirás versículos de bendición automáticamente. 🙏';

    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      badge: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      url: "./"
    });

    // Enviar Push
    let pushResult = { success: false, detail: 'No intentado' };
    
    try {
        await webPush.sendNotification(subscription, payload);
        console.log("✅ [API] Push enviado correctamente.");
        pushResult = { success: true, detail: 'Enviado' };
    } catch (e) {
        console.error("❌ [API] Falló el envío Push:", e);
        pushResult = { success: false, detail: e.message, statusCode: e.statusCode };
    }

    return res.status(201).json({ message: 'Guardado.', pushStatus: pushResult });

  } catch (error) {
    console.error("❌ [API] Error interno:", error);
    return res.status(500).json({ error: error.message });
  }
}
