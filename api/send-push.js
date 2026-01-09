import webPush from 'web-push';
import { MongoClient } from 'mongodb';

webPush.setVapidDetails(
  'mailto:tu-email@ejemplo.com', 
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// --- LISTA MAESTRA DE VERSÍCULOS ---
const verses = [
    { r: "Salmos 23:1", t: "Dios es mi pastor; nada me faltará." },
    { r: "Filipenses 4:13", t: "Todo lo puedo en Cristo que me fortalece." },
    { r: "Isaías 41:10", t: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo." },
    { r: "Josué 1:9", t: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Dios tu Señor estará contigo." },
    { r: "Salmos 27:1", t: "Dios es mi luz y mi salvación; ¿de quién temeré? Dios es la fortaleza de mi vida." },
    { r: "Salmos 46:1", t: "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones." },
    { r: "Isaías 40:31", t: "Pero los que esperan a Dios tendrán nuevas fuerzas; levantarán alas como las águilas." },
    { r: "2 Timoteo 1:7", t: "Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio." },
    { r: "Salmos 28:7", t: "Dios es mi fortaleza y mi escudo; en él confió mi corazón, y fui ayudado." },
    { r: "Nahúm 1:7", t: "Bueno es Dios, fortaleza en el día de la angustia; y conoce a los que en él confían." },
    { r: "Salmos 18:2", t: "Dios, roca mía y castillo mío, y mi libertador; Dios mío, fortaleza mía, en él confiaré." },
    { r: "Salmos 118:14", t: "Mi fortaleza y mi cántico es Dios, y él me ha sido por salvación." },
    { r: "Habacuc 3:19", t: "Dios el Señor es mi fortaleza, el cual hace mis pies como de ciervas." },
    { r: "Efesios 6:10", t: "Por lo demás, hermanos míos, fortaleceos en el Señor, y en el poder de su fuerza." },
    { r: "Isaías 12:2", t: "He aquí Dios es salvación mía; me aseguraré y no temeré." },
    { r: "Nehemías 8:10", t: "No os entristezcáis, porque el gozo de Dios es vuestra fuerza." },
    { r: "Filipenses 4:6-7", t: "Por nada estéis afanosos... y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones." },
    { r: "Juan 14:27", t: "La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón." },
    { r: "Salmos 4:8", t: "En paz me acostaré, y asimismo dormiré; porque solo tú, Dios, me haces vivir confiado." },
    { r: "Mateo 11:28", t: "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar." },
    { r: "1 Pedro 5:7", t: "Echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros." },
    { r: "Salmos 34:4", t: "Busqué a Dios, y él me oyó, y me libró de todos mis temores." },
    { r: "Isaías 26:3", t: "Tú guardarás en completa paz a aquel cuyo pensamiento en ti persevera; porque en ti ha confiado." },
    { r: "Salmos 55:22", t: "Echa sobre Dios tu carga, y él te sustentará; no dejará para siempre caído al justo." },
    { r: "2 Tesalonicenses 3:16", t: "Y el mismo Señor de paz os dé siempre paz en toda manera." },
    { r: "Colosenses 3:15", t: "Y la paz de Dios gobierne en vuestros corazones." },
    { r: "Salmos 119:165", t: "Mucha paz tienen los que aman tu ley, y no hay para ellos tropiezo." },
    { r: "Proverbios 3:24", t: "Cuando te acuestes, no tendrás temor, sino que te acostarás, y tu sueño será grato." },
    { r: "Salmos 94:19", t: "En la multitud de mis pensamientos dentro de mí, tus consolaciones alegraban mi alma." },
    { r: "Juan 16:33", t: "En el mundo tendréis aflicción; pero confiad, yo he vencido al mundo." },
    { r: "Juan 3:16", t: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito." },
    { r: "Romanos 5:8", t: "Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros." },
    { r: "1 Juan 4:19", t: "Nosotros le amamos a él, porque él nos amó primero." },
    { r: "Jeremías 31:3", t: "Con amor eterno te he amado; por tanto, te prolongué mi misericordia." },
    { r: "Romanos 8:38-39", t: "Por lo cual estoy seguro de que ni la muerte, ni la vida... nos podrá separar del amor de Dios." },
    { r: "Efesios 2:8", t: "Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios." },
    { r: "Lamentaciones 3:22-23", t: "Por la misericordia de Dios no hemos sido consumidos, porque nunca decayeron sus misericordias." },
    { r: "Salmos 86:15", t: "Mas tú, Señor, Dios misericordioso y clemente, lento para la ira, y grande en misericordia y verdad." },
    { r: "Sofonías 3:17", t: "Dios está en medio de ti... se gozará sobre ti con alegría, callará de amor." },
    { r: "1 Juan 3:1", t: "Mirad cuál amor nos ha dado el Padre, para que seamos llamados hijos de Dios." },
    { r: "Gálatas 2:20", t: "El cual me amó y se entregó a sí mismo por mí." },
    { r: "Salmos 136:1", t: "Alabad a Dios, porque él es bueno, porque para siempre es su misericordia." },
    { r: "Salmos 103:8", t: "Misericordioso y clemente es Dios; lento para la ira, y grande en misericordia." },
    { r: "Proverbios 8:17", t: "Yo amo a los que me aman, y me hallan los que temprano me buscan." },
    { r: "Proverbios 3:5-6", t: "Fíate de Dios de todo tu corazón... Reconócelo en todos tus caminos." },
    { r: "Salmos 119:105", t: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino." },
    { r: "Santiago 1:5", t: "Y si alguno de vosotros tiene falta de sabiduría, pídala a Dios." },
    { r: "Salmos 32:8", t: "Te haré entender, y te enseñaré el camino en que debes andar." },
    { r: "Jeremías 33:3", t: "Clama a mí, y yo te responderé, y te enseñaré cosas grandes y ocultas." },
    { r: "Proverbios 16:3", t: "Encomienda a Dios tus obras, y tus pensamientos serán afirmados." },
    { r: "Salmos 37:5", t: "Encomienda a Dios tu camino, y confía en él; y él hará." },
    { r: "Proverbios 1:7", t: "El principio de la sabiduría es el temor de Dios." },
    { r: "Salmos 143:10", t: "Enséñame a hacer tu voluntad, porque tú eres mi Dios." },
    { r: "Isaías 30:21", t: "Entonces tus oídos oirán a tus espaldas palabra que diga: Este es el camino, andad por él." },
    { r: "Salmos 25:4", t: "Muéstrame, oh Dios, tus caminos; enséñame tus sendas." },
    { r: "Proverbios 2:6", t: "Porque Dios da la sabiduría, y de su boca viene el conocimiento y la inteligencia." },
    { r: "Romanos 12:2", t: "Transformaos por medio de la renovación de vuestro entendimiento." },
    { r: "Salmos 73:24", t: "Me has guiado según tu consejo, y después me recibirás en gloria." },
    { r: "Salmos 91:1-2", t: "El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente." },
    { r: "Salmos 91:11", t: "Pues a sus ángeles mandará acerca de ti, que te guarden en todos tus caminos." },
    { r: "Salmos 121:7", t: "Dios te guardará de todo mal; él guardará tu alma." },
    { r: "Isaías 54:17", t: "Ninguna arma forjada contra ti prosperará." },
    { r: "Salmos 34:7", t: "El ángel de Dios acampa alrededor de los que le temen, y los defiende." },
    { r: "Proverbios 18:10", t: "Torre fuerte es el nombre de Dios; a él correrá el justo, y será levantado." },
    { r: "Salmos 121:1-2", t: "Mi socorro viene de Dios, que hizo los cielos y la tierra." },
    { r: "2 Tesalonicenses 3:3", t: "Pero fiel es el Señor, que os afirmará y guardará del mal." },
    { r: "Salmos 3:3", t: "Mas tú, Dios, eres escudo alrededor de mí; mi gloria, y el que levanta mi cabeza." },
    { r: "Salmos 138:7", t: "Si anduviere yo en medio de la angustia, tú me vivificarás." },
    { r: "Deuteronomio 31:6", t: "Esforzaos y cobrad ánimo... porque Dios tu Señor es el que va contigo." },
    { r: "Salmos 16:1", t: "Guárdame, oh Dios, porque en ti he confiado." },
    { r: "Jeremías 29:11", t: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Dios, pensamientos de paz." },
    { r: "Romanos 8:28", t: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien." },
    { r: "Hebreos 11:1", t: "Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve." },
    { r: "2 Corintios 5:7", t: "Porque por fe andamos, no por vista." },
    { r: "Marcos 9:23", t: "Jesús le dijo: Si puedes creer, al que cree todo le es posible." },
    { r: "Lucas 1:37", t: "Porque nada hay imposible para Dios." },
    { r: "Salmos 37:4", t: "Deléitate asimismo en Dios, y él te concederá las peticiones de tu corazón." },
    { r: "Mateo 17:20", t: "Si tuviereis fe como un grano de mostaza... nada os será imposible." },
    { r: "Salmos 62:5", t: "Alma mía, en Dios solamente reposa, porque de él es mi esperanza." },
    { r: "Romanos 15:13", t: "Y el Dios de esperanza os llene de todo gozo y paz en el creer." },
    { r: "Salmos 71:5", t: "Porque tú, oh Señor Dios, eres mi esperanza, seguridad mía desde mi juventud." },
    { r: "Lamentaciones 3:24", t: "Mi porción es Dios, dijo mi alma; por tanto, en él esperaré." },
    { r: "Isaías 43:19", t: "He aquí que yo hago cosa nueva; pronto saldrá a luz." },
    { r: "Hebreos 10:23", t: "Mantengamos firme, sin fluctuar, la profesión de nuestra esperanza, porque fiel es el que prometió." },
    { r: "Salmos 150:6", t: "Todo lo que respira alabe a Dios. Aleluya." },
    { r: "Salmos 103:1", t: "Bendice, alma mía, a Dios, y bendiga todo mi ser su santo nombre." },
    { r: "1 Tesalonicenses 5:18", t: "Dad gracias en todo, porque esta es la voluntad de Dios." },
    { r: "Salmos 118:24", t: "Este es el día que hizo Dios; nos gozaremos y alegraremos en él." },
    { r: "Salmos 19:1", t: "Los cielos cuentan la gloria de Dios, y el firmamento anuncia la obra de sus manos." },
    { r: "Salmos 100:4", t: "Entrad por sus puertas con acción de gracias, por sus atrios con alabanza." },
    { r: "Salmos 34:1", t: "Bendeciré a Dios en todo tiempo; su alabanza estará de continuo en mi boca." },
    { r: "Salmos 95:1", t: "Venid, aclamemos alegremente a Dios; cantemos con júbilo a la roca de nuestra salvación." },
    { r: "Salmos 107:1", t: "Alabad a Dios, porque él es bueno; porque para siempre es su misericordia." },
    { r: "Colosenses 3:17", t: "Y todo lo que hacéis... hacedlo todo en el nombre del Señor Jesús, dando gracias." },
    { r: "Salmos 92:1", t: "Bueno es alabarte, oh Dios, y cantar salmos a tu nombre." },
    { r: "Efesios 5:20", t: "Dando siempre gracias por todo al Dios y Padre." },
    { r: "Salmos 8:1", t: "¡Oh Dios, Señor nuestro, cuán glorioso es tu nombre en toda la tierra!" },
    { r: "Mateo 5:14", t: "Vosotros sois la luz del mundo." },
    { r: "Gálatas 5:22-23", t: "Mas el fruto del Espíritu es amor, gozo, paz, paciencia, benignidad, bondad, fe..." },
    { r: "Miqueas 6:8", t: "Oh hombre, él te ha declarado lo que es bueno... hacer justicia, y amar misericordia." },
    { r: "Josué 24:15", t: "Pero yo y mi casa serviremos a Dios." },
    { r: "Romanos 12:21", t: "No seas vencido de lo malo, sino vence con el bien el mal." },
    { r: "Colosenses 3:23", t: "Y todo lo que hagáis, hacedlo de corazón, como para el Señor." },
    { r: "Mateo 6:33", t: "Mas buscad primeramente el reino de Dios y su justicia." },
    { r: "1 Corintios 16:14", t: "Todas vuestras cosas sean hechas con amor." },
    { r: "Efesios 4:32", t: "Antes sed benignos unos con otros, misericordiosos, perdonándoos unos a otros." },
    { r: "Santiago 1:22", t: "Pero sed hacedores de la palabra, y no tan solamente oidores." },
    { r: "Salmos 1:1", t: "Bienaventurado el varón que no anduvo en consejo de malos." },
    { r: "Salmos 119:11", t: "En mi corazón he guardado tus dichos, para no pecar contra ti." },
    { r: "Proverbios 22:6", t: "Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él." },
    { r: "Mateo 22:37", t: "Amarás al Señor tu Dios con todo tu corazón, y con toda tu alma." },
    { r: "Salmos 133:1", t: "¡Mirad cuán bueno y cuán delicioso es habitar los hermanos juntos en armonía!" },
    { r: "Juan 14:6", t: "Jesús le dijo: Yo soy el camino, y la verdad, y la vida." },
    { r: "Hechos 4:12", t: "Y en ningún otro hay salvación." },
    { r: "Romanos 10:9", t: "Que si confesares con tu boca que Jesús es el Señor... serás salvo." },
    { r: "2 Corintios 5:17", t: "De modo que si alguno está en Cristo, nueva criatura es." },
    { r: "1 Juan 1:9", t: "Si confesamos nuestros pecados, él es fiel y justo para perdonar." },
    { r: "Apocalipsis 3:20", t: "He aquí, yo estoy a la puerta y llamo." },
    { r: "Juan 1:1", t: "En el principio era el Verbo, y el Verbo era con Dios." },
    { r: "Juan 8:32", t: "Y conoceréis la verdad, y la verdad os hará libres." },
    { r: "Juan 10:10", t: "Yo he venido para que tengan vida, y para que la tengan en abundancia." },
    { r: "Mateo 28:20", t: "Y he aquí yo estoy con vosotros todos los días, hasta el fin del mundo." },
    { r: "Romanos 6:23", t: "Porque la paga del pecado es muerte, mas la dádiva de Dios es vida eterna." },
    { r: "1 Timoteo 2:5", t: "Porque hay un solo Dios, y un solo mediador entre Dios y los hombres, Jesucristo hombre." },
    { r: "Hebreos 4:12", t: "Porque la palabra de Dios es viva y eficaz." },
    { r: "1 Juan 5:14", t: "Y esta es la confianza que tenemos en él, que si pedimos alguna cosa conforme a su voluntad, él nos oye." }
];

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Falta MONGODB_URI en las variables de Vercel');
}

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
    
    // 1. Obtener suscriptores
    const subscriptions = await collection.find({}).toArray();
    console.log(`Encontradas ${subscriptions.length} suscripciones.`);

    if (subscriptions.length === 0) {
        return res.status(200).json({ message: 'No hay suscriptores aún.' });
    }

    // 2. Elegir versículo al azar de NUESTRA LISTA GIGANTE
    const randomItem = verses[Math.floor(Math.random() * verses.length)];
    
    // 3. Preparar mensaje
    const payload = JSON.stringify({
      title: `📖 ${randomItem.r}`,
      body: randomItem.t,
      // URL del icono (Apunta a Vercel, no GitHub Pages, para asegurar que cargue)
      icon: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      badge: "https://sirvargas.github.io/Versicles-from-the-Bible/img/icon.png",
      url: "./"
    });

    // 4. Enviar a todos
    const promises = subscriptions.map(sub => {
      const { _id, ...pushSubscription } = sub;
      
      return webPush.sendNotification(pushSubscription, payload)
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log('Usuario inactivo, eliminando:', sub.endpoint);
            return collection.deleteOne({ endpoint: sub.endpoint });
          }
          console.error('Error enviando a un usuario:', err);
        });
    });

    await Promise.all(promises);

    return res.status(200).json({ 
        success: true, 
        message: `Versículo enviado a ${subscriptions.length} dispositivos.`,
        verse: randomItem.r
    });

  } catch (error) {
    console.error('Error general:', error);
    return res.status(500).json({ error: error.message });
  }
}
