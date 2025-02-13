const express = require("express");
const app = express();
const server = require("http").Server(app);
// UUID (Universally Unique Identifier)
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
app.use("/peerjs", peerServer);

app.use(express.static("public"));

// Set EJS as the templating engine
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`); // Passing data to EJS
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
  });
});

server.listen(3030, "0.0.0.0", () => {
  console.log("Server running on port 3030");
});
