/* ==========================================================================
   diagnosis-log.js (TIER 2 -- Firestore-backed)
   Diagnosis history for the Agronomic Advisory Channel. Persisted in the
   Firestore 'diagnosis_log' collection -- captures BOTH automated AI-matched
   diagnoses (from test-advisor.html) and direct agronomist diagnoses logged
   manually via diagnosis_reports.html, so agronomists have a single,
   genuinely shared, downloadable record to refer back to if issues arise
   later -- visible to every staff member, not just whoever's browser
   happened to generate each entry, closing the same per-device gap that
   escalations-data.js closes for escalation tickets.
   ========================================================================== */

/** All diagnosis records, newest first. */
async function getDiagnosisLog() {
    const { db, collection, getDocs } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'diagnosis_log'));
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return list;
}

/**
 * Records one diagnosis event. source is 'AI Advisory Portal',
 * 'Agronomist (Direct)', or 'Agronomist (via Escalation)'. Called every
 * time the AI successfully matches a product (not just on escalation), and
 * from the Diagnosis Reports page's direct-diagnosis form.
 */
async function logDiagnosis({ source, farmerName = '', crop = '', symptom = '', query = '', productRecommended = '', agronomistName = '', notes = '' }) {
    const { db, collection, addDoc } = window.CPFirebase;
    const now = new Date();
    const record = {
        id: 'DX-' + now.getTime().toString(36).toUpperCase(),
        source,
        farmerName,
        crop,
        symptom,
        query,
        productRecommended,
        agronomistName,
        notes,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        timestamp: now.toISOString()
    };
    await addDoc(collection(db, 'diagnosis_log'), record);
    return record;
}

function escapeCSVField(val) {
    const s = String(val == null ? '' : val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

/** Downloads the full diagnosis log (AI + direct + via-escalation) as a CSV file. */
async function exportDiagnosisLogCSV() {
    const log = await getDiagnosisLog();
    if (log.length === 0) { alert('No diagnosis records to export yet.'); return; }

    const headers = ['ID', 'Source', 'Date', 'Time', 'Farmer Name', 'Crop', 'Symptom', 'Query', 'Product Recommended', 'Agronomist', 'Notes'];
    const rows = log.map(r => [r.id, r.source, r.date, r.time, r.farmerName, r.crop, r.symptom, r.query, r.productRecommended, r.agronomistName, r.notes]
        .map(escapeCSVField).join(','));
    const csv = headers.join(',') + '\n' + rows.join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CP_Chemicals_Diagnosis_History_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** Deletes one diagnosis record by its human-readable id (e.g. "DX-M1A2B3"). */
async function deleteDiagnosisRecord(id) {
    const { db, collection, query, where, getDocs, doc, deleteDoc } = window.CPFirebase;
    const q = query(collection(db, 'diagnosis_log'), where('id', '==', id));
    const snap = await getDocs(q);
    if (snap.empty) return;
    await deleteDoc(doc(db, 'diagnosis_log', snap.docs[0].id));
}
