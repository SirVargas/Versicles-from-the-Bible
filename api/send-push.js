import webPush from 'web-push';
import { MongoClient } from 'mongodb';
import { versesDB } from '../js/verses.js';

webPush.setVapidDetails(
  'mailto:admin@bibliapp.com', 
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
    const collection = db.collection('subscriptions');
    
    const subscriptions = await collection.find({}).toArray();
    
    if (subscriptions.length === 0) {
        console.log("ℹ️ [Cron] No hay suscriptores activos.");
        return res.status(200).json({ message: 'Sin suscriptores.' });
    }

    const randomItem = versesDB[Math.floor(Math.random() * versesDB.length)];
    
    const payload = JSON.stringify({
      title: `📖 ${randomItem.r}`,
      body: randomItem.t,
      icon: "https://versicles-from-the-bible.vercel.app/img/icon.png",
      badge: "https://versicles-from-the-bible.vercel.app/img/icon.png",
      url: "./"
    });

    console.log(`🚀 [Cron] Iniciando envío a ${subscriptions.length} usuarios...`);

    const promises = subscriptions.map(sub => {
      const { _id, ...pushSubscription } = sub;
      
      return webPush.sendNotification(pushSubscription, payload)
        .catch(err => {
          // Log solo si eliminamos un usuario (importante saberlo)
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`🗑️ [Cron] Usuario inactivo eliminado: ${sub.endpoint.slice(0, 20)}...`);
            return collection.deleteOne({ endpoint: sub.endpoint });
          }
          console.error(`❌ [Cron] Error enviando a un usuario: ${err.statusCode}`);
        });
    });

    await Promise.all(promises);
    
    console.log("✅ [Cron] Proceso finalizado.");
    return res.status(200).json({ success: true, count: subscriptions.length });

  } catch (error) {
    console.error("❌ [Cron] Error Fatal:", error);
    return res.status(500).json({ error: error.message });
  }
}
