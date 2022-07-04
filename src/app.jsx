// React Library
import React, {useState, useRef, useEffect} from 'react';
import * as ReactDOM from 'react-dom';

// styles
import style from "./styles/style.scss";

// Custom Components
import Layout from './components/layout.jsx';

// UI materials
import ViewRenderer from './components/viewRenderer.jsx';
import NodeBlock from './components/nodeBlock.jsx';
import MicOffIcon from '@material-ui/icons/MicOff';
import MicIcon from '@material-ui/icons/Mic';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import IconButton from '@material-ui/core/IconButton';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';

// GUI
import GUIContainer from './components/GUI.jsx';

import ReactPlayer from 'react-player';

// signaling settings
const Sora = require('./lib/sora.min.js');
const SIGNALING_URL = "wss://exleap-signaling.site/signaling";
const DEBUG = true;

// websocket
import io from 'socket.io-client';
const socket = io({path: '/socket'});

const Viewer = () => {
    const [localstream, setLocalstream] = useState(null);
    const [nodeList, setNodeList] = useState([]);
    const [viewing, setViewing] = useState("");
    const [newNode, setNewNode] = useState("");
    const [searchID, setSearchID] = useState("");

    const [micState, setMicState] = useState(false);
    const [sendStreams, setSendStreams] = useState({});

    const [nodeStreams, setNodeStreams] = useState({});
    const [playedSecond, setPlayedSecond] = useState(0);
    const [playedSecond_tmp, setPlayedSecond_tmp] = useState(0);
    const [audioUrl,setAudioUrl] = useState('../audio/test0.mp3');
    const [isPlay,setIsPlay] = useState(false);

    // for UI Debug
    const [count, setCount] = useState(0);

    // GUI Params
    const {message, debug} = GUIContainer.useContainer();

    // when component rendered, get user media
    useEffect(() => {
        const constraints = {
            audio: true,
            video: false
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                setLocalstream(stream);
            }).catch(e => {
                console.error(e);
            });

        // send my name to websocket
        socket.emit('init', JSON.stringify({'name': 'viewer'}));
        socket.on('init', data => {
            console.log(data);
        });
        handleNodeAddDev();  
    }
    , []);

    useEffect(() => {
        if (nodeStreams.length < 2) {
            handleNodeSwitch(newNode);
        }
    }, [nodeStreams]);

    const handleConnectSingleChannel = () => {
        // get channel ID
        const channelID = searchID;
        setSearchID("");

        const sora = Sora.connection(SIGNALING_URL, DEBUG);
        const sendrecv = sora.sendrecv(channelID, '', {multistream: true});

        // make clone of mediastream to send individually
        const mediastream = localstream.clone();
        const newSendStreams = {...sendStreams};
        newSendStreams[channelID] = mediastream;
        // sendStreams[channelID] = mediastream;

        // connect
        mediastream.getAudioTracks()[0].enabled = false;
        sendrecv.connect(mediastream);

        setSendStreams(newSendStreams);

        // add node UI
        sendrecv.on('track', (event) => {
            console.log('stream came');
            const stream = event.streams[0];

            // add stream into list
            if (!nodeList.includes(channelID)) {
                const newNodeList = nodeList;
                newNodeList.push(channelID);
                setNodeList(newNodeList);
                const newNodeStreams = nodeStreams;
                newNodeStreams[channelID] = stream;
                setNodeStreams(newNodeStreams);
                setNewNode(channelID);
            }
        });

        sendrecv.on('removetrack', (event) => {
            // remove node block
            console.log(`${channelID} was removed`);
            const newNodeList = nodeList.filter(node => node !== channelID);
            const newNodeStreams = {...nodeStreams};
            delete newNodeStreams[channelID];
            setNodeList(newNodeList);
            setNodeStreams(newNodeStreams);

            if (viewing === channelID && newNodeList.length > 0) {
                handleNodeSwitch(newNodeList[0]);
            }
        });
    };

    /* ------------------------------------------------
        this is the function for debugging
        It uses local video as Node video,
        don't use WebRTC connection for fast debugging
    --------------------------------------------------- */
    const captureStreamOnMultiBrowser = (video) => {
        const sUsrAg = navigator.userAgent;
    
        if (sUsrAg.indexOf('Firefox') > -1) {
            return video.mozCaptureStream();
        } else {
            return video.captureStream();
        }
    }

    const handleNodeAddDev_original = (k) => {
        // get search ID
        const channelID = k;
        setSearchID("");

        let video = document.createElement('video');
        video.src = `../mov/texture${k}.mp4`;
        video.load();
        video.muted = true;
        video.loop = true;
        video.play();

        const newNodeStreams = nodeStreams;
        const newNodeList = nodeList;

        video.onloadeddata = () => {
            const videoStream = captureStreamOnMultiBrowser(video);
            newNodeList.push(channelID);
            newNodeStreams[channelID] = videoStream;
            setNodeStreams(newNodeStreams);
            setNodeList(newNodeList);
            setNewNode(channelID);
        }

        if (count < 4) setCount(count + 1);
        }

    const handleNodeAddDev = () => {
        for (let i = 0; i < 3; i++) {
            handleNodeAddDev_original(i);
          }
          setIsPlay(true);
    }

    /* ------------------------------------------------- */

    const handleNodeSwitch = (nodeId) => {
        changeAudioUrl(nodeId);
        if (nodeId !== viewing) {
            // change mic states
            if (micState) {
                Object.keys(sendStreams).forEach(name => {
                    if (name === nodeId) sendStreams[name].getAudioTracks()[0].enabled = true;
                    else sendStreams[name].getAudioTracks()[0].enabled = false;
                });
            }

            // send socket
            socket.emit('jump', JSON.stringify({'name': 'takeshi', 'to': nodeId}));

            setViewing(nodeId);
        }
    };

    const handleIDChange = (e) => {
        setSearchID(e.target.value);
    };

    const handleMicControl = ()=> {
        if (micState) {
            Object.keys(sendStreams).forEach(name => {
                sendStreams[name].getAudioTracks()[0].enabled = false;
            });
            setMicState(false);
        } else {
            Object.keys(sendStreams).forEach(name => {
                if (name === viewing) sendStreams[name].getAudioTracks()[0].enabled = true;
                else sendStreams[name].getAudioTracks()[0].enabled = false;
            });
            setMicState(true);
        }
    };

    const changeAudioUrl=(num)=>{setPlayedSecond_tmp(playedSecond); setAudioUrl(`../audio/test${num}.mp3`);console.log(audioUrl);}

    const ref = useRef();

    const audioSwhich =()=>{
        const audioState = isPlay;
        setPlayedSecond_tmp(0);
        setIsPlay(!audioState);
    };

    return (
        <Layout>
            <div className={style.nodeControl}>
                <div className={style.micControl} onClick={audioSwhich}>
                    {isPlay ? <VolumeUpIcon color="primary" /> : <VolumeOffIcon />}
                </div>
                <div className={style.nodeList}>
                <ReactPlayer url = {audioUrl} playing={isPlay} controls={false} loop={true} height="3px" width="3px" progressInterval={100} onProgress={(progress) => {
       setPlayedSecond(progress.playedSeconds);console.log(playedSecond)}} ref = {ref} onPlay={()=>{ref.current.seekTo(playedSecond_tmp)}}/>
                    {nodeList.map(nodeId =>
                        <NodeBlock
                            value={nodeId}
                            key={nodeId}
                            stream={nodeStreams[nodeId]}
                            viewing={(nodeId === viewing) ? true : false}
                            onSelected={handleNodeSwitch}
                        />
                    )}
                </div>
            </div>

            <ViewRenderer viewing={viewing} newNode={newNode} socket={socket} handleJump={(name) => handleNodeSwitch(name)} />
        </Layout>
    );
};

// Render Page
ReactDOM.render(
    <GUIContainer.Provider>
        <Viewer />
    </GUIContainer.Provider>,
    document.getElementById('app')
);