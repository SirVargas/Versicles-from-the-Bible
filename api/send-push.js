import webPush from 'web-push';
import { MongoClient } from 'mongodb';
// IMPORTACIÓN DE LA LISTA COMPARTIDA
import { versesDB as verses } from '../js/verses.js';

webPush.setVapidDetails(
  'mailto:tu-email@ejemplo.com', 
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
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
    
    // 1. Obtener usuarios
    const subscriptions = await collection.find({}).toArray();
    
    if (subscriptions.length === 0) {
        return res.status(200).json({ message: 'Sin suscriptores.' });
    }

    // 2. Elegir versículo de la lista importada
    const randomItem = verses[Math.floor(Math.random() * verses.length)];
    
    const payload = JSON.stringify({
      title: `📖 ${randomItem.r}`,
      body: randomItem.t,
      // Icono absoluto para notificaciones Push
      icon: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      badge: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      url: "./"
    });

    // 3. Enviar masivamente
    const promises = subscriptions.map(sub => {
      const { _id, ...pushSubscription } = sub;
      return webPush.sendNotification(pushSubscription, payload)
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            return collection.deleteOne({ endpoint: sub.endpoint });
          }
        });
    });

    await Promise.all(promises);
    return res.status(200).json({ success: true, verse: randomItem.r });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
