// /* dont needed for now, but will might be needed in the future

const handleConnect = () => {
    // socket connection
    const info = {
        "type": "viewer",
        "name": myID,
    };
    socket.emit('init', JSON.stringify(info));

    // connect sora at first connection
    const sora = Sora.connection(SIGNALING_URL, DEBUG);

    // connect to channel
    const notifyMetadata = {
        "type": "viewer",
    };

    const options = {
        multistream: true,
        signalingNotifyMetadata: notifyMetadata,
        clientId: myID
    };

    const sendrecv = sora.sendrecv(CHANNEL_ID, '', options);
    sendrecv.connect(localstream);

    // error handler
    sendrecv.on('disconnect', e => {
        console.error(e);
    });

    // add node UI
    sendrecv.on('track', (event) => {
        console.log('stream came');
        const stream = event.streams[0];

        // add stream into list
        nodeStreams[stream.id] = stream;
    });

    sendrecv.on('removetrack', (event) => {
        // remove node block
        console.log(`${channelID} was removed`);
        const newNodeList = nodeList.filter(node => node !== channelID);
        delete nodeStreams[channelID];
        setNodeList(newNodeList);
    });

    sendrecv.on('notify', (event) => {
        if (event.event_type !== "connection.created" || 
            event.client_id === myID || 
            event.metadata.type === "viewer") return;

        const id = event.connection_id;
        const name = event.client_id;

        const newNodeList = nodeList;
        const newNodeNameHash = {...nodeNameHash};
        newNodeList.push(name);
        newNodeNameHash[name] = id;
        setNodeList(newNodeList);
        setNodeNameHash(newNodeNameHash);
        setNewNode(name);

        if (viewing === "") setViewing(name);

        console.log(`notify: ${JSON.stringify(event)}`);
    });

    setMyIDNotFixed(false);
};

{false ? 
<div className={style.myControl}>
    {myIDNotFixed ? <>
        <Input value={myID} placeholder="input your ID" onChange={handleMyIDChange} color="primary" /> 
        <Button color="primary" variant="contained" onClick={handleConnect}>Connect</Button> </>
        : <p>Your ID : {myID}</p> }
    {micState ? 
        <IconButton aria-label="mic is active" color="primary" onClick={handleMicControl}>
            <MicIcon />
        </IconButton>
        : <IconButton aria-label="mic is muted" color="default" onClick={handleMicControl}>
            <MicOffIcon />
        </IconButton>
    }
</div>
: null}

// */