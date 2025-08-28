// ===== CONFIGURACIÓN =====
const ENDPOINT = "https://script.google.com/macros/s/AKfycbx1oOaQjHufK_f-YOPIN2luM6QOhEW5y-U-T2YRQ8yZpetfUSzpZB-1201Bb9mzaF7aXw/exec";

// ===== Elementos =====
const canvas   = document.getElementById("canvas");
const form     = document.getElementById("visit-form");
const btnClear = document.getElementById("btn-clear");
const debug    = document.getElementById("debug");
const statusMsg= document.getElementById("status");

let signaturePad;

// Ajusta canvas al tamaño visible y densidad de píxeles
function resizeCanvas() {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  if (signaturePad) signaturePad.clear();
}

function initSignature() {
  resizeCanvas();
  signaturePad = new SignaturePad(canvas, {
    minWidth: 0.8,
    maxWidth: 2.2,
    penColor: "#111827",
    backgroundColor: "rgba(255,255,255,0)"
  });
}

window.addEventListener("resize", resizeCanvas);
initSignature();
btnClear.addEventListener("click", () => signaturePad.clear());

// ===== Envío del formulario =====
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // limpia estado
  statusMsg.textContent = "";
  statusMsg.className = "status";

  const nombre   = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const sede     = document.getElementById("sede").value;
  const fechaISO = new Date().toISOString();

  if (!nombre || !apellido || !sede) {
    statusMsg.textContent = "⚠️ Por favor completa todos los campos obligatorios.";
    statusMsg.classList.add("error");
    return;
  }
  if (signaturePad.isEmpty()) {
    statusMsg.textContent = "⚠️ Por favor dibuja tu firma.";
    statusMsg.classList.add("error");
    return;
  }

  // Firma como PNG base64
  const firmaDataURL = signaturePad.toDataURL("image/png");

  // Payload
  const payload = { nombre, apellido, sede, fecha: fechaISO, firma: firmaDataURL };

  if (!ENDPOINT) {
    debug.hidden = false;
    debug.textContent = "MODO PRUEBA:\n" + JSON.stringify(payload, null, 2);
    statusMsg.textContent = "ℹ️ Datos capturados (modo prueba).";
    statusMsg.classList.add("success");
    return;
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      // Usamos text/plain para evitar preflight CORS con Apps Script
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("HTTP", res.status, text);
      statusMsg.textContent = "❌ Error " + res.status + ": " + text;
      statusMsg.classList.add("error");
      return;
    }

    statusMsg.textContent = "✔️ Registro enviado con éxito.";
    statusMsg.classList.add("success");
    form.reset();
    signaturePad.clear();
  } catch (err) {
    console.error(err);
    statusMsg.textContent = "❌ Fallo de red: " + String(err);
    statusMsg.classList.add("error");
  }
});
