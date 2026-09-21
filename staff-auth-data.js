/* ==========================================================================
   staff-auth-data.js (TIER 2 -- Firestore + Firebase Auth backed)
   Real staff authentication, replacing Tier 1/early-Tier-2's sessionStorage
   flag (which any visitor could set themselves via their browser's
   developer console -- a "staff only" sign on the door, not a lock).

   Design: ANYONE can create an account (createStaffAccount), but that alone
   grants no access -- a separate Firestore 'staff_users' allowlist (matched
   by email) decides who is actually authorized. This two-step design exists
   because Firebase's client SDK cannot create a second user account from an
   already-logged-in admin session without signing the admin out of their
   own session in the process (a real constraint of client-only, static
   hosting with no server-side Admin SDK available) -- so a new staff
   member always creates their own account, and an EXISTING authorized
   staff member separately approves that email via manage_staff.html.

   The very first staff account has no existing staff to approve it, so
   that one is seeded once, directly in the Firebase Console, as a manual
   bootstrap step -- see manage_staff.html and the setup instructions given
   alongside this module.

   IMPORTANT: staff_users documents are keyed BY EMAIL ITSELF (not an
   auto-generated ID), and every email is lowercased/trimmed before being
   used as that key -- everywhere, consistently. This isn't just a style
   choice: the Firestore Security Rules locking this collection down check
   "does a document already exist at staff_users/<the caller's own email>",
   and that check can only work if the document's ID is genuinely the
   email, in the exact same normalized form the rule expects. Getting this
   inconsistent between the app and the rules would either lock everyone
   out or defeat the lock entirely -- so normalizeEmail() below is the one
   place this happens, used by every function that touches this collection.
   ========================================================================== */

function normalizeEmail(email) {
    return String(email || '').toLowerCase().trim();
}

/** Creates a new login (email + password) -- grants NO access by itself. */
async function createStaffAccount(email, password, name) {
    return window.CPFirebase.staffAuthCreate(email, password, name);
}

/** Returns true if the given email is on the authorized staff allowlist. */
async function isEmailAuthorizedStaff(email) {
    const { db, doc, getDoc } = window.CPFirebase;
    const snap = await getDoc(doc(db, 'staff_users', normalizeEmail(email)));
    return snap.exists();
}

/**
 * Logs in with email + password, then checks the allowlist. If the account
 * exists but isn't authorized, signs them back out immediately (so a
 * rejected login doesn't leave a "logged in but not staff" state lingering)
 * and throws, so the caller can show a clear message.
 */
async function loginStaffAccount(email, password) {
    const user = await window.CPFirebase.staffAuthLogin(email, password);
    const authorized = await isEmailAuthorizedStaff(user.email);
    if (!authorized) {
        await window.CPFirebase.logout();
        throw new Error('NOT_AUTHORIZED_STAFF');
    }
    return user;
}

/**
 * The guard every staff page calls on load. Waits for Firebase's initial
 * auth check, then confirms both "is someone logged in" and "are they on
 * the staff allowlist" before letting the page reveal itself. Redirects to
 * staff_login.html otherwise. Because this is asynchronous (unlike the old
 * synchronous sessionStorage check), calling pages show a brief "Verifying
 * access..." overlay until this resolves -- see the shared guard HTML.
 */
async function requireStaffAuth() {
    await window.CPFirebase.ready;
    const user = window.CPFirebase.auth.currentUser;
    if (!user) {
        window.location.href = 'staff_login.html';
        return false;
    }
    const authorized = await isEmailAuthorizedStaff(user.email);
    if (!authorized) {
        await window.CPFirebase.logout();
        window.location.href = 'staff_login.html';
        return false;
    }
    document.body.classList.add('staff-auth-verified');
    return true;
}

/** All authorized staff (manage_staff.html). */
async function getStaffList() {
    const { db, collection, getDocs } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'staff_users'));
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => (a.addedAt || '').localeCompare(b.addedAt || ''));
    return list;
}

/**
 * Approves an email as staff. Does NOT create their login -- they must have
 * already registered one. Writes to a document keyed by the email itself
 * (setDoc, not addDoc-with-an-auto-ID) -- this is what the Security Rules
 * actually check against.
 */
async function addStaffMember(email, name) {
    const { db, doc, setDoc } = window.CPFirebase;
    const normalized = normalizeEmail(email);
    const entry = { email: normalized, name: name || '', addedAt: new Date().toISOString() };
    await setDoc(doc(db, 'staff_users', normalized), entry);
    return entry;
}

/**
 * Revokes an email's staff access (does not delete their login account,
 * only their allowlist entry). firestoreId here IS the email (see above),
 * so this accepts either the raw email or the id from getStaffList() --
 * they're now the same value.
 */
async function removeStaffMember(firestoreId) {
    const { db, doc, deleteDoc } = window.CPFirebase;
    await deleteDoc(doc(db, 'staff_users', normalizeEmail(firestoreId)));
}
