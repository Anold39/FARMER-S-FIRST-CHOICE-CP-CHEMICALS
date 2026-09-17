/* ==========================================================================
   dropdown-options-data.js (TIER 2 -- Firestore-backed, NEW shared module)
   The AI Advisory Portal's "Crop / Subject" and "Symptom / Purpose" dropdown
   options -- previously a hardcoded <option> list directly inside
   test-advisor.html. Editable now from manage_symptoms.html.

   Each symptom option's `value` is the actual keyword text passed into the
   AI's product-matching engine (findProductByQuery in products-data.js) --
   this is the same matching mechanism the CSV `keywords` column feeds, so
   adding a symptom option here is really adding a new *entry point* into
   that matching, not a separate diagnostic system. A new symptom option
   only produces a real recommendation once at least one product's keywords
   (via Inventory Management's CSV upload) actually contains that same
   value -- manage_symptoms.html says this plainly so it isn't a surprise.

   Persisted in the Firestore 'dropdown_options' collection, tagged with a
   `type` field ('crop' | 'symptom').
   ========================================================================== */

const DEFAULT_DROPDOWN_OPTIONS = [
    { type: 'crop', order: 1, value: 'Maize', label: 'Maize' },
    { type: 'crop', order: 2, value: 'Tobacco', label: 'Tobacco' },
    { type: 'crop', order: 3, value: 'Cotton', label: 'Cotton' },
    { type: 'crop', order: 4, value: 'Wheat / Cereals', label: 'Wheat / Cereals' },
    { type: 'crop', order: 5, value: 'Soybeans / Legumes', label: 'Soybeans / Legumes' },
    { type: 'crop', order: 6, value: 'Tomatoes & Veggies', label: 'Tomatoes & Veggies' },
    { type: 'crop', order: 7, value: 'Livestock & Farm Care', label: 'Livestock & Farm Care' },

    { type: 'symptom', order: 1,  value: 'yellowing leaves',   label: 'Yellowing Leaves / Top Dressing' },
    { type: 'symptom', order: 2,  value: 'stalk borer',        label: 'Stem Borers / Stalk Chewers' },
    { type: 'symptom', order: 3,  value: 'leaf spot',          label: 'Fungal Leaf Spots & Rust' },
    { type: 'symptom', order: 4,  value: 'armyworm',           label: 'Armyworm Attack' },
    { type: 'symptom', order: 5,  value: 'aphid',              label: 'Aphids & Sap-Suckers' },
    { type: 'symptom', order: 6,  value: 'broadleaf weeds',    label: 'Broadleaf Weeds & Clearing' },
    { type: 'symptom', order: 7,  value: 'powdery mildew',     label: 'Powdery Mildew & Mold' },
    { type: 'symptom', order: 8,  value: 'blight',             label: 'Blight Protection' },
    { type: 'symptom', order: 9,  value: 'termite',            label: 'Termites & Subterranean Pests' },
    { type: 'symptom', order: 10, value: 'tick',               label: 'Ticks & Parasites (Livestock)' },
    { type: 'symptom', order: 11, value: 'rodent',             label: 'Rodents & Store Pests' },
    { type: 'symptom', order: 12, value: 'knapsack',           label: 'Sprayers & Safety Equipment' }
];

let _dropdownSeedDone = false;

async function seedDropdownOptionsIfEmpty() {
    if (_dropdownSeedDone) return;
    const { db, collection, getDocs, addDoc } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'dropdown_options'));
    if (snap.empty) {
        for (const o of DEFAULT_DROPDOWN_OPTIONS) {
            await addDoc(collection(db, 'dropdown_options'), o);
        }
        console.log('[dropdown-options-data] Seeded', DEFAULT_DROPDOWN_OPTIONS.length, 'default dropdown options.');
    }
    _dropdownSeedDone = true;
}

/** Options of one type ('crop' | 'symptom'), in display order. */
async function getOptionsByType(type) {
    const { db, collection, query, where, getDocs } = window.CPFirebase;
    await seedDropdownOptionsIfEmpty();
    const q = query(collection(db, 'dropdown_options'), where('type', '==', type));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    return list;
}

/** All options across both types (for the staff management page). */
async function getAllDropdownOptions() {
    const { db, collection, getDocs } = window.CPFirebase;
    await seedDropdownOptionsIfEmpty();
    const snap = await getDocs(collection(db, 'dropdown_options'));
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return (a.order || 0) - (b.order || 0);
    });
    return list;
}

async function addDropdownOption(type, value, label) {
    const { db, collection, addDoc } = window.CPFirebase;
    const existing = await getOptionsByType(type);
    const nextOrder = existing.length > 0 ? Math.max(...existing.map(o => o.order || 0)) + 1 : 1;
    const option = { type, order: nextOrder, value, label };
    await addDoc(collection(db, 'dropdown_options'), option);
    return option;
}

async function updateDropdownOption(firestoreId, fields) {
    const { db, doc, updateDoc } = window.CPFirebase;
    await updateDoc(doc(db, 'dropdown_options', firestoreId), fields);
}

async function deleteDropdownOption(firestoreId) {
    const { db, doc, deleteDoc } = window.CPFirebase;
    await deleteDoc(doc(db, 'dropdown_options', firestoreId));
}
