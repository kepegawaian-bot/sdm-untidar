import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfigConfigStr = fs.readFileSync('./firebase-applet-config.json', 'utf-8');
const firebaseConfig = JSON.parse(firebaseConfigConfigStr);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seedData() {
  try {
    const docRef = doc(db, 'site_settings', 'main');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
       const { PORTAL_CONTENT } = await import('./src/data/portalData.ts');
       await setDoc(docRef, {
           header: PORTAL_CONTENT.header,
           hero: PORTAL_CONTENT.hero,
           footer: PORTAL_CONTENT.footer,
           announcements: PORTAL_CONTENT.announcements,
           recentDocuments: PORTAL_CONTENT.recentDocuments,
           applications: PORTAL_CONTENT.applications,
           services: PORTAL_CONTENT.services,
       });
       console.log('Database seeded with previous PORTAL_CONTENT data.');
    } else {
       console.log('Data already exists in Firebase.');
    }
  } catch(e) {
    console.log("Error:", e);
  }
}
seedData().then(()=>process.exit(0));
