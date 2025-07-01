import { pgTable, text, serial, integer, boolean, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login")
});

// RF Signal Analysis for real radio frequency detection
export const rfSignals = pgTable("rf_signals", {
  id: serial("id").primaryKey(),
  frequency: real("frequency").notNull(), // MHz
  signalStrength: real("signal_strength").notNull(), // dBm
  bandwidth: real("bandwidth"), // MHz
  modulationType: text("modulation_type"),
  noiseFloor: real("noise_floor"), // dBm
  snr: real("snr"), // Signal to Noise Ratio
  location: text("location"),
  deviceSignature: text("device_signature"),
  switchingPattern: text("switching_pattern"), // Mining-specific switching patterns
  harmonics: jsonb("harmonics"), // Array of harmonic frequencies
  detectionTime: timestamp("detection_time").defaultNow().notNull(),
  confidenceLevel: real("confidence_level").notNull() // 0-1
});

// Power Line Communication (PLC) Analysis
export const plcAnalysis = pgTable("plc_analysis", {
  id: serial("id").primaryKey(),
  powerLineFreq: real("power_line_freq").notNull(), // Power line frequency anomalies
  harmonicDistortion: real("harmonic_distortion"),
  powerQuality: real("power_quality"), // THD (Total Harmonic Distortion)
  voltageFluctuation: real("voltage_fluctuation"),
  currentSpikes: jsonb("current_spikes"), // Array of current spike data
  powerFactor: real("power_factor"),
  location: text("location"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  minerIndicators: jsonb("miner_indicators") // Specific mining device indicators
});

// Acoustic Signature Analysis
export const acousticSignatures = pgTable("acoustic_signatures", {
  id: serial("id").primaryKey(),
  fanSpeedRpm: integer("fan_speed_rpm"),
  acousticFingerprint: text("acoustic_fingerprint"), // Unique acoustic pattern
  frequencySpectrum: jsonb("frequency_spectrum"), // Audio frequency analysis
  noiseLevel: real("noise_level"), // dB
  fanNoisePattern: text("fan_noise_pattern"),
  coolingSystemType: text("cooling_system_type"),
  deviceModel: text("device_model"), // Detected ASIC/GPU model
  location: text("location"),
  recordingTime: timestamp("recording_time").defaultNow().notNull(),
  matchConfidence: real("match_confidence") // 0-1
});

// Thermal Signature Detection
export const thermalSignatures = pgTable("thermal_signatures", {
  id: serial("id").primaryKey(),
  surfaceTemp: real("surface_temp"), // Celsius
  ambientTemp: real("ambient_temp"), // Celsius
  tempDifference: real("temp_difference"),
  heatPattern: text("heat_pattern"), // Thermal pattern description
  thermalImage: text("thermal_image"), // Base64 encoded thermal image
  hotspotCount: integer("hotspot_count"),
  thermalEfficiency: real("thermal_efficiency"),
  location: text("location"),
  captureTime: timestamp("capture_time").defaultNow().notNull(),
  deviceType: text("device_type") // ASIC, GPU, etc.
});

// Network Traffic Analysis (Deep Packet Inspection)
export const networkTraffic = pgTable("network_traffic", {
  id: serial("id").primaryKey(),
  srcIp: text("src_ip").notNull(),
  dstIp: text("dst_ip").notNull(),
  srcPort: integer("src_port"),
  dstPort: integer("dst_port"),
  protocol: text("protocol").notNull(),
  packetSize: integer("packet_size"),
  payloadHash: text("payload_hash"), // Hash of payload for mining protocol detection
  stratumProtocol: boolean("stratum_protocol").default(false),
  poolAddress: text("pool_address"), // Mining pool address if detected
  minerAgent: text("miner_agent"), // Mining software user agent
  sessionDuration: integer("session_duration"), // seconds
  dataVolume: integer("data_volume"), // bytes
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  threatLevel: text("threat_level").default("low")
});

export const detectedMiners = pgTable("detected_miners", {
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

export const networkConnections = pgTable("network_connections", {
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

export const scanSessions = pgTable("scan_sessions", {
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

export const systemActivities = pgTable("system_activities", {
  id: serial("id").primaryKey(),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: text("metadata")
});

// Insert schemas
export const insertMinerSchema = createInsertSchema(detectedMiners).omit({
  id: true,
  detectionTime: true
});

export const insertConnectionSchema = createInsertSchema(networkConnections).omit({
  id: true,
  detectionTime: true
});

export const insertScanSessionSchema = createInsertSchema(scanSessions).omit({
  id: true,
  startTime: true
});

export const insertActivitySchema = createInsertSchema(systemActivities).omit({
  id: true,
  timestamp: true
});

// Types
export type DetectedMiner = typeof detectedMiners.$inferSelect;
export type InsertMiner = z.infer<typeof insertMinerSchema>;
export type NetworkConnection = typeof networkConnections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type ScanSession = typeof scanSessions.$inferSelect;
export type InsertScanSession = z.infer<typeof insertScanSessionSchema>;
export type SystemActivity = typeof systemActivities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Additional schemas for new tables
export const insertRfSignalSchema = createInsertSchema(rfSignals).omit({
  id: true,
  detectionTime: true
});

export const insertPlcAnalysisSchema = createInsertSchema(plcAnalysis).omit({
  id: true,
  timestamp: true
});

export const insertAcousticSignatureSchema = createInsertSchema(acousticSignatures).omit({
  id: true,
  recordingTime: true
});

export const insertThermalSignatureSchema = createInsertSchema(thermalSignatures).omit({
  id: true,
  captureTime: true
});

export const insertNetworkTrafficSchema = createInsertSchema(networkTraffic).omit({
  id: true,
  timestamp: true
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true
});

// Additional types
export type RfSignal = typeof rfSignals.$inferSelect;
export type InsertRfSignal = z.infer<typeof insertRfSignalSchema>;
export type PlcAnalysis = typeof plcAnalysis.$inferSelect;
export type InsertPlcAnalysis = z.infer<typeof insertPlcAnalysisSchema>;
export type AcousticSignature = typeof acousticSignatures.$inferSelect;
export type InsertAcousticSignature = z.infer<typeof insertAcousticSignatureSchema>;
export type ThermalSignature = typeof thermalSignatures.$inferSelect;
export type InsertThermalSignature = z.infer<typeof insertThermalSignatureSchema>;
export type NetworkTraffic = typeof networkTraffic.$inferSelect;
export type InsertNetworkTraffic = z.infer<typeof insertNetworkTrafficSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
