/* ==========================================================================
   testimonials-data.js (TIER 2 -- Firestore-backed, NEW shared module)
   Farmer testimonials shown on farmer_login.html. Previously two hardcoded
   cards (true even in the original Tier 1 build) -- turned into ordinary
   Firestore documents staff can add, edit and remove from
   manage_testimonials.html, with no code changes needed.

   Persisted in the Firestore 'testimonials' collection.
   ========================================================================== */

const DEFAULT_TESTIMONIALS = [
    { quote: "The CP Farmer discount saved me over $200 on my tobacco chemicals this season. The AI advisor is a game changer!", name: "Tafadzwa C.", location: "Mvurwi", rating: 5, order: 1 },
    { quote: "Great support from the Agronomy team. Whenever I have a pest issue, they respond almost instantly with the right solution.", name: "Rumbidzai G.", location: "Mazowe", rating: 5, order: 2 }
];

let _testimonialSeedDone = false;

async function seedTestimonialsIfEmpty() {
    if (_testimonialSeedDone) return;
    const { db, collection, getDocs, addDoc } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'testimonials'));
    if (snap.empty) {
        for (const t of DEFAULT_TESTIMONIALS) {
            await addDoc(collection(db, 'testimonials'), t);
        }
        console.log('[testimonials-data] Seeded', DEFAULT_TESTIMONIALS.length, 'default testimonials.');
    }
    _testimonialSeedDone = true;
}

/** All testimonials, in display order. */
async function getTestimonials() {
    const { db, collection, getDocs } = window.CPFirebase;
    await seedTestimonialsIfEmpty();
    const snap = await getDocs(collection(db, 'testimonials'));
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    return list;
}

/** Adds a new testimonial, appearing after the existing ones. */
async function addTestimonial(quote, name, location, rating) {
    const { db, collection, addDoc } = window.CPFirebase;
    const existing = await getTestimonials();
    const nextOrder = existing.length > 0 ? Math.max(...existing.map(t => t.order || 0)) + 1 : 1;
    const testimonial = { quote, name, location, rating: parseInt(rating) || 5, order: nextOrder };
    await addDoc(collection(db, 'testimonials'), testimonial);
    return testimonial;
}

/** Updates one testimonial -- writes only that one document. */
async function updateTestimonial(firestoreId, fields) {
    const { db, doc, updateDoc } = window.CPFirebase;
    await updateDoc(doc(db, 'testimonials', firestoreId), fields);
}

async function deleteTestimonial(firestoreId) {
    const { db, doc, deleteDoc } = window.CPFirebase;
    await deleteDoc(doc(db, 'testimonials', firestoreId));
}
