/* ==========================================================================
   guides-data.js (TIER 2 -- Firestore-backed, NEW shared module)
   Agri-Talk's Farming Tips / Weed Identification / Calibration Guide content.
   These were previously hardcoded arrays inside agritalk.html itself -- true
   even in the ORIGINAL Tier 1 build -- meaning adding a new tip or updating
   an existing one required editing and redeploying code. This turns them
   into ordinary Firestore documents staff can add, edit and remove from
   manage_guides.html, with no code changes needed.

   Persisted in the Firestore 'guides' collection, each document tagged with
   a `topic` field ('tips' | 'weed' | 'calibrate') so agritalk.html can pull
   just the entries for whichever tab the farmer clicked.
   ========================================================================== */

const DEFAULT_GUIDES = [
    { topic: 'tips', order: 1, title: 'Farming Tips (1/3): Soil Management & Nutrition',
      content: 'Ensure you check soil moisture and pH levels before applying top-dressing fertilizer. Basal fertilizer should be placed near the root zone at planting to prevent leaching during early heavy rains.' },
    { topic: 'tips', order: 2, title: 'Farming Tips (2/3): Pest Control & Crop Protection',
      content: 'Rotate crop protection chemicals with different modes of action (MOA) to avoid pest resistance. Inspect under leaf surfaces early in the morning for Fall Armyworm and Red Spider Mites.' },
    { topic: 'tips', order: 3, title: 'Farming Tips (3/3): Irrigation & Water Efficiency',
      content: 'Irrigate early in the morning or late evening to cut evaporative loss. Monitor soil moisture down to 30cm to ensure effective root-zone saturation without waterlogging.' },

    { topic: 'weed', order: 1, title: 'Weed Identification (1/3): Common Broadleaf Weeds',
      content: 'Blackjack (Bidens pilosa) & Pigweed (Amaranthus): Highly competitive broadleaf weeds in Zimbabwean maize and tobacco fields. Apply CP-Glyphosate 480SL pre-planting or selective broadleaf herbicides early post-emergence.' },
    { topic: 'weed', order: 2, title: 'Weed Identification (2/3): Problem Grasses',
      content: 'Couch Grass (Cynodon dactylon) & Shamva Grass: Perennial grasses with deep stolons and rhizomes. Require systemic post-emergence herbicide applications like CP-Fluazifop-p-butyl in broadleaf crops.' },
    { topic: 'weed', order: 3, title: 'Weed Identification (3/3): Sedges & Parasitic Weeds',
      content: 'Yellow Nutsedge (Cyperus esculentus) & Witchweed (Striga): Sedges thrive in wet soils and propagate via tubers. Striga attaches to cereal roots. Use specialized soil-applied pre-emergence herbicides and crop rotation.' },

    { topic: 'calibrate', order: 1, title: 'Calibration Guide (1/3): Knapsack Sprayer Basics',
      content: 'Maintain a constant walking speed (approx. 1 meter per second) and maintain steady pressure at 2-3 bar to ensure uniform chemical coverage across the target swath width.' },
    { topic: 'calibrate', order: 2, title: 'Calibration Guide (2/3): Nozzle Selection & Flow Rate',
      content: 'Use yellow flat-fan nozzles for herbicides and hollow-cone nozzles for fungicides/insecticides. Catch output in a measuring cylinder for 1 minute; replace nozzles showing over 10% variation from nominal discharge.' },
    { topic: 'calibrate', order: 3, title: 'Calibration Guide (3/3): Dosage & Water Volume Math',
      content: 'Calculate required chemical dosage per 15L or 20L tank: (Recommended Rate/Ha) divided by (Water Volume/Ha) times Tank Capacity. Never estimate chemical volume by eye.' }
];

let _guideSeedDone = false;

async function seedGuidesIfEmpty() {
    if (_guideSeedDone) return;
    const { db, collection, getDocs, addDoc } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'guides'));
    if (snap.empty) {
        for (const g of DEFAULT_GUIDES) {
            await addDoc(collection(db, 'guides'), g);
        }
        console.log('[guides-data] Seeded', DEFAULT_GUIDES.length, 'default guide entries.');
    }
    _guideSeedDone = true;
}

/** All guides for one topic ('tips' | 'weed' | 'calibrate'), in display order. */
async function getGuidesByTopic(topic) {
    const { db, collection, query, where, getDocs } = window.CPFirebase;
    await seedGuidesIfEmpty();
    const q = query(collection(db, 'guides'), where('topic', '==', topic));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    return list;
}

/** All guides across every topic (for the staff management page). */
async function getAllGuides() {
    const { db, collection, getDocs } = window.CPFirebase;
    await seedGuidesIfEmpty();
    const snap = await getDocs(collection(db, 'guides'));
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => {
        if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);
        return (a.order || 0) - (b.order || 0);
    });
    return list;
}

/** Adds a new guide entry. order defaults to appearing after the existing entries for that topic. */
async function addGuide(topic, title, content) {
    const { db, collection, addDoc } = window.CPFirebase;
    const existing = await getGuidesByTopic(topic);
    const nextOrder = existing.length > 0 ? Math.max(...existing.map(g => g.order || 0)) + 1 : 1;
    const guide = { topic, order: nextOrder, title, content };
    await addDoc(collection(db, 'guides'), guide);
    return guide;
}

/** Updates one guide's title/content/order -- writes only that one document. */
async function updateGuide(firestoreId, fields) {
    const { db, doc, updateDoc } = window.CPFirebase;
    await updateDoc(doc(db, 'guides', firestoreId), fields);
}

async function deleteGuide(firestoreId) {
    const { db, doc, deleteDoc } = window.CPFirebase;
    await deleteDoc(doc(db, 'guides', firestoreId));
}
