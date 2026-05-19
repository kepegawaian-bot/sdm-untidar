import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const snap = await getDoc(doc(db, 'site_settings', 'main'));
  if (snap.exists()) {
    console.log(snap.data().footer?.instagramWidgetCode);
  }
  process.exit(0);
}
run();
