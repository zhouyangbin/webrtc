WebRtc Server，使用Node js开发，信令服务器使用 Socket.IO
WebRtc端通信连接说明
RTCPeerConnection建立连接的过程由发起端、Stun服务器、信令服务器、应答端组成，Stun服务器、信令服务器需要根据自己的业务场景去实现，不过Stun服务器有一些公开的服务，比如：google提供的（stun:stun.l.google.com:19302）服务。
1、let rtcPeerConnection = new RTCPeerConnection({ "iceServers": [ { "url": 'stun:stun.l.google.com:19302 } ] }); 创建一个RTCPeerConnection对象
2、连接信令服务器获取自己Id及连上信令服务器的其他端（这里可以看成有很多成员都在一个房间内，我们要知道这个房间中所有成员的名单）
3、添加视频轨道，该轨道会传达到另一端（非连接的必要因素）
4、创建一个offer,这个offer包含SDP对象，SDP对象中包含当前音视频的相关参数
5、setLocalDescription 保存SDP对象
6、将包含SDP信息的参数发送到信令服务器
7、应答端收到发起端的SDP信息后会调用setRemoteDescription保存SDP信息，并且创建一个应答的answer(SDP对象)发送给发起端
8、发起端收到answer后通过setRemoteDescription保存answer中SDP信息
9、发起端与应答端根据SDP信息创建好了相对应的音视频channel,开启icecandidate的数据收集。（icecandidate可以理解为是获取对等端的IP地址、公网IP地址），发起端通过onicecandidate收到candidate信息。
10、发送端将收到的candidate信息通过信令服务器发送给应答端。
11、应答端通过addicecandidate将candidate保存起来
12、同10，应答端将candidate信息发送给发起端
13、发起端将收到的candidate（该描述描述了连接的远程端的状态）通过addIceCandidate传递给浏览器的ICE代理
这样发起端与应答端就建立起了P2P音视频通道，发起端通过onaddstream回调接口接收应答端发送过来的视频流

前端事件说明
1：事件名：createAndJoinRoom    客户端通知服务器创建并加入room中，若room已存在则直接加入 {room}
    room：房间名称，字符串
2：事件名：offer 发送offer消息 {from,to,room,sdp}
    from: 发送者socket连接标识，字符串
    to:接收者socket连接标识，字符串
    room：房间名称，字符串
    sdp：发送者设备sdp描述，字符串
3：事件名：answer 发送answer消息 {from,to,room,sdp}
    from: 发送者socket连接标识，字符串
    to:接收者socket连接标识，字符串
    room：房间名称，字符串
    sdp：发送者设备sdp描述，字符串
5：事件名：candidate  发送candidate消息 {from,to,room,candidate{sdpMid,sdpMLineIndex,sdp}}
    from: 发送者socket连接标识，字符串
    to:接收者socket连接标识，字符串
    room：房间名称，字符串
    candidate：发送者设备candidate描述，Json类型
      sdpMid：描述协议id，字符串
      sdpMLineIndex：描述协议的行索引，字符串
      sdp：sdp描述协议，字符串
6：事件名：exit  发送exit消息 {from,room}

    from: 发送者socket连接标识，字符串
    room：房间名称，字符串

服务端socket和前端通信说明
1：事件名：created   服务器通知客户端信令连接成功 {id,room,peers[{id}]}
    id: 当前socket连接标识，字符串
    room：房间名称，字符串
    peers：Json数组，房间其他客户端socket连接标识集合
      id：房间其他socket连接标识

2：事件名：joined   服务器通知客户端当前房间有新连接加入 {id,room}
    id: 新socket连接标识，字符串
    room：房间名称，字符串
3：事件名：offer  服务器转发offer消息 {from,to,room,sdp}
    from: 发送者socket连接标识，字符串
    to:接收者socket连接标识，字符串
    room：房间名称，字符串
    sdp：发送者设备sdp描述，字符串
4：事件名：answer  服务器转发answer消息 {from,to,room,sdp}
    from: 发送者socket连接标识，字符串
    to:接收者socket连接标识，字符串
    room：房间名称，字符串
    sdp：发送者设备sdp描述，字符串
5：事件名：candidate  服务器转发candidate消息 {from,to,room,candidate{sdpMid,sdpMLineIndex,sdp}}
    from: 发送者socket连接标识，字符串
    to:接收者socket连接标识，字符串
    room：房间名称，字符串
    candidate：发送者设备candidate描述，Json类型
       sdpMid：描述协议id，字符串
       sdpMLineIndex：描述协议的行索引，字符串
       sdp：sdp描述协议，字符串
6：事件名：exit  服务器转发exit消息 {from,room}
    from: 发送者socket连接标识，字符串
    room：房间名称，字符串
