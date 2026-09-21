/* ==========================================================================
   agritalk-cases-data.js (TIER 2 -- Firestore-backed)
   "Ask an Agronomist" case submissions from the Agri-Talk Hub (agritalk.html),
   including an optional attached photo/video, and staff replies to them
   (staff_portal.html).

   Migrated from localStorage (key 'agronomyQueries') to the Firestore
   'agritalk_cases' collection -- this pathway was left on localStorage
   during the original Tier 2 migration (a deliberate scoping decision at
   the time), which meant a farmer's submitted photo and an agronomist's
   reply were only ever visible to each other if both happened to use the
   same browser on the same device. This module gives it the same genuine
   cross-device behaviour as every other Tier 2 feature.

   No farmer login is required to submit a case, consistent with how
   escalations-data.js's submitEscalationRecord() also only takes a
   free-typed farmer name -- an account is not required for this prototype's
   advisory-side interactions, only for checkout (see invoice.js).

   A case's media is stored as a base64 data URL, same approach as
   News/Testimonials elsewhere in Tier 2, capped at 500KB so a handful of
   submissions doesn't consume an outsized share of this project's Firestore
   usage.
   ========================================================================== */

async function submitAgriTalkCase(farmerName, branch, message, image = null) {
    const { db, collection, addDoc } = window.CPFirebase;
    const record = {
        id: 'CASE-' + Date.now(),
        createdAt: Date.now(), // numeric, reliably sortable -- timestamp below is for display only
        farmerName: farmerName,
        branch: branch,
        message: message,
        image: image,
        timestamp: new Date().toLocaleString(),
        status: 'Pending Review',
        replies: []
    };
    await addDoc(collection(db, 'agritalk_cases'), record);
    return record;
}

/** Every submitted case, newest first (Staff Portal's incoming-queries view). */
async function getAgriTalkCases() {
    const { db, collection, getDocs } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'agritalk_cases'));
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
}

/**
 * A farmer's own submitted cases, matched by typed name (case-insensitive,
 * exact match) -- same reasoning as escalations-data.js's
 * findEscalationsByFarmerName(): this lookup isn't gated behind an account,
 * so matching by name is the only option available.
 */
async function getAgriTalkCasesByFarmerName(name) {
    const all = await getAgriTalkCases();
    const nameLower = (name || '').trim().toLowerCase();
    if (!nameLower) return [];
    return all.filter(c => (c.farmerName || '').trim().toLowerCase() === nameLower);
}

/**
 * Appends a staff reply and marks the case Resolved, writing only that one
 * document -- not the whole collection -- so two staff members replying to
 * different cases at the same moment can never overwrite each other's
 * change (same reasoning as updateEscalationRecord() in escalations-data.js).
 */
async function replyToAgriTalkCase(firestoreId, replyText) {
    const { db, doc, getDoc, updateDoc } = window.CPFirebase;
    const ref = doc(db, 'agritalk_cases', firestoreId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const existing = snap.data();
    const replies = Array.isArray(existing.replies) ? existing.replies.slice() : [];
    replies.push({ text: replyText, time: new Date().toLocaleString() });
    await updateDoc(ref, { replies, status: 'Resolved' });
    return { firestoreId, ...existing, replies, status: 'Resolved' };
}

async function deleteAgriTalkCase(firestoreId) {
    const { db, doc, deleteDoc } = window.CPFirebase;
    await deleteDoc(doc(db, 'agritalk_cases', firestoreId));
}
