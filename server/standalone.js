const express = require("express");
const session = require("express-session");
const passport = require("passport");
const { Strategy: LocalStrategy } = require("passport-local");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const path = require("path");
const { scrypt, randomBytes, timingSafeEqual } = require("crypto");
const { promisify } = require("util");
const MemoryStore = require("memorystore")(session);

const scryptAsync = promisify(scrypt);

// شبح حبشی - Standalone Server
// Copyright © Erfan Rajabee - بهار 1404 - ایران، ایلام

console.log("🚀 راه‌اندازی شبح حبشی...");
console.log("© Erfan Rajabee - بهار 1404 - ایران، ایلام");

// In-memory storage
const users = [];
let userIdCounter = 1;

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

async function createUser(userData) {
  const user = {
    id: userIdCounter++,
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  users.push(user);
  return user;
}

function getUserByUsername(username) {
  return users.find((user) => user.username === username);
}

function getUserById(id) {
  return users.find((user) => user.id === id);
}

// Initialize default admin user
async function initializeDefaultUser() {
  try {
    const existingUser = getUserByUsername("qwerty");
    if (!existingUser) {
      await createUser({
        username: "qwerty",
        password: await hashPassword("azerty"),
        role: "admin",
      });
      console.log("Default admin user created successfully");
    }
  } catch (error) {
    console.error("Error creating default user:", error);
  }
}

const app = express();
const httpServer = createServer(app);

// Session configuration
const sessionSettings = {
  secret: "erfan_rajabee_shabah_habashi_secret_key_2024",
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000, // 24h
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: false,
    httpOnly: true,
  },
};

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session(sessionSettings));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    } catch (error) {
      return done(error);
    }
  }),
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Routes
app.post("/api/login", passport.authenticate("local"), (req, res) => {
  res.status(200).json(req.user);
});

app.post("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get("/api/user", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  res.json(req.user);
});

// API endpoints
app.get("/api/miners", (req, res) => {
  res.json([]);
});

app.get("/api/statistics", (req, res) => {
  res.json({
    totalDevices: 0,
    confirmedMiners: 0,
    suspiciousDevices: 0,
    totalPowerConsumption: 0,
    networkHealth: 100,
    rfSignalsDetected: 0,
    acousticSignatures: 0,
    thermalAnomalies: 0,
  });
});

app.get("/api/activities", (req, res) => {
  res.json([]);
});

app.get("/api/scans", (req, res) => {
  res.json([]);
});

// Serve static files - در exe حالت path متفاوت است
const publicPath = process.pkg
  ? path.join(path.dirname(process.execPath), "public")
  : path.join(__dirname, "..", "dist", "public");

app.use(express.static(publicPath));

// Catch-all handler for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// WebSocket server
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
const wsConnections = new Set();

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

// Start server
async function startServer() {
  await initializeDefaultUser();

  const port = process.env.PORT || 5000;
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`✅ شبح حبشی در حال اجرا روی پورت ${port}`);
    console.log(`🌐 دسترسی: http://localhost:${port}`);
    console.log("👤 نام کاربری: qwerty | رمز عبور: azerty");
  });
}

startServer().catch(console.error);
