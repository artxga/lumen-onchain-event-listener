import { ethers, Log } from "ethers";
import { config } from "./config/env.config";
import { getEventKey } from "./utils/helpers";
import { publishEvent } from "./rabbit/rabbit.service";
import { EventRoutingKeys } from "./utils/enum";
import { CONTRACTS_TO_LISTEN, ContractConfig } from "./config/contracts.config"; // ⬅️ Nuevo

let provider: ethers.WebSocketProvider;

// Función para procesar un solo contrato
function startContractListener(contractConfig: ContractConfig) {
  let contract: ethers.Contract;

  // Lógica para manejar la conexión y reconexión de UN contrato
  function connectAndSubscribe() {
    console.log(`🔄 Subscribing to Contract: ${contractConfig.address}`);

    // La validación del provider (ws.on('close')) debería estar fuera de este loop,
    // ya que solo necesitamos un provider WebSocket global.
    // Aquí asumimos que el provider ya está inicializado y es estable.

    try {
      // Inicializar el contrato específico
      contract = new ethers.Contract(
        contractConfig.address,
        contractConfig.abi,
        provider
      );

      // Función genérica de manejo de eventos
      async function handleEvent(
        eventName: keyof typeof EventRoutingKeys,
        argNames: string[],
        args: any[],
        event: any // Evento completo de ethers
      ) {
        try {
          // Mapear argumentos a un objeto usando los nombres definidos
          const dataObj = argNames.reduce((acc, name, index) => {
            acc[name] = args[index];
            return acc;
          }, {} as Record<string, any>);

          const { blockNumber, transactionHash, index, removed }: Log =
            event.log;
          const block = await provider.getBlock(blockNumber);
          const blockTime = block?.timestamp
            ? new Date(block.timestamp * 1000).toISOString()
            : null;

          // Serializar BigInts/BigNumbers a strings para RabbitMQ
          const serializableData = Object.fromEntries(
            Object.entries(dataObj).map(([k, v]) => [
              k,
              v?.toString ? v.toString() : v,
            ])
          );

          const payload = {
            contract_address: contractConfig.address,
            reference_id: Number(serializableData.referenceId) || null,
            key: getEventKey(event.log, eventName),
            event_name: eventName,
            transaction_hash: transactionHash,
            block_number: blockNumber,
            block_time: blockTime,
            event_index: index,
            removed,
            data: JSON.stringify(serializableData),
          };

          console.log(`${eventName} [${contractConfig.address}]:`, payload);
          // Usamos eventName para el routing key si está en EventRoutingKeys
          const exchangeName = contractConfig.exchangeName;
          const routingKey: EventRoutingKeys = EventRoutingKeys[eventName];
          publishEvent(exchangeName, routingKey, payload);
        } catch (error) {
          console.error(
            `Error processing ${eventName} on ${contractConfig.address}:`,
            error
          );
        }
      }

      // Suscribir a TODOS los eventos definidos en la configuración
      contractConfig.events.forEach(({ eventName, argNames }) => {
        // ethers.js pasa los argumentos de la función de evento primero,
        // y el objeto 'event' (Log) al final.
        contract.on(eventName, (...args) => {
          const event = args[args.length - 1]; // El último argumento es el objeto Log
          const dataArgs = args.slice(0, -1); // Los argumentos de datos son los anteriores

          handleEvent(eventName, argNames, dataArgs, event);
        });
        console.log(`  -> Subscribed to ${eventName}`);
      });

      console.log(`👂 Listening events on ${contractConfig.address}...`);
    } catch (error) {
      console.error(
        `❌ Error initializing contract ${contractConfig.address}:`,
        error
      );
      // Reintentar la conexión del contrato si falla la inicialización
      setTimeout(connectAndSubscribe, 5000);
    }
  }

  // Iniciar la suscripción del contrato
  connectAndSubscribe();
}

// Función principal que inicializa el Provider y lanza los listeners
export function listener() {
  console.log("🔄 Starting Master Listener...");

  // 1. Inicializar el Provider Global (WebSocket)
  provider = new ethers.WebSocketProvider(config.polygonWs, config.network);
  const network = provider.getNetwork();

  if (!network) {
    console.error("❌ ERROR: provider.getNetwork no existe");
    return;
  }

  console.log("🌐 Connected to network:", network);

  // 2. Configurar Reconexión del WebSocket
  const ws = (provider as any).websocket;

  if (!ws) {
    console.error("❌ ERROR: provider.websocket no existe");
    return;
  }

  ws.on("close", (code: number) => {
    console.error("❌ WebSocket closed:", code);
    console.log("Attempting Master Reconnect in 5s...");
    // Idealmente, se debería reinitializar el provider y todas las suscripciones
    setTimeout(listener, 5000);
    // ⚠️ Nota: En una app de producción, se recomienda usar una librería de reconexión más robusta
  });

  ws.on("error", (err: any) => {
    console.error("❌ WebSocket error:", err);
  });

  provider.on("error", (err) => {
    console.error("❌ Provider error:", err);
  });

  // 3. Lanzar un Listener para cada Contrato en la configuración
  CONTRACTS_TO_LISTEN.forEach((contractConfig) => {
    startContractListener(contractConfig);
  });
}

listener();
