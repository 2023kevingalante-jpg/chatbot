// Memoria de datos de usuario para el flujo conversacional
let datosUsuario = {
  nombre: "",
  riesgo: "",
  rendimiento: "",
  montoSimulacion: 0,
  instrumentoSimulacion: ""
};

let arbolDecision = {};

// Captura de elementos estructurales del HTML
const cajaMensajes = document.getElementById("caja-mensajes");
const contenedorBotones = document.getElementById("contenedor-botones");

// Inicio del flujo al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarArbol();
});

// Carga del árbol JSON mediante fetch
function cargarArbol() {
  fetch("arbol_decision.json")
    .then((respuesta) => {
      if (!respuesta.ok) {
        throw new Error("Respuesta no válida del servidor");
      }
      return respuesta.json();
    })
    .then((data) => {
      arbolDecision = data;
      procesarNodo("inicio");
    })
    .catch((error) => {
      mostrarMensajeBot(
        "⚠️ Abrí el proyecto con Live Server o un servidor local para que pueda leer arbol_decision.json."
      );
      console.error("Error al cargar arbol_decision.json:", error);
    });
}

// Procesa cada nodo del JSON
function procesarNodo(idNodo) {
  const nodo = arbolDecision[idNodo];

  if (!nodo) {
    console.error("El nodo solicitado no existe:", idNodo);
    return;
  }

  // Guardar selecciones del usuario en el objeto de datos
  if (nodo.guardarRiesgo) datosUsuario.riesgo = nodo.guardarRiesgo;
  if (nodo.guardarRendimiento) datosUsuario.rendimiento = nodo.guardarRendimiento;
  if (nodo.guardarInstrumento) datosUsuario.instrumentoSimulacion = nodo.guardarInstrumento;

  let textoFormateado = reemplazarVariables(nodo.texto);

  mostrarMensajeBot(textoFormateado);
  limpiarContenedorBotones();

  // Gestión de inputs especiales
  if (nodo.requiereInputNombre) {
    renderizarInputNombre(nodo.siguiente);
    return;
  }

  if (nodo.requiereInputMonto) {
    renderizarInputMonto(nodo.siguiente);
    return;
  }

  // Generación de botones de respuesta
  if (nodo.opciones && nodo.opciones.length > 0) {
    nodo.opciones.forEach((opcion) => {
      const boton = document.createElement("button");
      boton.className = "btn-opcion";
      boton.innerHTML = opcion.texto;
      boton.addEventListener("click", () => {
        mostrarMensajeUsuario(opcion.texto);

        if (opcion.siguiente === "inicio") {
          resetearDatosUsuario();
        }

        procesarNodo(opcion.siguiente);
      });
      contenedorBotones.appendChild(boton);
    });
  }
}

// Cálculo dinámico de retornos según la inversión seleccionada
function calcularGananciaEstimada() {
  const monto = datosUsuario.montoSimulacion;
  const inst = datosUsuario.instrumentoSimulacion;

  switch (inst) {
    case "Plazo Fijo":
      return { tasa: "TNA 40%", resultado: (monto * 1.033).toFixed(2), horizonte: "30 días" };
    case "FCI Money Market":
      return { tasa: "38% Estimado", resultado: (monto * 1.031).toFixed(2), horizonte: "30 días (rescate inmediato)" };
    case "Bonos Sov.":
      return { tasa: "TIR 12% USD", resultado: (monto * 1.12).toFixed(2), horizonte: "12 meses" };
    case "Cedears":
      return { tasa: "Proyección +28%", resultado: (monto * 1.28).toFixed(2), horizonte: "12 meses" };
    case "Acciones Locales":
      return { tasa: "Estimado +35%", resultado: (monto * 1.35).toFixed(2), horizonte: "12 meses" };
    case "Criptomonedas":
      return { tasa: "Volatilidad (+50% / -20%)", resultado: (monto * 1.50).toFixed(2), horizonte: "12 meses" };
    default:
      return { tasa: "0%", resultado: monto.toFixed(2), horizonte: "Sin definir" };
  }
}

// Reemplazo de marcas de texto con datos cargados
function reemplazarVariables(texto) {
  const sim = calcularGananciaEstimada();
  
  return texto
    .replace(/{nombre}/g, datosUsuario.nombre || "Usuario")
    .replace(/{riesgo}/g, datosUsuario.riesgo || "No definido")
    .replace(/{rendimiento}/g, datosUsuario.rendimiento || "No definido")
    .replace(/{monto}/g, datosUsuario.montoSimulacion.toLocaleString("es-AR"))
    .replace(/{instrumento}/g, datosUsuario.instrumentoSimulacion)
    .replace(/{tasa}/g, sim.tasa)
    .replace(/{montoFinal}/g, parseFloat(sim.resultado).toLocaleString("es-AR"))
    .replace(/{horizonte}/g, sim.horizonte);
}

// Renderizar mensaje proveniente del bot
function mostrarMensajeBot(texto) {
  const div = document.createElement("div");
  div.className = "mensaje burbuja-bot";
  div.innerHTML = texto;
  cajaMensajes.appendChild(div);
  hacerScrollAlFinal();
}

// Renderizar mensaje del usuario
function mostrarMensajeUsuario(texto) {
  const div = document.createElement("div");
  div.className = "mensaje burbuja-usuario";
  div.innerHTML = texto;
  cajaMensajes.appendChild(div);
  hacerScrollAlFinal();
}

// Formulario e ingreso validado del Nombre
function renderizarInputNombre(siguienteNodo) {
  const form = document.createElement("form");
  form.className = "input-form";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "input-nombre";
  input.placeholder = "Escribí tu nombre (ej. Carlos)...";
  input.required = true;

  const btnEnviar = document.createElement("button");
  btnEnviar.type = "submit";
  btnEnviar.className = "btn-enviar";
  btnEnviar.textContent = "Continuar ➡️";

  const errorSpan = document.createElement("span");
  errorSpan.className = "mensaje-error";

  form.appendChild(input);
  form.appendChild(btnEnviar);
  form.appendChild(errorSpan);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valor = input.value.trim();
    const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!valor || !regexSoloLetras.test(valor)) {
      errorSpan.textContent = "❌ Ingresá un nombre válido sin números ni caracteres especiales.";
      return;
    }

    datosUsuario.nombre = valor;
    mostrarMensajeUsuario(valor);
    procesarNodo(siguienteNodo);
  });

  contenedorBotones.appendChild(form);
}

// Formulario e ingreso validado del Monto
function renderizarInputMonto(siguienteNodo) {
  const form = document.createElement("form");
  form.className = "input-form";

  const input = document.createElement("input");
  input.type = "number";
  input.className = "input-monto";
  input.placeholder = "Ingresá un monto ej: 100000";
  input.min = "1000";
  input.required = true;

  const btnEnviar = document.createElement("button");
  btnEnviar.type = "submit";
  btnEnviar.className = "btn-enviar";
  btnEnviar.textContent = "Confirmar Monto 💵";

  const errorSpan = document.createElement("span");
  errorSpan.className = "mensaje-error";

  form.appendChild(input);
  form.appendChild(btnEnviar);
  form.appendChild(errorSpan);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valor = parseFloat(input.value);

    if (isNaN(valor) || valor <= 0) {
      errorSpan.textContent = "❌ Ingresá un valor numérico superior a 0.";
      return;
    }

    datosUsuario.montoSimulacion = valor;
    mostrarMensajeUsuario("$" + valor.toLocaleString("es-AR"));
    procesarNodo(siguienteNodo);
  });

  contenedorBotones.appendChild(form);
}

function limpiarContenedorBotones() {
  contenedorBotones.innerHTML = "";
}

function hacerScrollAlFinal() {
  cajaMensajes.scrollTop = cajaMensajes.scrollHeight;
}

function resetearDatosUsuario() {
  datosUsuario = {
    nombre: "",
    riesgo: "",
    rendimiento: "",
    montoSimulacion: 0,
    instrumentoSimulacion: ""
  };
}
