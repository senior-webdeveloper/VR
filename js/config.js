// Import the functions you need from the SDKs you need
//import { initializeApp } from "https://www.gstatic.com/firebasejs/9.2.0/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
var config = {
  apiKey: "AIzaSyCd37zu6meBQGaI1SfrqaKPKj-lV6jIVvs",
  authDomain: "realidadevirtualauth.firebaseapp.com",
  projectId: "realidadevirtualauth",
  storageBucket: "realidadevirtualauth.appspot.com",
  messagingSenderId: "886341448889",
  appId: "1:886341448889:web:953813e35432dcc1549768",
};

// Initialize Firebase
const app = firebase.initializeApp(config);

const auth = firebase.auth();

const db = firebase.firestore(app);

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
