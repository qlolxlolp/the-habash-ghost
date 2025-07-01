// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer } from "ws";

// server/storage.ts
import session from "express-session";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
var PostgresSessionStore = connectPg(session);
var inMemoryUsers = [];
var userIdCounter = 1;
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    const Store = MemoryStore(session);
    this.sessionStore = new Store({
      checkPeriod: 864e5
      // prune expired entries every 24h
    });
  }
  async getUser(id) {
    return inMemoryUsers.find((user) => user.id === id);
  }
  async getUserByUsername(username) {
    return inMemoryUsers.find((user) => user.username === username);
  }
  async createUser(insertUser) {
    const user = {
      id: userIdCounter++,
      ...insertUser,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    inMemoryUsers.push(user);
    return user;
  }
  async getDetectedMiners() {
    return [];
  }
  async getMinerById(id) {
    return void 0;
  }
  async createMiner(insertMiner) {
    return insertMiner;
  }
  async updateMiner(id, updates) {
    return void 0;
  }
  async getActiveMiners() {
    return [];
  }
  async getMinersInArea(bounds) {
    return [];
  }
  async getNetworkConnections() {
    return [];
  }
  async createConnection(insertConnection) {
    return insertConnection;
  }
  async getConnectionsByMiner(minerId) {
    return [];
  }
  async getScanSessions() {
    return [];
  }
  async createScanSession(insertSession) {
    return insertSession;
  }
  async updateScanSession(id, updates) {
    return void 0;
  }
  async getActiveScanSessions() {
    return [];
  }
  async getRecentActivities(limit = 50) {
    return [];
  }
  async createActivity(insertActivity) {
    return insertActivity;
  }
  async getRfSignals() {
    return [];
  }
  async createRfSignal(insertSignal) {
    return insertSignal;
  }
  async getRfSignalsByLocation(location) {
    return [];
  }
  async getPlcAnalyses() {
    return [];
  }
  async createPlcAnalysis(insertAnalysis) {
    return insertAnalysis;
  }
  async getAcousticSignatures() {
    return [];
  }
  async createAcousticSignature(insertSignature) {
    return insertSignature;
  }
  async getThermalSignatures() {
    return [];
  }
  async createThermalSignature(insertSignature) {
    return insertSignature;
  }
  async getNetworkTraffic() {
    return [];
  }
  async createNetworkTraffic(insertTraffic) {
    return insertTraffic;
  }
  async getStratumConnections() {
    return [];
  }
  async getStatistics() {
    return {
      totalDevices: 0,
      confirmedMiners: 0,
      suspiciousDevices: 0,
      totalPowerConsumption: 0,
      networkHealth: 0,
      rfSignalsDetected: 0,
      acousticSignatures: 0,
      thermalAnomalies: 0
    };
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "default-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1e3,
      // 24 hours
      secure: false,
      // Set to true in production with HTTPS
      httpOnly: true
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0642\u0628\u0644\u0627\u064B \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A");
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password)
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login")
});
var rfSignals = pgTable("rf_signals", {
  id: serial("id").primaryKey(),
  frequency: real("frequency").notNull(),
  // MHz
  signalStrength: real("signal_strength").notNull(),
  // dBm
  bandwidth: real("bandwidth"),
  // MHz
  modulationType: text("modulation_type"),
  noiseFloor: real("noise_floor"),
  // dBm
  snr: real("snr"),
  // Signal to Noise Ratio
  location: text("location"),
  deviceSignature: text("device_signature"),
  switchingPattern: text("switching_pattern"),
  // Mining-specific switching patterns
  harmonics: jsonb("harmonics"),
  // Array of harmonic frequencies
  detectionTime: timestamp("detection_time").defaultNow().notNull(),
  confidenceLevel: real("confidence_level").notNull()
  // 0-1
});
var plcAnalysis = pgTable("plc_analysis", {
  id: serial("id").primaryKey(),
  powerLineFreq: real("power_line_freq").notNull(),
  // Power line frequency anomalies
  harmonicDistortion: real("harmonic_distortion"),
  powerQuality: real("power_quality"),
  // THD (Total Harmonic Distortion)
  voltageFluctuation: real("voltage_fluctuation"),
  currentSpikes: jsonb("current_spikes"),
  // Array of current spike data
  powerFactor: real("power_factor"),
  location: text("location"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  minerIndicators: jsonb("miner_indicators")
  // Specific mining device indicators
});
var acousticSignatures = pgTable("acoustic_signatures", {
  id: serial("id").primaryKey(),
  fanSpeedRpm: integer("fan_speed_rpm"),
  acousticFingerprint: text("acoustic_fingerprint"),
  // Unique acoustic pattern
  frequencySpectrum: jsonb("frequency_spectrum"),
  // Audio frequency analysis
  noiseLevel: real("noise_level"),
  // dB
  fanNoisePattern: text("fan_noise_pattern"),
  coolingSystemType: text("cooling_system_type"),
  deviceModel: text("device_model"),
  // Detected ASIC/GPU model
  location: text("location"),
  recordingTime: timestamp("recording_time").defaultNow().notNull(),
  matchConfidence: real("match_confidence")
  // 0-1
});
var thermalSignatures = pgTable("thermal_signatures", {
  id: serial("id").primaryKey(),
  surfaceTemp: real("surface_temp"),
  // Celsius
  ambientTemp: real("ambient_temp"),
  // Celsius
  tempDifference: real("temp_difference"),
  heatPattern: text("heat_pattern"),
  // Thermal pattern description
  thermalImage: text("thermal_image"),
  // Base64 encoded thermal image
  hotspotCount: integer("hotspot_count"),
  thermalEfficiency: real("thermal_efficiency"),
  location: text("location"),
  captureTime: timestamp("capture_time").defaultNow().notNull(),
  deviceType: text("device_type")
  // ASIC, GPU, etc.
});
var networkTraffic = pgTable("network_traffic", {
  id: serial("id").primaryKey(),
  srcIp: text("src_ip").notNull(),
  dstIp: text("dst_ip").notNull(),
  srcPort: integer("src_port"),
  dstPort: integer("dst_port"),
  protocol: text("protocol").notNull(),
  packetSize: integer("packet_size"),
  payloadHash: text("payload_hash"),
  // Hash of payload for mining protocol detection
  stratumProtocol: boolean("stratum_protocol").default(false),
  poolAddress: text("pool_address"),
  // Mining pool address if detected
  minerAgent: text("miner_agent"),
  // Mining software user agent
  sessionDuration: integer("session_duration"),
  // seconds
  dataVolume: integer("data_volume"),
  // bytes
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  threatLevel: text("threat_level").default("low")
});
var detectedMiners = pgTable("detected_miners", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  macAddress: text("mac_address"),
  hostname: text("hostname"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  city: text("city"),
  detectionMethod: text("detection_method").notNull(),
  powerConsumption: real("power_consumption"),
  hashRate: text("hash_rate"),
  deviceType: text("device_type"),
  processName: text("process_name"),
  cpuUsage: real("cpu_usage"),
  memoryUsage: real("memory_usage"),
  networkUsage: real("network_usage"),
  gpuUsage: real("gpu_usage"),
  detectionTime: timestamp("detection_time").defaultNow().notNull(),
  confidenceScore: integer("confidence_score").notNull(),
  threatLevel: text("threat_level").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true)
});
var networkConnections = pgTable("network_connections", {
  id: serial("id").primaryKey(),
  localAddress: text("local_address").notNull(),
  localPort: integer("local_port").notNull(),
  remoteAddress: text("remote_address"),
  remotePort: integer("remote_port"),
  protocol: text("protocol").notNull(),
  status: text("status").notNull(),
  processName: text("process_name"),
  detectionTime: timestamp("detection_time").defaultNow().notNull(),
  minerId: integer("miner_id").references(() => detectedMiners.id)
});
var scanSessions = pgTable("scan_sessions", {
  id: serial("id").primaryKey(),
  sessionType: text("session_type").notNull(),
  ipRange: text("ip_range"),
  ports: text("ports"),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  status: text("status").notNull(),
  devicesFound: integer("devices_found").default(0),
  minersDetected: integer("miners_detected").default(0),
  errors: text("errors")
});
var systemActivities = pgTable("system_activities", {
  id: serial("id").primaryKey(),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: text("metadata")
});
var insertMinerSchema = createInsertSchema(detectedMiners).omit({
  id: true,
  detectionTime: true
});
var insertConnectionSchema = createInsertSchema(networkConnections).omit({
  id: true,
  detectionTime: true
});
var insertScanSessionSchema = createInsertSchema(scanSessions).omit({
  id: true,
  startTime: true
});
var insertActivitySchema = createInsertSchema(systemActivities).omit({
  id: true,
  timestamp: true
});
var insertRfSignalSchema = createInsertSchema(rfSignals).omit({
  id: true,
  detectionTime: true
});
var insertPlcAnalysisSchema = createInsertSchema(plcAnalysis).omit({
  id: true,
  timestamp: true
});
var insertAcousticSignatureSchema = createInsertSchema(acousticSignatures).omit({
  id: true,
  recordingTime: true
});
var insertThermalSignatureSchema = createInsertSchema(thermalSignatures).omit({
  id: true,
  captureTime: true
});
var insertNetworkTrafficSchema = createInsertSchema(networkTraffic).omit({
  id: true,
  timestamp: true
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true
});

// server/routes.ts
import { spawn } from "child_process";
import path from "path";
import { scrypt as scrypt2, randomBytes as randomBytes2 } from "crypto";
import { promisify as promisify2 } from "util";
var scryptAsync2 = promisify2(scrypt2);
async function hashPassword2(password) {
  const salt = randomBytes2(16).toString("hex");
  const buf = await scryptAsync2(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function initializeDefaultUser() {
  try {
    const existingUser = await storage.getUserByUsername("qwerty");
    if (!existingUser) {
      await storage.createUser({
        username: "qwerty",
        password: await hashPassword2("azerty"),
        role: "admin"
      });
      console.log("Default admin user created successfully");
    }
  } catch (error) {
    console.error("Error creating default user:", error);
  }
}
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  setupAuth(app2);
  await initializeDefaultUser();
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const wsConnections = /* @__PURE__ */ new Set();
  wss.on("connection", (ws) => {
    wsConnections.add(ws);
    console.log("Client connected to WebSocket");
    ws.on("close", () => {
      wsConnections.delete(ws);
      console.log("Client disconnected from WebSocket");
    });
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      wsConnections.delete(ws);
    });
  });
  function broadcast(data) {
    const message = JSON.stringify(data);
    wsConnections.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }
  app2.get("/api/miners", async (req, res) => {
    try {
      const miners = await storage.getDetectedMiners();
      res.json(miners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch miners" });
    }
  });
  app2.get("/api/miners/ilam", async (req, res) => {
    try {
      const bounds = {
        north: 34.5,
        south: 32,
        east: 48.5,
        west: 45.5
      };
      const miners = await storage.getMinersInArea(bounds);
      res.json(miners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Ilam miners" });
    }
  });
  app2.post("/api/miners", async (req, res) => {
    try {
      const validatedData = insertMinerSchema.parse(req.body);
      const miner = await storage.createMiner(validatedData);
      broadcast({
        type: "miner_detected",
        data: miner
      });
      res.status(201).json(miner);
    } catch (error) {
      res.status(400).json({ error: "Invalid miner data" });
    }
  });
  app2.patch("/api/miners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const miner = await storage.updateMiner(id, updates);
      if (!miner) {
        return res.status(404).json({ error: "Miner not found" });
      }
      broadcast({
        type: "miner_updated",
        data: miner
      });
      res.json(miner);
    } catch (error) {
      res.status(400).json({ error: "Failed to update miner" });
    }
  });
  app2.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });
  app2.post("/api/scan/comprehensive", async (req, res) => {
    try {
      const { ipRange, ports, timeout } = req.body;
      const session3 = await storage.createScanSession({
        sessionType: "comprehensive",
        ipRange: ipRange || "192.168.1.0/24",
        ports: Array.isArray(ports) ? ports.join(",") : ports || "22,80,443,4028,8080,9999",
        status: "running"
      });
      broadcast({
        type: "scan_started",
        data: session3
      });
      const pythonScript = path.join(process.cwd(), "server", "services", "minerDetector.py");
      const pythonProcess = spawn("python3", [pythonScript], {
        stdio: ["pipe", "pipe", "pipe"]
      });
      const scanConfig = {
        ip_range: ipRange || "192.168.1.0/24",
        ports: Array.isArray(ports) ? ports : ports ? ports.split(",").map((p) => parseInt(p.trim())) : [22, 80, 443, 4028, 8080, 9999],
        timeout: timeout || 3
      };
      pythonProcess.stdin.write(JSON.stringify(scanConfig));
      pythonProcess.stdin.end();
      let output = "";
      let errorOutput = "";
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
        const lines = data.toString().split("\n");
        for (const line of lines) {
          if (line.includes("Progress:")) {
            broadcast({
              type: "scan_progress",
              data: { sessionId: session3.id, message: line.trim() }
            });
          }
        }
      });
      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });
      pythonProcess.on("close", async (code) => {
        try {
          if (code === 0 && output) {
            const results = JSON.parse(output);
            for (const device of results.detected_devices || []) {
              if (device.detection_results?.is_miner) {
                const minerData = {
                  ipAddress: device.ip_address,
                  macAddress: device.mac_address || null,
                  hostname: device.hostname || null,
                  latitude: device.geolocation?.["ip-api"]?.lat || device.geolocation?.["ipapi"]?.lat || null,
                  longitude: device.geolocation?.["ip-api"]?.lon || device.geolocation?.["ipapi"]?.lon || null,
                  city: device.geolocation?.["ip-api"]?.city || device.geolocation?.["ipapi"]?.city || null,
                  detectionMethod: device.detection_results.detection_methods.join(","),
                  powerConsumption: device.detection_results.power_consumption || null,
                  hashRate: device.detection_results.hash_rate || null,
                  deviceType: device.detection_results.device_type || "unknown",
                  processName: device.detection_results.mining_software || null,
                  confidenceScore: device.detection_results.confidence_score || 0,
                  threatLevel: device.threat_level || "medium",
                  notes: JSON.stringify(device.detection_results)
                };
                const miner = await storage.createMiner(minerData);
                for (const port of device.open_ports || []) {
                  await storage.createConnection({
                    localAddress: device.ip_address,
                    localPort: port,
                    remoteAddress: null,
                    remotePort: null,
                    protocol: "tcp",
                    status: "open",
                    processName: null,
                    minerId: miner.id
                  });
                }
                broadcast({
                  type: "miner_detected",
                  data: miner
                });
              }
            }
            await storage.updateScanSession(session3.id, {
              status: "completed",
              endTime: /* @__PURE__ */ new Date(),
              devicesFound: results.total_devices || 0,
              minersDetected: results.miners_found || 0
            });
            broadcast({
              type: "scan_completed",
              data: { sessionId: session3.id, results }
            });
            res.json({ sessionId: session3.id, results });
          } else {
            throw new Error(errorOutput || "Python script failed");
          }
        } catch (error) {
          console.error("Scan processing error:", error);
          await storage.updateScanSession(session3.id, {
            status: "failed",
            endTime: /* @__PURE__ */ new Date(),
            errors: error instanceof Error ? error.message : "Unknown error"
          });
          broadcast({
            type: "scan_failed",
            data: { sessionId: session3.id, error: error instanceof Error ? error.message : "Unknown error" }
          });
          res.status(500).json({ error: "Scan failed", details: error instanceof Error ? error.message : "Unknown error" });
        }
      });
    } catch (error) {
      console.error("Scan start error:", error);
      res.status(500).json({ error: "Failed to start comprehensive scan" });
    }
  });
  app2.post("/api/scan/network", async (req, res) => {
    try {
      const { network } = req.body;
      const session3 = await storage.createScanSession({
        sessionType: "network",
        ipRange: network || "192.168.1.0/24",
        status: "running"
      });
      broadcast({
        type: "scan_started",
        data: session3
      });
      const pythonScript = path.join(process.cwd(), "server", "services", "networkScanner.py");
      const pythonProcess = spawn("python3", ["-c", `
import sys
sys.path.append('${path.dirname(pythonScript)}')
from networkScanner import start_network_scan, get_scan_results
import json
import time

config = ${JSON.stringify({ network: network || "192.168.1.0/24" })}
scan_id = start_network_scan(config)
print(f"Started scan: {scan_id}")

# Wait for completion
for i in range(60):  # Wait up to 60 seconds
    time.sleep(1)
    results = get_scan_results(scan_id)
    if results.get('status') in ['completed', 'failed']:
        print(json.dumps(results))
        break
`]);
      let output = "";
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });
      pythonProcess.on("close", async (code) => {
        try {
          const lines = output.trim().split("\n");
          const lastLine = lines[lines.length - 1];
          const results = JSON.parse(lastLine);
          await storage.updateScanSession(session3.id, {
            status: results.status || "completed",
            endTime: /* @__PURE__ */ new Date(),
            devicesFound: results.results?.length || 0
          });
          broadcast({
            type: "network_scan_completed",
            data: { sessionId: session3.id, results }
          });
          res.json({ sessionId: session3.id, results });
        } catch (error) {
          console.error("Network scan error:", error);
          res.status(500).json({ error: "Network scan failed" });
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start network scan" });
    }
  });
  app2.get("/api/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });
  app2.get("/api/scans", async (req, res) => {
    try {
      const sessions = await storage.getScanSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan sessions" });
    }
  });
  app2.post("/api/geolocate", async (req, res) => {
    try {
      const { ipAddress } = req.body;
      if (!ipAddress) {
        return res.status(400).json({ error: "IP address is required" });
      }
      const pythonScript = path.join(process.cwd(), "server", "services", "geolocator.py");
      const pythonProcess = spawn("python3", ["-c", `
import sys
sys.path.append('${path.dirname(pythonScript)}')
from geolocator import geolocate_device
import json

result = geolocate_device('${ipAddress}')
print(json.dumps(result, ensure_ascii=False))
`]);
      let output = "";
      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });
      pythonProcess.on("close", (code) => {
        try {
          const result = JSON.parse(output.trim());
          res.json(result);
        } catch (error) {
          res.status(500).json({ error: "Geolocation failed" });
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to geolocate IP" });
    }
  });
  app2.post("/api/identify-owner", async (req, res) => {
    try {
      const { ipAddress, macAddress } = req.body;
      if (!ipAddress) {
        return res.status(400).json({ error: "IP address is required" });
      }
      const pythonScript = path.join(process.cwd(), "server", "services", "ownerIdentification.py");
      const args = macAddress ? [ipAddress, macAddress] : [ipAddress];
      const pythonProcess = spawn("python3", [pythonScript, ...args]);
      let stdout = "";
      let stderr = "";
      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            res.json(result);
          } catch (parseError) {
            res.status(500).json({
              error: "Failed to parse owner identification result",
              stdout,
              stderr
            });
          }
        } else {
          res.status(500).json({
            error: "Owner identification failed",
            stderr,
            code
          });
        }
      });
      setTimeout(() => {
        pythonProcess.kill();
        res.status(408).json({ error: "Owner identification timeout" });
      }, 3e4);
    } catch (error) {
      res.status(500).json({ error: "Failed to identify owner" });
    }
  });
  app2.post("/api/rf-scan", async (req, res) => {
    try {
      const { location } = req.body;
      const pythonScript = path.join(process.cwd(), "server", "services", "rfAnalyzer.py");
      const pythonProcess = spawn("python3", [pythonScript, "scan", location || "unknown"]);
      let stdout = "";
      let stderr = "";
      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            broadcast({
              type: "rf_scan_completed",
              data: result
            });
            res.json(result);
          } catch (parseError) {
            res.status(500).json({
              error: "Failed to parse RF scan result",
              stdout,
              stderr
            });
          }
        } else {
          res.status(500).json({
            error: "RF scan failed",
            stderr,
            code
          });
        }
      });
      setTimeout(() => {
        pythonProcess.kill();
        res.status(408).json({ error: "RF scan timeout" });
      }, 6e4);
    } catch (error) {
      res.status(500).json({ error: "Failed to start RF scan" });
    }
  });
  app2.get("/api/rf-status", async (req, res) => {
    try {
      const pythonScript = path.join(process.cwd(), "server", "services", "rfAnalyzer.py");
      const pythonProcess = spawn("python3", [pythonScript, "status"]);
      let stdout = "";
      let stderr = "";
      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            res.json(result);
          } catch (parseError) {
            res.status(500).json({
              error: "Failed to parse RF status result"
            });
          }
        } else {
          res.status(500).json({
            error: "Failed to get RF status"
          });
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check RF status" });
    }
  });
  app2.get("/api/rf-detections", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const pythonScript = path.join(process.cwd(), "server", "services", "rfAnalyzer.py");
      const pythonProcess = spawn("python3", [pythonScript, "recent", hours.toString()]);
      let stdout = "";
      let stderr = "";
      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            res.json(result);
          } catch (parseError) {
            res.status(500).json({
              error: "Failed to parse RF detections result"
            });
          }
        } else {
          res.status(500).json({
            error: "Failed to get RF detections"
          });
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RF detections" });
    }
  });
  app2.get("/api/export", async (req, res) => {
    try {
      const format = req.query.format || "json";
      const data = {
        miners: await storage.getDetectedMiners(),
        activities: await storage.getRecentActivities(),
        scans: await storage.getScanSessions(),
        statistics: await storage.getStatistics(),
        export_time: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="ilam_miners_export_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`);
        res.json(data);
      } else {
        res.status(400).json({ error: "Unsupported format" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
