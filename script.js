// ===== CONFIGURACIÓN =====
const ENDPOINT = "https://script.google.com/macros/s/AKfycbzEw7ZPI5f_-lhdj6cleHPkpZzAppGoZ-Z10CTIJ8y6h2NMG6DVAK_Of1gs6sXgUr25qg/exec";

// ===== Elementos =====
const canvas    = document.getElementById("canvas");
const form      = document.getElementById("visit-form");
const btnClear  = document.getElementById("btn-clear");
const statusMsg = document.getElementById("status");
const delayHint = document.getElementById("delay-hint");

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

  // Limpia estado
  statusMsg.textContent = "";
  statusMsg.className = "status";

  // Toma TODOS los campos que exige el backend
  const nombre        = document.getElementById("nombre").value.trim();
  const documento     = document.getElementById("documento").value.trim();
  const fecha_ingreso = document.getElementById("fecha_ingreso").value;
  const empresa       = document.getElementById("empresa").value.trim();
  const visita        = document.getElementById("visita").value.trim();
  const motivo        = document.getElementById("motivo").value.trim();
  const hora_entrada  = document.getElementById("hora_entrada").value;
  const eps           = document.getElementById("eps").value.trim();
  const arl           = document.getElementById("arl").value.trim();
  const hora_salida   = document.getElementById("hora_salida").value;

  // Validaciones básicas
  if (!nombre || !documento || !fecha_ingreso || !empresa || !visita ||
      !motivo || !hora_entrada || !eps || !arl || !hora_salida) {
    statusMsg.textContent = "⚠️ Por favor completa todos los campos obligatorios.";
    statusMsg.classList.add("error");
    return;
  }
  if (signaturePad.isEmpty()) {
    statusMsg.textContent = "⚠️ Por favor dibuja tu firma.";
    statusMsg.classList.add("error");
    return;
  }

  // Firma PNG base64
  const firmaDataURL = signaturePad.toDataURL("image/png");

  // Payload con las CLAVES que espera Apps Script
  const payload = {
    nombre,
    documento,
    fecha_ingreso,
    empresa,
    visita,
    motivo,
    hora_entrada,
    eps,
    arl,
    hora_salida,
    firma: firmaDataURL
  };

  // UI: deshabilito botón mientras envío
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  // Cambio color/texto mientras se envía
  delayHint.style.color = "#2563eb"; // azul
  delayHint.textContent = "⏳ Enviando... esto puede tardar unos segundos.";

  try {
    // Importante: no intentamos leer la respuesta (GAS hace redirect y no da CORS)
    await fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors", // evita el error visual de CORS/redirect
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    // Si no hubo excepción, asumimos éxito
    statusMsg.textContent = "✔️ Registro enviado con éxito.";
    statusMsg.classList.add("success");
    form.reset();
    signaturePad.clear();
  } catch (err) {
    console.error(err);
    statusMsg.textContent = "❌ Fallo de red: " + String(err);
    statusMsg.classList.add("error");
  } finally {
    submitBtn.disabled = false;
    delayHint.style.color = "#6b7280"; // gris
    delayHint.textContent = "⏳ Después de dar clic en 'Enviar' la respuesta puede tardar de 5 a 10 segundos. Por favor no presiones el botón varias veces.";
  }
});
