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
    const collectionSub = db.collection('subscriptions');
    const collectionState = db.collection('app_state'); // Nueva colección para el estado
    
    // 1. Elegir versículo aleatorio
    const randomItem = versesDB[Math.floor(Math.random() * versesDB.length)];

    // 2. GUARDAR en DB para sincronizar con la web
    // Usamos 'upsert' para sobrescribir siempre el mismo registro
    await collectionState.updateOne(
        { id: 'latest_verse' },
        { $set: { id: 'latest_verse', data: randomItem, date: new Date() } },
        { upsert: true }
    );
    
    const subscriptions = await collectionSub.find({}).toArray();
    
    if (subscriptions.length === 0) {
        console.log("ℹ️ [Cron] Versículo actualizado, pero no hay suscriptores.");
        return res.status(200).json({ message: 'Sin suscriptores, DB actualizada.' });
    }

    const payload = JSON.stringify({
      title: `📖 ${randomItem.r}`,
      body: randomItem.t,
      icon: "https://versicles-from-the-bible.vercel.app/img/icon.png",
      badge: "https://versicles-from-the-bible.vercel.app/img/badge.png",
      url: "./"
    });

    console.log(`🚀 [Cron] Enviando "${randomItem.r}" a ${subscriptions.length} usuarios...`);

    const promises = subscriptions.map(sub => {
      const { _id, ...pushSubscription } = sub;
      return webPush.sendNotification(pushSubscription, payload)
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            return collectionSub.deleteOne({ endpoint: sub.endpoint });
          }
        });
    });

    await Promise.all(promises);
    
    console.log("✅ [Cron] Proceso finalizado.");
    return res.status(200).json({ success: true, verse: randomItem.r });

  } catch (error) {
    console.error("❌ [Cron] Error Fatal:", error);
    return res.status(500).json({ error: error.message });
  }
}
