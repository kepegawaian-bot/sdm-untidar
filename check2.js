import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const app = initializeApp({ projectId: 'gen-lang-client-0435877001' });
const db = getFirestore(app);

async function check() {
  const settings = await getDoc(doc(db, 'site_settings', 'main'));
  console.log(JSON.stringify(settings.data()?.services || [], null, 2));
}

check();
