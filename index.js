import express from "express";
import dotenv from "dotenv/config";
import mongoDBConnect from "./mongoDB/connection.js";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import userRoutes from "./routes/user.js";
import chatRoutes from "./routes/chat.js";
import messageRoutes from "./routes/message.js";
import { Server } from "socket.io"; // Use destructuring to import Server from socket.io

const app = express();

// Define the CORS options and middleware
const whiteList = [];

const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  if (whiteList.indexOf(req.headers.origin) !== -1) {
    corsOptions = { origin: true };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

const corsAll = cors();
const corsWithOptions = cors(corsOptionsDelegate);

// Define CORS configuration
const corsConfig = {
  origin: "https://chat-pulse-client.vercel.app/",
  credentials: true,
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use CORS middleware
app.use(corsAll); // for routes that don't require custom CORS options

// Apply corsWithOptions middleware for specific routes
app.use("/api/chat", corsWithOptions);
app.use("/api/message", corsWithOptions);

// Add your other routes
app.use("/", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

mongoose.set("strictQuery", false);
mongoDBConnect();

const server = app.listen(5000, () => {
  console.log(`Server Listening at PORT - ${process.env.PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  // Apply the CORS options delegate to Socket.io connections
  corsOptionsDelegate(socket.request, (err, corsOptions) => {
    if (err) {
      return next(err);
    }
    socket.request.corsOptions = corsOptions;
    next();
  });
});

io.on("connection", (socket) => {
  socket.on("setup", (userData) => {
    socket.join(userData.id);
    socket.emit("connected");
  });

  socket.on("join room", (room) => {
    socket.join(room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieve) => {
    var chat = newMessageRecieve.chatId;
    if (!chat.users) console.log("chats.users is not defined");
    chat.users.forEach((user) => {
      if (user._id == newMessageRecieve.sender._id) return;
      socket.in(user._id).emit("message recieved", newMessageRecieve);
    });
  });
});
