// import
import express from "express";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import category from "./router/category.mjs";
import role from "./router/role.mjs";
import operator from "./router/operator.mjs";
import citizen from "./router/citizen.mjs";
import report from "./router/report.mjs";
import company from "./router/company.mjs";
import notification from "./router/notification.mjs";
import chat from "./router/chat.mjs";
import { getUser } from "./dao.mjs";
import { setIO } from "./socket.mjs";
import cors from "cors";

import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";
import dotenv from "dotenv";
dotenv.config();

// Supabase client
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

import helmet from "helmet";

// Init Express
const app = express();
app.use(helmet());

const port = 3001;

// Middleware
app.use(express.json());
app.use(morgan("dev"));

const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessState: 200,
  credentials: true,
};

app.use(cors(corsOptions));

passport.use(
  new LocalStrategy(async function verify(username, password, cb) {
    const user = await getUser(username, password);
    if (!user) return cb(null, false, "Incorrect username or password.");

    return cb(null, user);
  })
);

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

app.use(
  session({
    secret: "shhhhh... it's a secret!",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.authenticate("session"));

/* ROUTES */
app.use("/api", category);
app.use("/api", citizen);
app.use("/api", company);
app.use("/api", operator);
app.use("/api", report);
app.use("/api", role);
app.use("/api", notification);
app.use("/api", chat);

// POST /api/upload-url -> get signed URL for image upload
app.post("/api/upload-url", async (req, res) => {
  const { filename } = req.body;
  const cleanName = filename.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
  const uniqueName = `${Date.now()}-${cleanName}`;

  try {
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .createSignedUploadUrl(uniqueName);

    if (error) throw error;

    const publicUrl =
      process.env.SUPABASE_URL +
      "/storage/v1/object/public/" +
      process.env.SUPABASE_BUCKET +
      "/" +
      uniqueName;

    return res.json({
      signedUrl: data.signedUrl,
      path: uniqueName,
      publicUrl: publicUrl,
    });
  } catch (err) {
    return res.status(500).json({ error: "Could not create signed URL" });
  }
});

/* SESSION ROUTES */
// POST /api/sessions
app.post("/api/sessions", passport.authenticate("local"), function (req, res) {
  const user = req.user;

  // Regenerate session to prevent session fixation attacks
  req.session.regenerate(function (err) {
    if (err) {
      return res.status(500).json({ error: "Session regeneration failed" });
    }

    // Re-login user to the new session
    req.login(user, function (err) {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      return res.status(201).json(user);
    });
  });
});

// GET /api/sessions/current
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json(req.user);
  } else res.status(401).json({ error: "Not authenticated" });
});

// DELETE /api/session/current
app.delete("/api/sessions/current", (req, res) => {
  req.logout(() => {
    return res.end();
  });
});

// Create HTTP server and Socket.IO
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Set io instance for use in other modules
setIO(io);

// Store active user connections: Map<userKey, Set<socketId>>
const userSockets = new Map();

// Socket.IO authentication middleware
io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  const userType = socket.handshake.auth.userType;

  if (!userId || !userType) {
    return next(new Error("Authentication required"));
  }

  socket.userId = userId;
  socket.userType = userType;
  next();
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  const userKey = `${socket.userType}:${socket.userId}`;
  console.log(`Socket connected: ${userKey}`);

  // Add socket to user's connection set
  if (!userSockets.has(userKey)) {
    userSockets.set(userKey, new Set());
  }
  userSockets.get(userKey).add(socket.id);

  // Join user-specific room for notifications
  if (socket.userType === "citizen") {
    socket.join(`citizen:${socket.userId}`);
  } else if (socket.userType === "operator") {
    socket.join(`operator:${socket.userId}`);
  }

  // Join a report room for chat
  socket.on("join_report", (reportId) => {
    socket.join(`report:${reportId}`);
    console.log(`${userKey} joined report:${reportId}`);
  });

  // Leave a report room
  socket.on("leave_report", (reportId) => {
    socket.leave(`report:${reportId}`);
    console.log(`${userKey} left report:${reportId}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${userKey}`);
    const sockets = userSockets.get(userKey);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSockets.delete(userKey);
      }
    }
  });
});

// Start HTTP server
httpServer.listen(port, () => {
  console.log(`API server started at http://localhost:${port}`);
});
