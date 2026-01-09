import webPush from 'web-push';
import { MongoClient } from 'mongodb';
// Importamos la base de datos de versículos
import { versesDB } from '../js/verses.js';

// Configuración VAPID
webPush.setVapidDetails(
  'mailto:admin@bibliapp.com', 
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
    
    // 1. Obtener TODOS los usuarios suscritos
    const subscriptions = await collection.find({}).toArray();
    
    if (subscriptions.length === 0) {
        return res.status(200).json({ message: 'No hay suscriptores a quien enviar.' });
    }

    // 2. Elegir UN versículo aleatorio de la lista
    const randomItem = versesDB[Math.floor(Math.random() * versesDB.length)];
    
    // 3. Preparar el mensaje
    const payload = JSON.stringify({
      title: `📖 ${randomItem.r}`,
      body: randomItem.t,
      icon: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      badge: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      url: "./"
    });

    console.log(`Enviando: ${randomItem.r} a ${subscriptions.length} usuarios.`);

    // 4. Enviar a TODOS (Masivo)
    const promises = subscriptions.map(sub => {
      // Quitamos el _id de Mongo porque web-push no lo entiende
      const { _id, ...pushSubscription } = sub;
      
      return webPush.sendNotification(pushSubscription, payload)
        .catch(err => {
          // Si el usuario ya no existe (410) o bloqueó (404), lo borramos de la DB
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`Usuario inactivo eliminado: ${sub.endpoint}`);
            return collection.deleteOne({ endpoint: sub.endpoint });
          }
          console.error("Error enviando a un usuario:", err);
        });
    });

    // Esperar a que se envíen todos
    await Promise.all(promises);
    
    return res.status(200).json({ 
        success: true, 
        verse: randomItem.r, 
        count: subscriptions.length 
    });

  } catch (error) {
    console.error("Error general:", error);
    return res.status(500).json({ error: error.message });
  }
}
