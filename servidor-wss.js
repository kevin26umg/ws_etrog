const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");

// 🔐 HTTPS para WSS
const server = https.createServer({
  cert: fs.readFileSync("/app/certs/cert.pem"),
  key: fs.readFileSync("/app/certs/key.pem")
});

const wss = new WebSocket.Server({ server });

// 🧠 Estado global que se mantiene en memoria
let estadoGlobal = {
  mesas: [],
  colores: {}
};

wss.on("connection", (ws) => {
  console.log("🟢 Cliente conectado");

  // 🔄 Enviar estado actual al nuevo cliente
  if (estadoGlobal.mesas.length > 0) {
    ws.send(JSON.stringify({
      tipo: "sincronizar_mesas",
      data: estadoGlobal
    }));
  }

  ws.on("message", (message) => {
    console.log("📨 Mensaje recibido:", message.toString());

    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      console.warn("⚠️ No se pudo parsear el mensaje:", message);
      return;
    }

    // ✅ Sincronizar estado completo
    if (data.tipo === "sincronizar_mesas") {
      estadoGlobal = data.data;

      // Reenviar a todos los demás
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            tipo: "sincronizar_mesas",
            data: estadoGlobal
          }));
        }
      });
    }

    // 🟡 Otros tipos de mensaje (globales, eventos, etc.)
    else {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
    }
  });
});

server.listen(3026, () => {
  console.log("✅ Servidor WebSocket escuchando en puerto 3000 con WSS");
});
