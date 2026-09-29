import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBnkN0VP6zmOxiZRSkHT_liWQeJergUIXo",
  authDomain: "propenu-web.firebaseapp.com",
  projectId: "propenu-web",
  storageBucket: "propenu-web.firebasestorage.app",
  messagingSenderId: "1097932635154",
  appId: "1:1097932635154:web:83d86e7abd9e0ae06e2ccb",
};

const app = initializeApp(firebaseConfig);

let messaging: any = null;
let messagingPromise: Promise<any> | null = null;

export const getFirebaseMessaging = async () => {
  if (typeof window === "undefined") return null;
  if (messaging) return messaging;

  if (!messagingPromise) {
    messagingPromise = isSupported().then((supported) => {
      if (!supported) return null;
      messaging = getMessaging(app);
      return messaging;
    });
  }

  return messagingPromise;
};

export { messaging };
