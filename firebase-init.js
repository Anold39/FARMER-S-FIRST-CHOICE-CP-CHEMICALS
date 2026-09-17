/* ==========================================================================
   firebase-init.js
   Tier 2 foundation module. Initializes Firebase (App, Firestore, Auth) using
   the modular (v9+) SDK, loaded as native ES modules -- no npm/bundler, so
   this still deploys as a plain static site on GitHub Pages exactly like the
   rest of Tier 1.

   Because the rest of this codebase (script.js, products-data.js, invoice.js,
   diagnosis-log.js and every page's inline <script>) is written as classic,
   non-module global-scope code that HTML onclick="..." attributes call
   directly, everything this module exposes for those scripts to use is
   attached explicitly to `window.CPFirebase` -- module-scope variables and
   functions are NOT visible to that pattern otherwise.

   This file only sets up the connection. It intentionally does NOT contain
   any Firestore reads/writes or Auth calls itself -- those live in the
   feature-specific files that replace each Tier 1 localStorage module
   (e.g. a future products-data-firebase.js), built and swapped in one
   feature at a time, starting with the lowest-risk, read-heavy one
   (Products/Inventory) as agreed before any higher-risk one (Cart/Invoices,
   which touches both money and identity together).
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
    getFirestore,
    collection, doc,
    getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc,
    query, where, orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Your web app's Firebase configuration (public client config -- not a secret;
// access control is enforced by Firestore/Auth Security Rules, not by hiding this).
const firebaseConfig = {
    apiKey: "AIzaSyCpF6Cm1S6XurrqWH4L6KnYkfjNZjlC4Xc",
    authDomain: "my-cp-chemicals-project.firebaseapp.com",
    projectId: "my-cp-chemicals-project",
    storageBucket: "my-cp-chemicals-project.firebasestorage.app",
    messagingSenderId: "125621917431",
    appId: "1:125621917431:web:8da751f1767cc9482da5f2"
    // measurementId intentionally omitted -- Analytics is not used in Tier 2
    // (see file header note; unrelated to Firestore/Auth, and unnecessary
    // third-party tracking for an academic prototype).
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Converts a farmer's phone number into the synthetic email Firebase
 * Email/Password auth needs behind the scenes. The farmer never sees this --
 * they only ever enter their phone number and PIN. Keeping this conversion
 * in one place (rather than repeated inline in every page) means the exact
 * scheme can be changed later without hunting through every file.
 */
function phoneToSyntheticEmail(phone) {
    const cleaned = String(phone).replace(/[^0-9]/g, '');
    return `${cleaned}@cpchemicals-farmer.local`;
}

/** Reverses phoneToSyntheticEmail -- recovers the phone number from a logged-in user's email, for display. */
function syntheticEmailToPhone(email) {
    return String(email || '').split('@')[0];
}

// Everything below is what the rest of the site (plain, non-module scripts)
// actually calls. Kept deliberately close in shape to the Tier 1
// localStorage helpers (getProducts/saveProducts, getInvoices, etc.) so that
// migrating each feature file later is a targeted rewrite, not a redesign.
window.CPFirebase = {
    app, db, auth,

    // --- Firestore primitives, re-exported so feature files don't each need
    // their own <script type="module"> block just to call collection()/doc(). ---
    collection, doc, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, onSnapshot, serverTimestamp,

    // --- Auth ---
    phoneToSyntheticEmail,
    syntheticEmailToPhone,

    /** Registers a new farmer account. pin is used as the Firebase Auth password. name becomes the account's displayName. */
    registerFarmer: async (phone, pin, name) => {
        const email = phoneToSyntheticEmail(phone);
        const cred = await createUserWithEmailAndPassword(auth, email, pin);
        if (name) await updateProfile(cred.user, { displayName: name });
        return cred.user;
    },

    /** Logs an existing farmer in. */
    loginFarmer: async (phone, pin) => {
        const email = phoneToSyntheticEmail(phone);
        const cred = await signInWithEmailAndPassword(auth, email, pin);
        return cred.user;
    },

    logout: () => signOut(auth),

    /**
     * Staff accounts use a real email directly (unlike farmers, which use a synthetic
     * email derived from phone number) -- staff sign up with an actual email address.
     * Creating an account here grants no access by itself; see staff-auth-data.js for
     * the separate allowlist check that actually gates staff pages.
     */
    staffAuthCreate: async (email, password, name) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        return cred.user;
    },

    staffAuthLogin: async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return cred.user;
    },

    /** Fires callback(user) whenever auth state changes (login/logout), including on page load. */
    onAuthChange: (callback) => onAuthStateChanged(auth, callback),

    /** True once Firebase has finished its first auth-state check (avoids acting on a false "logged out" during the brief initial load). */
    ready: new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, () => { unsub(); resolve(); });
    })
};

console.log('[CPFirebase] Initialized. Firestore + Auth ready on window.CPFirebase.');
