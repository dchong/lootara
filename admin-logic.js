// admin-logic.js

// Load the shared header
fetch("header.html")
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("header-placeholder").innerHTML = html;
  });

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

const pokemonForm = document.getElementById("pokemonForm");
const pokemonList = document.getElementById("pokemonList");
const pokemonStatus = document.getElementById("pokemonStatus");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");

pokemonForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const docId = pokemonForm.pokemonDocId.value;
  const files = document.getElementById("pokemonImageUpload").files;
  const imageUrls = [];

  try {
    if (files.length > 0) {
      for (const file of files) {
        const storageRef = storage.ref(`pokemon/${Date.now()}-${file.name}`);
        await storageRef.put(file);
        const url = await storageRef.getDownloadURL();
        imageUrls.push(url);
      }
    }

    const cardData = {
      name: pokemonForm.pokemonName.value,
      set: pokemonForm.pokemonSet.value,
      condition: pokemonForm.pokemonCondition.value,
      price: parseFloat(pokemonForm.pokemonPrice.value),
      purchasePrice: parseFloat(pokemonForm.pokemonPurchasePrice.value) || null,
      purchasedFrom: pokemonForm.pokemonPurchasedFrom.value,
      status: pokemonForm.pokemonStatusField.value,
      stripeLink: pokemonForm.pokemonStripeLink.value || "",
      notes: pokemonForm.pokemonNotes.value || "",
    };

    if (imageUrls.length > 0) {
      cardData.images = imageUrls;
    }

    if (docId) {
      await db.collection("pokemon").doc(docId).update(cardData);
      pokemonStatus.textContent = "Card updated successfully!";
    } else {
      await db.collection("pokemon").add(cardData);
      pokemonStatus.textContent = "Card added successfully!";
    }

    pokemonForm.reset();
    pokemonForm.pokemonDocId.value = "";
    loadCards();
  } catch (err) {
    pokemonStatus.textContent = "Error: " + err.message;
    pokemonStatus.classList.add("text-red-600");
  }
});

function renderCard(doc) {
  const card = doc.data();
  const div = document.createElement("div");
  div.className = "bg-white p-4 rounded shadow";
  div.innerHTML = `
    <h3 class="font-bold text-lg">${card.name}</h3>
    <p class="text-sm text-gray-600">Set: ${card.set || ""} | Condition: ${
    card.condition || ""
  }</p>
    <p class="text-sm">Price: $${card.price} | Purchase: $${
    card.purchasePrice || 0
  } | Status: ${card.status}</p>
    <p class="text-sm">Purchased From: ${card.purchasedFrom || ""}</p>
    <p class="text-sm">Notes: ${card.notes || ""}</p>
    <div class="flex flex-wrap gap-2 mt-2">
      ${(card.images || [])
        .map(
          (img) => `<img src="${img}" class="w-20 h-20 object-cover rounded" />`
        )
        .join("")}
    </div>
    <div class="mt-4 flex gap-2">
      <button class="bg-yellow-500 text-white px-3 py-1 rounded" onclick="editCard('${
        doc.id
      }')">Edit</button>
      <button class="bg-red-600 text-white px-3 py-1 rounded" onclick="deleteCard('${
        doc.id
      }')">Delete</button>
    </div>
  `;
  pokemonList.appendChild(div);
}

async function loadCards() {
  const snapshot = await db.collection("pokemon").get();
  pokemonList.innerHTML = "";
  const query = searchInput.value.toLowerCase();
  const statusFilter = filterStatus.value;

  snapshot.forEach((doc) => {
    const card = doc.data();
    if (
      (!query || card.name.toLowerCase().includes(query)) &&
      (!statusFilter || card.status === statusFilter)
    ) {
      renderCard(doc);
    }
  });
}

async function editCard(id) {
  const doc = await db.collection("pokemon").doc(id).get();
  if (doc.exists) {
    const card = doc.data();
    pokemonForm.pokemonDocId.value = id;
    pokemonForm.pokemonName.value = card.name;
    pokemonForm.pokemonSet.value = card.set;
    pokemonForm.pokemonCondition.value = card.condition;
    pokemonForm.pokemonPrice.value = card.price;
    pokemonForm.pokemonPurchasePrice.value = card.purchasePrice || "";
    pokemonForm.pokemonPurchasedFrom.value = card.purchasedFrom || "";
    pokemonForm.pokemonStatusField.value = card.status || "";
    pokemonForm.pokemonStripeLink.value = card.stripeLink;
    pokemonForm.pokemonNotes.value = card.notes || "";
  }
}

async function deleteCard(id) {
  if (confirm("Are you sure you want to delete this card?")) {
    await db.collection("pokemon").doc(id).delete();
    loadCards();
  }
}

searchInput.addEventListener("input", loadCards);
filterStatus.addEventListener("change", loadCards);

// Tab switching
const pokemonTab = document.getElementById("pokemonTab");
const bearbrickTab = document.getElementById("bearbrickTab");
const pokemonSection = document.getElementById("pokemonSection");
const bearbrickSection = document.getElementById("bearbrickSection");

pokemonTab.addEventListener("click", () => {
  pokemonSection.classList.remove("hidden");
  bearbrickSection.classList.add("hidden");
  pokemonTab.classList.add("bg-blue-500", "text-white");
  bearbrickTab.classList.remove("bg-blue-500", "text-white");
  bearbrickTab.classList.add("bg-gray-300");
});

bearbrickTab.addEventListener("click", () => {
  pokemonSection.classList.add("hidden");
  bearbrickSection.classList.remove("hidden");
  bearbrickTab.classList.add("bg-blue-500", "text-white");
  pokemonTab.classList.remove("bg-blue-500", "text-white");
  pokemonTab.classList.add("bg-gray-300");
});

loadCards();
