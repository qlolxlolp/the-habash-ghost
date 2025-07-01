import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertMinerSchema, 
  insertConnectionSchema, 
  insertScanSessionSchema, 
  insertActivitySchema,
  insertRfSignalSchema,
  insertNetworkTrafficSchema
} from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function initializeDefaultUser() {
  try {
    const existingUser = await storage.getUserByUsername("qwerty");
    if (!existingUser) {
      await storage.createUser({
        username: "qwerty",
        password: await hashPassword("azerty"),
        role: "admin"
      });
      console.log("Default admin user created successfully");
    }
  } catch (error) {
    console.error("Error creating default user:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup authentication routes
  setupAuth(app);

  // Initialize default admin user
  await initializeDefaultUser();

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active WebSocket connections
  const wsConnections = new Set<any>();

  wss.on('connection', (ws) => {
    wsConnections.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      wsConnections.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsConnections.delete(ws);
    });
  });

  // Broadcast to all connected clients
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    wsConnections.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }

  // Get all detected miners
  app.get("/api/miners", async (req, res) => {
    try {
      const miners = await storage.getDetectedMiners();
      res.json(miners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch miners" });
    }
  });

  // Get miners in Ilam province area
  app.get("/api/miners/ilam", async (req, res) => {
    try {
      const bounds = {
        north: 34.5,
        south: 32.0,
        east: 48.5,
        west: 45.5
      };
      const miners = await storage.getMinersInArea(bounds);
      res.json(miners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Ilam miners" });
    }
  });

  // Create new miner detection entry
  app.post("/api/miners", async (req, res) => {
    try {
      const validatedData = insertMinerSchema.parse(req.body);
      const miner = await storage.createMiner(validatedData);
      
      // Broadcast new miner detection to all clients
      broadcast({
        type: 'miner_detected',
        data: miner
      });
      
      res.status(201).json(miner);
    } catch (error) {
      res.status(400).json({ error: "Invalid miner data" });
    }
  });

  // Update miner information
  app.patch("/api/miners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const miner = await storage.updateMiner(id, updates);
      
      if (!miner) {
        return res.status(404).json({ error: "Miner not found" });
      }
      
      broadcast({
        type: 'miner_updated',
        data: miner
      });
      
      res.json(miner);
    } catch (error) {
      res.status(400).json({ error: "Failed to update miner" });
    }
  });

  // Get system statistics
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Start comprehensive scan
  app.post("/api/scan/comprehensive", async (req, res) => {
    try {
      const { ipRange, ports, timeout } = req.body;
      
      // Create scan session
      const session = await storage.createScanSession({
        sessionType: 'comprehensive',
        ipRange: ipRange || '192.168.1.0/24',
        ports: Array.isArray(ports) ? ports.join(',') : ports || '22,80,443,4028,8080,9999',
        status: 'running'
      });

      // Broadcast scan start
      broadcast({
        type: 'scan_started',
        data: session
      });

      // Run Python miner detection script
      const pythonScript = path.join(process.cwd(), 'server', 'services', 'minerDetector.py');
      const pythonProcess = spawn('python3', [pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Send scan configuration to Python script
      const scanConfig = {
        ip_range: ipRange || '192.168.1.0/24',
        ports: Array.isArray(ports) ? ports : (ports ? ports.split(',').map((p: string) => parseInt(p.trim())) : [22, 80, 443, 4028, 8080, 9999]),
        timeout: timeout || 3
      };

      pythonProcess.stdin.write(JSON.stringify(scanConfig));
      pythonProcess.stdin.end();

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
        
        // Try to parse progress updates
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.includes('Progress:')) {
            broadcast({
              type: 'scan_progress',
              data: { sessionId: session.id, message: line.trim() }
            });
          }
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        try {
          if (code === 0 && output) {
            const results = JSON.parse(output);
            
            // Process detected devices
            for (const device of results.detected_devices || []) {
              if (device.detection_results?.is_miner) {
                // Store confirmed miner
                const minerData = {
                  ipAddress: device.ip_address,
                  macAddress: device.mac_address || null,
                  hostname: device.hostname || null,
                  latitude: device.geolocation?.['ip-api']?.lat || device.geolocation?.['ipapi']?.lat || null,
                  longitude: device.geolocation?.['ip-api']?.lon || device.geolocation?.['ipapi']?.lon || null,
                  city: device.geolocation?.['ip-api']?.city || device.geolocation?.['ipapi']?.city || null,
                  detectionMethod: device.detection_results.detection_methods.join(','),
                  powerConsumption: device.detection_results.power_consumption || null,
                  hashRate: device.detection_results.hash_rate || null,
                  deviceType: device.detection_results.device_type || 'unknown',
                  processName: device.detection_results.mining_software || null,
                  confidenceScore: device.detection_results.confidence_score || 0,
                  threatLevel: device.threat_level || 'medium',
                  notes: JSON.stringify(device.detection_results)
                };

                const miner = await storage.createMiner(minerData);

                // Store network connections
                for (const port of device.open_ports || []) {
                  await storage.createConnection({
                    localAddress: device.ip_address,
                    localPort: port,
                    remoteAddress: null,
                    remotePort: null,
                    protocol: 'tcp',
                    status: 'open',
                    processName: null,
                    minerId: miner.id
                  });
                }

                broadcast({
                  type: 'miner_detected',
                  data: miner
                });
              }
            }

            // Update scan session
            await storage.updateScanSession(session.id, {
              status: 'completed',
              endTime: new Date(),
              devicesFound: results.total_devices || 0,
              minersDetected: results.miners_found || 0
            });

            broadcast({
              type: 'scan_completed',
              data: { sessionId: session.id, results }
            });

            res.json({ sessionId: session.id, results });
          } else {
            throw new Error(errorOutput || 'Python script failed');
          }
        } catch (error) {
          console.error('Scan processing error:', error);
          
          await storage.updateScanSession(session.id, {
            status: 'failed',
            endTime: new Date(),
            errors: error instanceof Error ? error.message : 'Unknown error'
          });

          broadcast({
            type: 'scan_failed',
            data: { sessionId: session.id, error: error instanceof Error ? error.message : 'Unknown error' }
          });

          res.status(500).json({ error: 'Scan failed', details: error instanceof Error ? error.message : 'Unknown error' });
        }
      });

    } catch (error) {
      console.error('Scan start error:', error);
      res.status(500).json({ error: "Failed to start comprehensive scan" });
    }
  });

  // Start network scan
  app.post("/api/scan/network", async (req, res) => {
    try {
      const { network } = req.body;
      
      const session = await storage.createScanSession({
        sessionType: 'network',
        ipRange: network || '192.168.1.0/24',
        status: 'running'
      });

      broadcast({
        type: 'scan_started',
        data: session
      });

      // Run network scanner
      const pythonScript = path.join(process.cwd(), 'server', 'services', 'networkScanner.py');
      const pythonProcess = spawn('python3', ['-c', `
import sys
sys.path.append('${path.dirname(pythonScript)}')
from networkScanner import start_network_scan, get_scan_results
import json
import time

config = ${JSON.stringify({ network: network || '192.168.1.0/24' })}
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

      let output = '';
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        try {
          const lines = output.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const results = JSON.parse(lastLine);

          await storage.updateScanSession(session.id, {
            status: results.status || 'completed',
            endTime: new Date(),
            devicesFound: results.results?.length || 0
          });

          broadcast({
            type: 'network_scan_completed',
            data: { sessionId: session.id, results }
          });

          res.json({ sessionId: session.id, results });
        } catch (error) {
          console.error('Network scan error:', error);
          res.status(500).json({ error: 'Network scan failed' });
        }
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to start network scan" });
    }
  });

  // Get recent activities
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Get scan sessions
  app.get("/api/scans", async (req, res) => {
    try {
      const sessions = await storage.getScanSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan sessions" });
    }
  });

  // Geolocate specific IP
  app.post("/api/geolocate", async (req, res) => {
    try {
      const { ipAddress } = req.body;
      
      if (!ipAddress) {
        return res.status(400).json({ error: "IP address is required" });
      }

      const pythonScript = path.join(process.cwd(), 'server', 'services', 'geolocator.py');
      const pythonProcess = spawn('python3', ['-c', `
import sys
sys.path.append('${path.dirname(pythonScript)}')
from geolocator import geolocate_device
import json

result = geolocate_device('${ipAddress}')
print(json.dumps(result, ensure_ascii=False))
`]);

      let output = '';
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.on('close', (code) => {
        try {
          const result = JSON.parse(output.trim());
          res.json(result);
        } catch (error) {
          res.status(500).json({ error: 'Geolocation failed' });
        }
      });

    } catch (error) {
      res.status(500).json({ error: "Failed to geolocate IP" });
    }
  });

  // Owner identification endpoint
  app.post("/api/identify-owner", async (req, res) => {
    try {
      const { ipAddress, macAddress } = req.body;
      
      if (!ipAddress) {
        return res.status(400).json({ error: "IP address is required" });
      }

      // Call Python owner identification service
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
              stdout: stdout,
              stderr: stderr
            });
          }
        } else {
          res.status(500).json({ 
            error: "Owner identification failed",
            stderr: stderr,
            code: code
          });
        }
      });
      
      // Set timeout for the process
      setTimeout(() => {
        pythonProcess.kill();
        res.status(408).json({ error: "Owner identification timeout" });
      }, 30000); // 30 second timeout
      
    } catch (error) {
      res.status(500).json({ error: "Failed to identify owner" });
    }
  });

  // RF analysis endpoint
  app.post("/api/rf-scan", async (req, res) => {
    try {
      const { location } = req.body;
      
      // Call Python RF analyzer service
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
            
            // Broadcast RF scan results
            broadcast({
              type: 'rf_scan_completed',
              data: result
            });
            
            res.json(result);
          } catch (parseError) {
            res.status(500).json({ 
              error: "Failed to parse RF scan result",
              stdout: stdout,
              stderr: stderr
            });
          }
        } else {
          res.status(500).json({ 
            error: "RF scan failed",
            stderr: stderr,
            code: code
          });
        }
      });
      
      // Set timeout for the process
      setTimeout(() => {
        pythonProcess.kill();
        res.status(408).json({ error: "RF scan timeout" });
      }, 60000); // 60 second timeout
      
    } catch (error) {
      res.status(500).json({ error: "Failed to start RF scan" });
    }
  });

  // Get RF scan status
  app.get("/api/rf-status", async (req, res) => {
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

  // Get recent RF detections
  app.get("/api/rf-detections", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
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

  // Export data
  app.get("/api/export", async (req, res) => {
    try {
      const format = req.query.format as string || 'json';
      
      const data = {
        miners: await storage.getDetectedMiners(),
        activities: await storage.getRecentActivities(),
        scans: await storage.getScanSessions(),
        statistics: await storage.getStatistics(),
        export_time: new Date().toISOString()
      };

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="ilam_miners_export_${new Date().toISOString().split('T')[0]}.json"`);
        res.json(data);
      } else {
        res.status(400).json({ error: 'Unsupported format' });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  return httpServer;
}
