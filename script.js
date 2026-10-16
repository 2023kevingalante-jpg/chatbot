// Variables de estado local para que el bot recuerde datos del usuario
let datosUsuario = {
  nombre: "",
  riesgo: "",
  rendimiento: "",
  montoSimulacion: 0
};

let arbolDecision = {};

// Elementos del DOM
const cajaMensajes = document.getElementById("caja-mensajes");
const contenedorBotones = document.getElementById("contenedor-botones");

// Inicializar y cargar el archivo JSON
document.addEventListener("DOMContentLoaded", () => {
  cargarArbol();
});

// Función para cargar el árbol de decisión via fetch
function cargarArbol() {
  fetch("arbol_decision.json")
    .then((respuesta) => {
      if (!respuesta.ok) {
        throw new Error("Error en la respuesta de la red");
      }
      return respuesta.json();
    })
    .then((data) => {
      arbolDecision = data;
      procesarNodo("inicio");
    })
    .catch((error) => {
      mostrarMensajeBot(
        "Abrí el proyecto con Live Server o un servidor local para que pueda leer arbol_decision.json."
      );
      console.error("Error al cargar arbol_decision.json:", error);
    });
}

// Procesa y renderiza cada nodo del árbol
function procesarNodo(idNodo) {
  const nodo = arbolDecision[idNodo];

  if (!nodo) {
    console.error("El nodo no existe:", idNodo);
    return;
  }

  // Si el nodo actualiza alguna variable de preferencia
  if (nodo.guardarRiesgo) datosUsuario.riesgo = nodo.guardarRiesgo;
  if (nodo.guardarRendimiento) datosUsuario.rendimiento = nodo.guardarRendimiento;

  // Reemplazar variables dinámicas en el texto del nodo
  let textoProcesado = reemplazarVariables(nodo.texto);

  mostrarMensajeBot(textoProcesado);
  limpiarContenedorBotones();

  // Caso especial: Input para ingresar el nombre
  if (nodo.requiereInputNombre) {
    renderizarInputNombre(nodo.siguiente);
    return;
  }

  // Caso especial: Input para ingresar monto de simulación
  if (nodo.requiereInputMonto) {
    renderizarInputMonto(nodo.siguiente);
    return;
  }

  // Renderizar las opciones mediante botones
  if (nodo.opciones && nodo.opciones.length > 0) {
    nodo.opciones.forEach((opcion) => {
      const boton = document.createElement("button");
      boton.className = "btn-opcion";
      boton.textContent = opcion.texto;
      boton.addEventListener("click", () => {
        mostrarMensajeUsuario(opcion.texto);
        
        // Manejar reinicio o fin de conversación si corresponde
        if (opcion.siguiente === "inicio") {
          resetearDatosUsuario();
        }
        
        procesarNodo(opcion.siguiente);
      });
      contenedorBotones.appendChild(boton);
    });
  }
}

// Reemplaza marcadores de texto por los datos en memoria
function reemplazarVariables(texto) {
  return texto
    .replace("{nombre}", datosUsuario.nombre || "Usuario")
    .replace("{riesgo}", datosUsuario.riesgo || "no definido")
    .replace("{rendimiento}", datosUsuario.rendimiento || "no definido")
    .replace("{monto}", datosUsuario.montoSimulacion.toLocaleString("es-AR"));
}

// Muestra mensajes del Bot en la interfaz
function mostrarMensajeBot(texto) {
  const div = document.createElement("div");
  div.className = "mensaje burbuja-bot";
  div.innerHTML = texto;
  cajaMensajes.appendChild(div);
  hacerScrollAlFinal();
}

// Muestra mensajes del Usuario en la interfaz
function mostrarMensajeUsuario(texto) {
  const div = document.createElement("div");
  div.className = "mensaje burbuja-usuario";
  div.textContent = texto;
  cajaMensajes.appendChild(div);
  hacerScrollAlFinal();
}

// Formulario para ingreso de nombre con validación
function renderizarInputNombre(siguienteNodo) {
  const form = document.createElement("form");
  form.className = "input-form";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "input-nombre";
  input.placeholder = "Escribí tu nombre sin números...";
  input.required = true;

  const btnEnviar = document.createElement("button");
  btnEnviar.type = "submit";
  btnEnviar.className = "btn-enviar";
  btnEnviar.textContent = "Continuar";

  const errorSpan = document.createElement("span");
  errorSpan.className = "mensaje-error";

  form.appendChild(input);
  form.appendChild(btnEnviar);
  form.appendChild(errorSpan);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valor = input.value.trim();
    // Validación: solo letras y espacios
    const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (!valor || !regexSoloLetras.test(valor)) {
      errorSpan.textContent = "Por favor ingresá un nombre válido (solo letras).";
      return;
    }

    datosUsuario.nombre = valor;
    mostrarMensajeUsuario(valor);
    procesarNodo(siguienteNodo);
  });

  contenedorBotones.appendChild(form);
}

// Formulario para ingreso de monto con validación
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
  btnEnviar.textContent = "Simular";

  const errorSpan = document.createElement("span");
  errorSpan.className = "mensaje-error";

  form.appendChild(input);
  form.appendChild(btnEnviar);
  form.appendChild(errorSpan);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valor = parseFloat(input.value);

    // Validación: valor numérico válido mayor a 0
    if (isNaN(valor) || valor <= 0) {
      errorSpan.textContent = "Por favor ingresá un monto válido mayor a 0.";
      return;
    }

    datosUsuario.montoSimulacion = valor;
    mostrarMensajeUsuario("$" + valor.toLocaleString("es-AR"));
    procesarNodo(siguienteNodo);
  });

  contenedorBotones.appendChild(form);
}

// Funciones auxiliares
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
    montoSimulacion: 0
  };
}