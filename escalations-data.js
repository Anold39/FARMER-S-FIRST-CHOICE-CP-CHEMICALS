/* ==========================================================================
   escalations-data.js (TIER 2 -- Firestore-backed, NEW shared module)
   AI Advisory Portal escalation tickets. Persisted in the Firestore
   'escalations' collection -- this closes the "same device/browser only"
   gap flagged throughout Tier 1: an agronomist resolving a ticket on the
   Staff Portal is now visible to the farmer checking their status from any
   device, not just the one they originally escalated from.

   This also consolidates logic that Tier 1 had duplicated independently in
   two places (test-advisor.html had its own inline localStorage read/write
   for escalations, and ai_escalations.html had its own separate
   getEscalations()/saveEscalations() pair) into one shared module, the same
   pattern already used for products-data.js and invoice.js.

   Each escalation keeps its human-readable ticket id (e.g. "ESC-4821", shown
   throughout the UI) as a regular field, separate from the Firestore
   document's own internal id (exposed here as `firestoreId`) -- so no
   existing UI code that displays or searches by ticket id needs to change.
   ========================================================================== */

/** Creates a new escalation ticket. Returns the created record (including its ticket id). */
async function submitEscalationRecord(farmerName, farmerPhone, crop, symptom, userQuery) {
    const { db, collection, addDoc } = window.CPFirebase;
    const record = {
        id: 'ESC-' + Math.floor(1000 + Math.random() * 9000),
        timestamp: new Date().toLocaleString(),
        farmerName: farmerName,
        farmerPhone: farmerPhone,
        crop: crop,
        symptom: symptom,
        userQuery: userQuery,
        status: 'Pending'
    };
    await addDoc(collection(db, 'escalations'), record);
    return record;
}

/** All escalation tickets, newest first (Staff-facing ai_escalations.html). */
async function getEscalations() {
    const { db, collection, getDocs } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'escalations'));
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return list;
}

/**
 * Resolved escalation tickets with a reply, matching a farmer's name
 * (case-insensitive, exact match on the whole name) -- used by
 * checkEscalationStatus() on the AI Advisory Portal. Matching by typed name
 * rather than account uid, since a farmer can use this page's "Check My
 * Escalation Status" without necessarily being logged in (unlike checkout,
 * this lookup was never gated behind an account).
 */
async function findEscalationsByFarmerName(name) {
    const all = await getEscalations();
    const nameLower = (name || '').trim().toLowerCase();
    return all.filter(e =>
        (e.farmerName || '').trim().toLowerCase() === nameLower &&
        e.status === 'Resolved' &&
        e.agronomistReply
    );
}

/**
 * Updates one escalation ticket by its human-readable ticket id (e.g.
 * "ESC-4821"), writing only that one document -- not the whole collection --
 * so two agronomists resolving different tickets at the same moment can
 * never overwrite each other's change (the same reasoning as
 * updateProductStock() in products-data.js).
 */
async function updateEscalationRecord(ticketId, fields) {
    const { db, collection, query, where, getDocs, doc, updateDoc } = window.CPFirebase;
    const q = query(collection(db, 'escalations'), where('id', '==', ticketId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const firestoreId = snap.docs[0].id;
    await updateDoc(doc(db, 'escalations', firestoreId), fields);
    return { firestoreId, ...snap.docs[0].data(), ...fields };
}

/** Deletes every ticket currently marked Resolved (the "Clear Resolved Tickets" button). */
async function deleteResolvedEscalations() {
    const { db, collection, getDocs, doc, deleteDoc } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'escalations'));
    let count = 0;
    for (const d of snap.docs) {
        if (d.data().status === 'Resolved') {
            await deleteDoc(doc(db, 'escalations', d.id));
            count++;
        }
    }
    return count;
}
