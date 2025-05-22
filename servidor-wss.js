const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");


const server = https.createServer({
  cert: fs.readFileSync("/app/certs/cert.pem"),
  key: fs.readFileSync("/app/certs/key.pem")
});

const wss = new WebSocket.Server({ server });

let estadoGlobal = {
  mesas: [],
  colores: {}
};

wss.on("connection", (ws) => {
  console.log("🟢 Cliente conectado");


  if (estadoGlobal.mesas.length > 0) {
    ws.send(JSON.stringify({
      tipo: "sincronizar_mesas",
      data: estadoGlobal
    }));
  }



    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping(); 
      }
    }, 30000);

    
    ws.on("close", () => {
      console.log("🔴 Cliente desconectado");
      clearInterval(pingInterval);
    });

    
  ws.on("message", (message) => {
    console.log("📨 Mensaje recibido:", message.toString());

    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      console.warn("⚠️ No se pudo parsear el mensaje:", message);
      return;
    }


    if (data.tipo === "sincronizar_mesas") {
      estadoGlobal = data.data;

      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            tipo: "sincronizar_mesas",
            data: estadoGlobal
          }));
        }
      });
    }

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
