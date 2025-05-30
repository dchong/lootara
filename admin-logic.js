// admin-logic.js

// Load shared header and footer
fetch("header.html")
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("header-placeholder").innerHTML = html;
  });

fetch("footer.html")
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("footer-placeholder").innerHTML = html;
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  })
  .catch((err) => console.error("Failed to load footer:", err));

// Firebase setup
const firebaseConfig = {
  apiKey: "AIzaSyCRxeeIUMQUQ1H8RIKk5lXh77IQAGHhMe4",
  authDomain: "lootara-website.firebaseapp.com",
  projectId: "lootara-website",
  storageBucket: "lootara-website.firebasestorage.app",
  messagingSenderId: "984923606768",
  appId: "1:984923606768:web:7d816b4c4dea60c6b7fc35",
  measurementId: "G-46CY0YCTW1",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Element references
const pokemonForm = document.getElementById("pokemonForm");
const bearbrickForm = document.getElementById("bearbrickForm");
const pokemonList = document.getElementById("pokemonList");
const bearbrickList = document.getElementById("bearbrickList");
const pokemonStatus = document.getElementById("pokemonStatus");
const bearbrickStatus = document.getElementById("bearbrickStatus");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");

// Upload images
async function uploadImages(files, folder) {
  const urls = [];
  for (const file of files) {
    const ref = storage.ref(`${folder}/${Date.now()}-${file.name}`);
    await ref.put(file);
    urls.push(await ref.getDownloadURL());
  }
  return urls;
}

// Render card
function renderCard(doc, type) {
  const d = doc.data();
  const el = document.createElement("div");
  el.className = "bg-white p-4 rounded shadow";
  el.innerHTML = `
    <h3 class="font-bold text-lg">${d.name}</h3>
    <p class="text-sm text-gray-600">Set: ${d.set || ""} | Condition: ${
    d.condition || ""
  }</p>
    <p class="text-sm">Price: $${d.price} | Purchase: $${
    d.purchasePrice || 0
  } | Status: ${d.status}</p>
    <p class="text-sm">Storage Bin: ${d.location || ""}</p>
    <p class="text-sm">Purchased From: ${d.purchasedFrom || ""}</p>
    <p class="text-sm">Notes: ${d.notes || ""}</p>
    <div class="flex flex-wrap gap-2 mt-2">
      ${(d.images || [])
        .map(
          (img) => `<img src="${img}" class="w-20 h-20 object-cover rounded" />`
        )
        .join("")}
    </div>
    <div class="mt-4 flex gap-2">
      <button class="bg-yellow-500 text-white px-3 py-1 rounded" onclick="editCard('${
        doc.id
      }', '${type}')">Edit</button>
      <button class="bg-red-600 text-white px-3 py-1 rounded" onclick="deleteCard('${
        doc.id
      }', '${type}')">Delete</button>
    </div>
  `;
  (type === "pokemon" ? pokemonList : bearbrickList).appendChild(el);
}

// Load cards
async function loadCards() {
  const query = searchInput.value.toLowerCase();
  const filter = filterStatus.value;
  const snap = await db.collection("pokemon").get();
  pokemonList.innerHTML = "";
  snap.forEach((doc) => {
    const d = doc.data();
    if (
      (!query || d.name.toLowerCase().includes(query)) &&
      (!filter || d.status === filter)
    ) {
      renderCard(doc, "pokemon");
    }
  });
}

// Load bearbricks
async function loadBearbricks() {
  const snap = await db.collection("bearbricks").get();
  bearbrickList.innerHTML = "";
  snap.forEach((doc) => renderCard(doc, "bearbricks"));
}

// Edit card
async function editCard(id, type) {
  const doc = await db.collection(type).doc(id).get();
  if (!doc.exists) return;
  const d = doc.data();

  const prefix = type === "pokemon" ? "pokemon" : "bearbrick"; // 🔧 Fix the mismatch
  const form = type === "pokemon" ? pokemonForm : bearbrickForm;

  form[`${prefix}DocId`].value = id;
  form[`${prefix}Name`].value = d.name;
  form[`${prefix}Set`].value = d.set;
  form[`${prefix}Condition`].value = d.condition;
  form[`${prefix}Price`].value = d.price;
  form[`${prefix}PurchasePrice`].value = d.purchasePrice || "";
  form[`${prefix}PurchasedFrom`].value = d.purchasedFrom || "";
  form[`${prefix}StatusField`].value = d.status || "";
  form[`${prefix}StripeLink`].value = d.stripeLink || "";
  form[`${prefix}Notes`].value = d.notes || "";
  form[`${prefix}Location`].value = d.location || "";
}

// Delete card
async function deleteCard(id, type) {
  if (confirm("Are you sure?")) {
    await db.collection(type).doc(id).delete();
    type === "pokemon" ? loadCards() : loadBearbricks();
  }
}

// Submit Pokémon
pokemonForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = pokemonForm.pokemonDocId.value;
  const files = document.getElementById("pokemonImageUpload").files;
  const images = await uploadImages(files, "pokemon");
  const data = {
    name: pokemonForm.pokemonName.value,
    set: pokemonForm.pokemonSet.value,
    condition: pokemonForm.pokemonCondition.value,
    price: parseFloat(pokemonForm.pokemonPrice.value),
    purchasePrice: parseFloat(pokemonForm.pokemonPurchasePrice.value) || null,
    purchasedFrom: pokemonForm.pokemonPurchasedFrom.value,
    status: pokemonForm.pokemonStatusField.value,
    stripeLink: pokemonForm.pokemonStripeLink.value || "",
    notes: pokemonForm.pokemonNotes.value || "",
    location: pokemonForm.pokemonLocation.value || "",
  };
  if (images.length) data.images = images;
  if (id) await db.collection("pokemon").doc(id).update(data);
  else await db.collection("pokemon").add(data);
  pokemonForm.reset();
  pokemonForm.pokemonDocId.value = "";
  loadCards();
});

// Submit Bearbrick
bearbrickForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = bearbrickForm.bearbrickDocId.value;
  const files = document.getElementById("bearbrickImageUpload").files;
  const images = await uploadImages(files, "bearbricks");
  const data = {
    name: bearbrickForm.bearbrickName.value,
    set: bearbrickForm.bearbrickSet.value,
    condition: bearbrickForm.bearbrickCondition.value,
    price: parseFloat(bearbrickForm.bearbrickPrice.value),
    purchasePrice:
      parseFloat(bearbrickForm.bearbrickPurchasePrice.value) || null,
    purchasedFrom: bearbrickForm.bearbrickPurchasedFrom.value,
    status: bearbrickForm.bearbrickStatusField.value,
    stripeLink: bearbrickForm.bearbrickStripeLink.value || "",
    notes: bearbrickForm.bearbrickNotes.value || "",
    location: bearbrickForm.bearbrickLocation.value || "",
  };
  if (images.length) data.images = images;
  if (id) await db.collection("bearbricks").doc(id).update(data);
  else await db.collection("bearbricks").add(data);
  bearbrickForm.reset();
  bearbrickForm.bearbrickDocId.value = "";
  loadBearbricks();
});

// Tabs
document.getElementById("pokemonTab").addEventListener("click", () => {
  pokemonSection.classList.remove("hidden");
  bearbrickSection.classList.add("hidden");
});

document.getElementById("bearbrickTab").addEventListener("click", () => {
  pokemonSection.classList.add("hidden");
  bearbrickSection.classList.remove("hidden");
  loadBearbricks();
});

// Filters
searchInput.addEventListener("input", loadCards);
filterStatus.addEventListener("change", loadCards);

// Initial Load
loadCards();
