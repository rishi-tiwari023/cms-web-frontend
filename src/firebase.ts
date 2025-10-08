import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
    apiKey: 'AIzaSyBIDsWereexhayc8t4PMSt98ede57QXJQs',
    authDomain: 'cms-legal-clinic.firebaseapp.com',
    projectId: 'cms-legal-clinic',
    // storageBucket domain should end with .appspot.com for Firebase Storage
    storageBucket: 'cms-legal-clinic.appspot.com',
    messagingSenderId: '291103627298',
    appId: '1:291103627298:android:0ff748ef80b5366650527b',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
