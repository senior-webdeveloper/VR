import PropTypes from "prop-types";
import { createContext, useEffect, useReducer, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
//
import { FIREBASE_API } from "../config";

// ----------------------------------------------------------------------

const ADMIN_EMAILS = ["vrsuper@grabmail.club"];

const firebaseApp = initializeApp(FIREBASE_API);
const AUTH = getAuth(firebaseApp);

const DB = getFirestore(firebaseApp);

const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
};

const reducer = (state, action) => {
  if (action.type === "INITIALISE") {
    const { isAuthenticated, user } = action.payload;
    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user,
    };
  }

  return state;
};

const AuthContext = createContext({
  ...initialState,
  method: "firebase",
  login: () => Promise.resolve(),
  register: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  createUser: () => Promise.resolve(),
  createFile: () => Promise.resolve(),
});

// ----------------------------------------------------------------------

AuthProvider.propTypes = {
  children: PropTypes.node,
};

function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const [profile, setProfile] = useState(null);

  useEffect(
    () =>
      onAuthStateChanged(AUTH, async (user) => {
        if (user) {
          const userRef = doc(DB, "users", user.uid);

          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            setProfile(docSnap.data());
          }

          dispatch({
            type: "INITIALISE",
            payload: { isAuthenticated: true, user },
          });
        } else {
          dispatch({
            type: "INITIALISE",
            payload: { isAuthenticated: false, user: null },
          });
        }
      }),
    [dispatch]
  );

  const login = (email, password) =>
    signInWithEmailAndPassword(AUTH, email, password);

  const register = (email, password, firstName, lastName) =>
    createUserWithEmailAndPassword(AUTH, email, password).then(async (res) => {
      const userRef = doc(collection(DB, "users"), res.user?.uid);

      await setDoc(userRef, {
        uid: res.user?.uid,
        email,
        displayName: `${firstName} ${lastName}`,
      });
    });

  const createUser = (email, name, password, phoneNumber, role) =>
    createUserWithEmailAndPassword(AUTH, email, password).then(async (res) => {
      const userRef = doc(collection(DB, "users"), res.user?.uid);

      await setDoc(userRef, {
        uid: res.user?.uid,
        email,
        displayName: name,
        phoneNumber,
        role,
      });
    });

  const logout = () => signOut(AUTH);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        method: "firebase",
        user: {
          id: state?.user?.uid,
          email: state?.user?.email,
          photoURL: state?.user?.photoURL || profile?.photoURL,
          displayName: state?.user?.displayName || profile?.displayName,
          role: ADMIN_EMAILS.includes(state?.user?.email)
            ? "Super Admin"
            : profile?.role,
          phoneNumber: state?.user?.phoneNumber || profile?.phoneNumber || "",
          country: profile?.country || "",
          address: profile?.address || "",
          state: profile?.state || "",
          city: profile?.city || "",
          zipCode: profile?.zipCode || "",
          about: profile?.about || "",
          isPublic: profile?.isPublic || false,
        },
        login,
        register,
        logout,
        createUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function createUserFunc(
  email,
  name,
  password,
  phoneNumber,
  role,
  status,
  parentUserId
) {
  const oldUser = getAuth().currentUser;
  // console.log(oldUser);
  createUserWithEmailAndPassword(AUTH, email, password)
    .then(async (res) => {
      const userRef = doc(collection(DB, "users"), res.user?.uid);
      await setDoc(userRef, {
        uid: res.user?.uid,
        email,
        displayName: name,
        phoneNumber,
        role,
        status,
        parentUserId,
      });
    })
    .then(() => {
      signOut(AUTH);
    });
}

async function updateUserFunc(
  email,
  name,
  phoneNumber,
  role,
  status,
  id,
  parentUserId
) {
  const userRef = doc(collection(DB, "users"), id);
  // console.log(userRef);
  await setDoc(userRef, {
    uid: id,
    email,
    displayName: name,
    phoneNumber,
    role,
    status,
    parentUserId,
  });
}
async function deleteUserFunc(id) {
  const userRef = doc(collection(DB, "users"), id);
  await deleteDoc(userRef);
}

async function createFile(userId, fileName, allowedUsers) {
  await addDoc(collection(DB, "files"), {});
}

async function deleteFileFunc(id) {
  const userRef = doc(collection(DB, "files"), id);
  await deleteDoc(userRef);
}

async function updateFile(userId, fileName, allowedUsers, fileid) {
  const userRef = doc(collection(DB, "files"), fileid);
  // console.log(userRef);
  await setDoc(userRef, {
    userId,
    fileName,
    allowedUsers,
    createdAt: new Date(),
  });
}

export {
  AuthContext,
  AuthProvider,
  createUserFunc,
  updateUserFunc,
  deleteUserFunc,
  createFile,
  deleteFileFunc,
  updateFile,
};
