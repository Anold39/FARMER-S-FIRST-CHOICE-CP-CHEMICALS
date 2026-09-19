/* ==========================================================================
   farmers-data.js (TIER 2 -- Firestore-backed, NEW shared module)
   Farmer profile records (name, phone, district, crops, hectares, rating) --
   the actual CRM-style database staff browse on farmer_database.html.

   This was the one piece of Tier 2 still genuinely stuck on localStorage:
   farmer LOGIN was already real Firebase Auth, but the PROFILE data shown
   on the staff dashboard was still per-browser -- meaning staff on one
   device could never see farmers who registered from a different one, the
   exact "stuck on one browser" problem every other part of Tier 2 already
   solved. This closes that gap.

   Design note: a farmer record is NOT required to have a real login. Staff
   can pre-add farmers via CSV (people they know locally who haven't
   registered yet), so records are matched by PHONE NUMBER (the natural
   unique identifier here, same as the original CSV import logic), not by
   Firebase Auth UID. A record only gets a `uid` field once that person
   actually registers -- addFarmerProfile() below merges into any existing
   phone-matched record rather than creating a duplicate, exactly mirroring
   how importFarmersFromCSV() already merges by phone.

   Persisted in the Firestore 'farmers' collection.
   ========================================================================== */

function normalizePhone(phone) {
    return String(phone || '').trim();
}

/** All farmer records, newest first. */
async function getFarmers() {
    const { db, collection, getDocs } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'farmers'));
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return list;
}

/** Finds a farmer record by phone number (the natural matching key), or null. */
async function findFarmerByPhone(phone) {
    const { db, collection, query, where, getDocs } = window.CPFirebase;
    const q = query(collection(db, 'farmers'), where('phone', '==', normalizePhone(phone)));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { firestoreId: d.id, ...d.data() };
}

/**
 * Called at registration (farmer_login.html). If a record already exists for this phone number
 * (e.g. staff pre-added this farmer via CSV before they ever registered), that existing record is
 * updated in place and stamped with their uid -- preserving its original registration date rather
 * than creating a duplicate second record for the same person.
 */
async function addFarmerProfile(name, phone, district, crops, hectares, rating, uid = null) {
    const { db, collection, doc, addDoc, updateDoc } = window.CPFirebase;
    const existing = await findFarmerByPhone(phone);

    if (existing) {
        const fields = { name, district, crops, hectares, rating };
        if (uid) fields.uid = uid;
        await updateDoc(doc(db, 'farmers', existing.firestoreId), fields);
        return { firestoreId: existing.firestoreId, ...existing, ...fields };
    }

    const now = new Date();
    const record = {
        name, phone: normalizePhone(phone), district, crops, hectares, rating,
        uid: uid || null,
        date: now.toLocaleDateString(),
        timestamp: now.toISOString()
    };
    const ref = await addDoc(collection(db, 'farmers'), record);
    return { firestoreId: ref.id, ...record };
}

/** Updates one farmer record -- writes only that one document. */
async function updateFarmerProfile(firestoreId, fields) {
    const { db, doc, updateDoc } = window.CPFirebase;
    await updateDoc(doc(db, 'farmers', firestoreId), fields);
}

async function deleteFarmerProfile(firestoreId) {
    const { db, doc, deleteDoc } = window.CPFirebase;
    await deleteDoc(doc(db, 'farmers', firestoreId));
}

/**
 * Parses an uploaded CSV (name,phone,district,crops,rating,hectares) and merges it into the
 * Firestore 'farmers' collection. Existing farmers are matched by phone number and updated in
 * place, preserving their original registration date. Rows with a new phone number are added as
 * new records with today's date. Mirrors the exact merge logic of the original localStorage
 * version, and of products-data.js's own CSV import.
 */
async function importFarmersFromCSV(csvText) {
    const { db, collection, doc, addDoc, updateDoc } = window.CPFirebase;
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return { updated: 0, added: 0, errors: ["CSV appears to be empty or missing a header row."] };

    const header = parseCSVLineFarmers(lines[0]).map(h => h.toLowerCase());
    const nameIdx = header.indexOf('name');
    const phoneIdx = header.indexOf('phone');
    const districtIdx = header.indexOf('district');
    const cropsIdx = header.indexOf('crops');
    const ratingIdx = header.indexOf('rating');
    const hectaresIdx = header.indexOf('hectares');

    if (nameIdx === -1 || phoneIdx === -1) {
        return { updated: 0, added: 0, errors: ["CSV header must include at least: name, phone."] };
    }

    let updated = 0, added = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLineFarmers(lines[i]);
        const name = cols[nameIdx];
        const phone = cols[phoneIdx];
        if (!name || !phone) { errors.push(`Row ${i + 1}: missing name or phone, skipped.`); continue; }

        const existing = await findFarmerByPhone(phone);
        if (existing) {
            const fields = { name };
            if (districtIdx > -1 && cols[districtIdx]) fields.district = cols[districtIdx];
            if (cropsIdx > -1 && cols[cropsIdx]) fields.crops = cols[cropsIdx];
            if (ratingIdx > -1 && cols[ratingIdx]) fields.rating = cols[ratingIdx];
            if (hectaresIdx > -1 && cols[hectaresIdx]) fields.hectares = parseFloat(cols[hectaresIdx]) || 0;
            await updateDoc(doc(db, 'farmers', existing.firestoreId), fields);
            updated++;
        } else {
            const now = new Date();
            await addDoc(collection(db, 'farmers'), {
                name, phone: normalizePhone(phone),
                district: districtIdx > -1 && cols[districtIdx] ? cols[districtIdx] : 'Other',
                crops: cropsIdx > -1 && cols[cropsIdx] ? cols[cropsIdx] : 'None Selected',
                rating: ratingIdx > -1 && cols[ratingIdx] ? cols[ratingIdx] : '5',
                hectares: hectaresIdx > -1 && cols[hectaresIdx] ? (parseFloat(cols[hectaresIdx]) || 0) : 0,
                uid: null,
                date: now.toLocaleDateString(),
                timestamp: now.toISOString()
            });
            added++;
        }
    }

    return { updated, added, errors };
}

function parseCSVLineFarmers(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = false; }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
    }
    result.push(current.trim());
    return result;
}
