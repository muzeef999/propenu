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

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

export { messaging };