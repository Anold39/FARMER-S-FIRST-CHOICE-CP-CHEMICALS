/* ==========================================================================
   diagnosis-log.js
   Diagnosis history for the Agronomic Advisory Channel. Persisted under
   localStorage key 'cp_diagnosis_log'. Captures BOTH automated AI-matched
   diagnoses (from test-advisor.html) and direct agronomist diagnoses logged
   manually via the Staff Portal, so agronomists have a single, downloadable
   record to refer back to if issues arise later -- distinct from
   cp_ai_escalations, which only captures queries the AI could NOT match.
   ========================================================================== */

function getDiagnosisLog() {
    try {
        return JSON.parse(localStorage.getItem('cp_diagnosis_log')) || [];
    } catch (e) {
        return [];
    }
}

function saveDiagnosisLog(list) {
    localStorage.setItem('cp_diagnosis_log', JSON.stringify(list));
}

/**
 * Records one diagnosis event. source is 'AI Advisory Portal' or
 * 'Agronomist (Direct)'. Called every time the AI successfully matches a
 * product (not just on escalation), and from the Staff Portal's direct-
 * diagnosis form.
 */
function logDiagnosis({ source, farmerName = '', crop = '', symptom = '', query = '', productRecommended = '', agronomistName = '', notes = '' }) {
    const now = new Date();
    const log = getDiagnosisLog();
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
    log.unshift(record);
    saveDiagnosisLog(log);
    return record;
}

function escapeCSVField(val) {
    const s = String(val == null ? '' : val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

/** Downloads the full diagnosis log (AI + direct) as a CSV file. */
function exportDiagnosisLogCSV() {
    const log = getDiagnosisLog();
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

function deleteDiagnosisRecord(id) {
    const log = getDiagnosisLog().filter(r => r.id !== id);
    saveDiagnosisLog(log);
}
