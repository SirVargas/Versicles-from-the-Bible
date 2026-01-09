import { MongoClient } from 'mongodb';
import webPush from 'web-push';

const uri = process.env.MONGODB_URI;
const options = {};

// 1. Configuración de VAPID con logs de seguridad
try {
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        console.error("❌ [API] Error Crítico: Faltan variables de entorno VAPID.");
    }

    webPush.setVapidDetails(
      'mailto:admin@bibliapp.com', 
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log("✅ [API] VAPID configurado correctamente.");
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
  // Solo permitimos POST
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { subscription, firstVerse } = req.body;
    
    // Log para ver qué llega desde el celular
    console.log("📥 [API] Datos recibidos:", JSON.stringify({
        endpoint: subscription?.endpoint ? 'OK (Presente)' : 'FALTA',
        hasVerse: !!firstVerse
    }));

    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Falta suscripción válida' });
    }

    // 2. Guardar en Base de Datos
    const client = await clientPromise;
    const db = client.db('biblia_app'); 
    const collection = db.collection('subscriptions');

    await collection.updateOne(
      { endpoint: subscription.endpoint },
      { $set: subscription },
      { upsert: true }
    );
    console.log("💾 [API] Usuario guardado en MongoDB.");

    // 3. Preparar Notificación de Bienvenida
    const title = firstVerse ? `¡Bienvenido! Tu palabra de hoy:` : '¡Suscripción Activa!';
    const body = firstVerse ? `${firstVerse.t} (${firstVerse.r})` : 'Recibirás versículos de bendición automáticamente. 🙏';

    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      badge: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      url: "./"
    });

    // 4. Intentar enviar Push y capturar error específico
    let pushResult = { success: false, detail: 'No intentado' };
    
    try {
        console.log("🚀 [API] Enviando Push de prueba...");
        await webPush.sendNotification(subscription, payload);
        console.log("✅ [API] Push enviado correctamente.");
        pushResult = { success: true, detail: 'Enviado' };
    } catch (e) {
        console.error("❌ [API] Falló el envío Push:", e);
        // Enviamos el error al frontend para que lo veas en Eruda
        pushResult = { success: false, detail: e.message, statusCode: e.statusCode };
    }

    // Retornamos el estado del Push al frontend
    return res.status(201).json({ 
        message: 'Guardado.', 
        pushStatus: pushResult 
    });

  } catch (error) {
    console.error("❌ [API] Error interno:", error);
    return res.status(500).json({ error: error.message });
  }
}
