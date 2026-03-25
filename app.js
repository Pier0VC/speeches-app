import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 CONFIG (EDITA SOLO ESTO)
const firebaseConfig = {
  apiKey: "AIzaSyDIrxc5PEbEvdmURAz81A_kdy84wm5_SXA",
  authDomain: "speeches-app.firebaseapp.com",
  projectId: "speeches-app",
  storageBucket: "speeches-app.firebasestorage.app",
  messagingSenderId: "351553442090",
  appId: "1:351553442090:web:c53b263236ec52de10ce53"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let selectedAreaId = null;
let selectedGroupId = null;

// -------- AREAS --------
window.crearArea = async () => {
  const input = document.getElementById("areaInput");
  if (!input.value) return;

  await addDoc(collection(db, "areas"), { name: input.value });
  input.value = "";
  cargarAreas();
};

async function cargarAreas() {
  const snapshot = await getDocs(collection(db, "areas"));
  const select = document.getElementById("areaSelect");

  select.innerHTML = "<option>Selecciona área</option>";

  snapshot.forEach(docSnap => {
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = docSnap.data().name;
    select.appendChild(option);
  });
}

document.getElementById("areaSelect").addEventListener("change", (e) => {
  selectedAreaId = e.target.value;
  selectedGroupId = null;

  document.getElementById("btnGrupo").disabled = false;
  document.getElementById("btnSpeech").disabled = true;

  cargarGrupos();
});

// -------- GRUPOS --------
window.crearGrupo = async () => {
  const input = document.getElementById("groupInput");
  if (!input.value) return;

  await addDoc(collection(db, "areas", selectedAreaId, "groups"), {
    name: input.value
  });

  input.value = "";
  cargarGrupos();
};

async function cargarGrupos() {
  const snapshot = await getDocs(
    collection(db, "areas", selectedAreaId, "groups")
  );

  const container = document.getElementById("groupsContainer");
  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    const btn = document.createElement("button");
    btn.textContent = docSnap.data().name;

    btn.onclick = () => {
      selectedGroupId = docSnap.id;
      document.getElementById("btnSpeech").disabled = false;
      cargarSpeeches();
    };

    container.appendChild(btn);
  });
}

// -------- SPEECHES --------
window.crearSpeech = async () => {
  const title = document.getElementById("speechTitle");
  const content = document.getElementById("speechContent");

  if (!title.value || !content.value) return;

  await addDoc(
    collection(
      db,
      "areas",
      selectedAreaId,
      "groups",
      selectedGroupId,
      "speeches"
    ),
    {
      title: title.value,
      content: content.value
    }
  );

  title.value = "";
  content.value = "";
  cargarSpeeches();
};

async function cargarSpeeches() {
  const snapshot = await getDocs(
    collection(
      db,
      "areas",
      selectedAreaId,
      "groups",
      selectedGroupId,
      "speeches"
    )
  );

  const container = document.getElementById("speechesContainer");
  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    renderSpeech(docSnap, data, container);
  });
}

// EDITAR
window.editarSpeech = async (id, title, content) => {
  const ref = doc(
    db,
    "areas",
    selectedAreaId,
    "groups",
    selectedGroupId,
    "speeches",
    id
  );

  let updateData = {};
  if (title !== null) updateData.title = title;
  if (content !== null) updateData.content = content;

  await updateDoc(ref, updateData);
};

// ELIMINAR
window.eliminarSpeech = async (id) => {
  await deleteDoc(
    doc(
      db,
      "areas",
      selectedAreaId,
      "groups",
      selectedGroupId,
      "speeches",
      id
    )
  );
  cargarSpeeches();
};

// COPIAR
window.copiarTexto = async (texto) => {
  try {
    await navigator.clipboard.writeText(texto);
    alert("Copiado ✅");
  } catch (err) {
    console.error(err);
    alert("Error al copiar");
  }
};

// INIT
cargarAreas();



window.buscarSpeeches = async (texto) => {
  if (!selectedAreaId) return;

  const container = document.getElementById("speechesContainer");
  container.innerHTML = "";

  const groupsSnap = await getDocs(
    collection(db, "areas", selectedAreaId, "groups")
  );

  for (const groupDoc of groupsSnap.docs) {
    const speechesSnap = await getDocs(
      collection(
        db,
        "areas",
        selectedAreaId,
        "groups",
        groupDoc.id,
        "speeches"
      )
    );

    speechesSnap.forEach(docSnap => {
      const data = docSnap.data();

      if (data.title.toLowerCase().includes(texto.toLowerCase())) {
        renderSpeech(docSnap, data, container);
      }
    });
  }
};

function renderSpeech(docSnap, data, container) {
  const div = document.createElement("div");
  div.className = "speech-card";

  const title = document.createElement("h4");
  title.contentEditable = true;
  title.innerText = data.title;
  title.onblur = () => editarSpeech(docSnap.id, title.innerText, null);

  const content = document.createElement("p");
  content.contentEditable = true;
  content.innerText = data.content;
  content.onblur = () => editarSpeech(docSnap.id, null, content.innerText);

  const actions = document.createElement("div");
  actions.className = "actions";

  const copyBtn = document.createElement("button");
  copyBtn.innerText = "Copiar";
  copyBtn.onclick = () => copiarTexto(content.innerText);

  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "Eliminar";
  deleteBtn.onclick = () => eliminarSpeech(docSnap.id);

  actions.appendChild(copyBtn);
  actions.appendChild(deleteBtn);

  div.appendChild(title);
  div.appendChild(content);
  div.appendChild(actions);

  container.appendChild(div);
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  const texto = e.target.value;

  if (texto.length === 0) {
    if (selectedGroupId) cargarSpeeches();
    return;
  }

  buscarSpeeches(texto);
});