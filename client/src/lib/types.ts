// Re-export types from mapUtils for easier importing
export type { IranProvince, DetectedDevice, DetectedMiner } from "./mapUtils";

// Additional types for the application
export interface User {
  id: string;
  username: string;
  role: "admin" | "operator" | "viewer";
  lastLogin: string;
}

export interface ScanSession {
  id: string;
  startTime: string;
  endTime?: string;
  status: "running" | "completed" | "failed";
  devicesFound: number;
  ipRanges: string[];
}

export interface NetworkConnection {
  id: string;
  sourceIp: string;
  destinationIp: string;
  port: number;
  protocol: "TCP" | "UDP";
  bytes: number;
  packets: number;
  timestamp: string;
}

export interface SystemActivity {
  id: string;
  timestamp: string;
  type:
    | "scan_started"
    | "device_detected"
    | "threat_identified"
    | "system_alert";
  description: string;
  severity: "info" | "warning" | "error" | "critical";
  details?: Record<string, any>;
}
