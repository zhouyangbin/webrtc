//https类
var https = require("https");
//文件操作类
var fs = require("fs");
var path = require("path"); /* 重要：目录设置时，可使用其方法引用根目录， 不可少 */
//读取密钥和签名证书
var options = {
  key: fs.readFileSync("keys/server.key"),
  cert: fs.readFileSync("keys/server.crt"),
};
//socket.io类
var socketIO = require("socket.io");
//构建http服务器
var apps = https.createServer(options);
//监听端口
var SSL_PORT = 8443;
apps.listen(SSL_PORT);
//构建Sock.io服务器
var io = socketIO.listen(apps);
//Socket连接监听
io.sockets.on("connection", function (socket) {
  //socket关闭
  socket.on("disconnect", function (reason) {
    var socketId = socket.id;
    console.log("disconnect: " + socketId + " reason:" + reason);
    var message = {};
    message.from = socketId;
    message.room = "";
    socket.broadcast.emit("exit", message);
  });
  /** client->server 信令集*/
  //【createAndJoinRoom】  创建并加入Room中 [room]
  socket.on("createAndJoinRoom", function (message) {
    var room = message.room;
    console.log("Received createAndJoinRoom：" + room);
    //判断room是否存在
    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    console.log("Room " + room + " now has " + numClients + " client(s)");
    if (clientsInRoom) {
      console.log(Object.keys(clientsInRoom.sockets));
    }
    if (numClients === 0) {
      //加入并创建房间
      socket.join(room);
      console.log("Client ID " + socket.id + " created room " + room);
      //发送【created】消息至客户端 [id,room,peers]
      var data = {};
      //socket id
      data.id = socket.id;
      //room id
      data.room = room;
      //其他连接 为空
      data.peers = [];
      //发送
      socket.emit("created", data);
    } else {
      /** room 存在 */
      //发送【joined】消息至该room其他客户端 [id,room]
      var data = {};
      //socket id
      data.id = socket.id;
      //room id
      data.room = room;
      //发送房间内其他客户端
      io.sockets.in(room).emit("joined", data);
      //发送【created】消息至客户端 [id,room,peers]
      var data = {};
      //socket id
      data.id = socket.id;
      //room id
      data.room = room;
      //其他连接
      var peers = new Array();
      var otherSocketIds = Object.keys(clientsInRoom.sockets);
      for (var i = 0; i < otherSocketIds.length; i++) {
        var peer = {};
        peer.id = otherSocketIds[i];
        peers.push(peer);
      }
      data.peers = peers;
      //发送
      socket.emit("created", data);

      //加入房间中
      socket.join(room);
      console.log("Client ID " + socket.id + " joined room " + room);
    }
  });
  //转发offer消息至room其他客户端 [from,to,room,sdp]
  socket.on("offer", function (message) {
    var room = Object.keys(socket.rooms)[1];
    console.log("Received offer: " + message.from + " room:" + room + " message: " + JSON.stringify(message));
    //转发offer消息至其他客户端
    //根据id找到对应连接
    var otherClient = io.sockets.connected[message.to];
    if (!otherClient) {
      return;
    }
    otherClient.emit("offer", message);
  });
  //转发answer消息至room其他客户端 [from,to,room,sdp]
  socket.on("answer", function (message) {
    var room = Object.keys(socket.rooms)[1];
    console.log("Received answer: " + message.from + " room:" + room + " message: " + JSON.stringify(message));
    //转发【answer】消息至其他客户端
    //根据id找到对应连接
    var otherClient = io.sockets.connected[message.to];
    if (!otherClient) {
      return;
    }
    otherClient.emit("answer", message);
  });
  //转发candidate消息至room其他客户端 [from,to,room,candidate[sdpMid,sdpMLineIndex,sdp]]
  socket.on("candidate", function (message) {
    console.log("Received candidate: " + message.from + " message: " + JSON.stringify(message));
    //转发【candidate】消息至其他客户端
    //根据id找到对应连接
    var otherClient = io.sockets.connected[message.to];
    if (!otherClient) {
      return;
    }
    otherClient.emit("candidate", message);
  });
  //【exit】关闭连接转发exit消息至room其他客户端 [from,room]
  socket.on("exit", function (message) {
    console.log("Received exit: " + message.from + " message: " + JSON.stringify(message));
    var room = message.room;
    //关闭该连接
    socket.leave(room);
    //获取room
    var clientsInRoom = io.sockets.adapter.rooms[room];
    if (clientsInRoom) {
      var otherSocketIds = Object.keys(clientsInRoom.sockets);
      for (var i = 0; i < otherSocketIds.length; i++) {
        //转发【exit】消息至其他客户端
        var otherSocket = io.sockets.connected[otherSocketIds[i]];
        otherSocket.emit("exit", message);
      }
    }
  });
  socket.on("sendMessage", function (message) {
    // console.log("Received exit: " + message.from + " message: " + JSON.stringify(message));
    console.log(JSON.stringify(message));
    var room = message.room;
    //获取room
    var clientsInRoom = io.sockets.adapter.rooms[room];
    if (clientsInRoom) {
      var otherSocketIds = Object.keys(clientsInRoom.sockets);
      for (var i = 0; i < otherSocketIds.length; i++) {
        //转发 消息至其他客户端
        var otherSocket = io.sockets.connected[otherSocketIds[i]];
        otherSocket.emit("getMessage", message);
      }
    }
  });
});
var express = require("express");
var app = express();
const os = require("os");
var port = 8087;
app.use(express.static(path.join(__dirname, "/index"))); //定义首页路径
app.use("/static", express.static(__dirname + "/")); //设置静态文件路径
var interfaces = os.networkInterfaces();
var netip = "";
for (var devName in interfaces) {
  var iface = interfaces[devName];
  for (var i = 0; i < iface.length; i++) {
    var alias = iface[i];
    if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
      netip = alias.address;
    }
  }
}
https.createServer(options, app).listen(8087, () => {
  console.log("https://" + netip + ":" + port);
});
