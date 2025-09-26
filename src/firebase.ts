import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
	apiKey: 'AIzaSyBIDsWereexhayc8t4PMSt98ede57QXJQs',
	authDomain: 'cms-legal-clinic.firebaseapp.com',
	projectId: 'cms-legal-clinic',
	storageBucket: 'cms-legal-clinic.firebasestorage.app',
	messagingSenderId: '291103627298',
	appId: '1:291103627298:android:0ff748ef80b5366650527b',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export default app
