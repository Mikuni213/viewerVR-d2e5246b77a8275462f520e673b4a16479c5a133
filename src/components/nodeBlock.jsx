import React, {useState, useEffect, useRef} from 'react';

import styles from '../styles/nodeBlock.module.scss';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import MicOffIcon from '@material-ui/icons/MicOff';
import MicIcon from '@material-ui/icons/Mic';

const NodeBlock = (props) => {
    const [sound, setSound] = useState(false);
    const [mic, setMic] = useState(false);
    const [value, setValue] = useState(props.value);
    const [localstream, setLocalstream] = useState(props.stream);

    const videoRef = useRef(null);

    // when component rendered, set stream on video element
    useEffect(() => {
        const video = videoRef.current;
        video.srcObject = localstream;
        video.muted = true;
        video.play();
    }, []);

    const handleSoundChange = () => {
        const video = videoRef.current;
        video.muted = sound;
        setSound(!sound);
    };

    const handleMicChange = () => {
        setMic(!mic);
    };

    const handleClick = () => {
        props.onSelected(value);
    };

    return (
        <div
            className={`${styles.block} ${props.viewing ? styles.block_active : ""}`} 
            onClick={handleClick}
        >
            <video className={styles.video} ref={videoRef} id={`videoTexture-${value}`}></video>
            <p className={styles.name}>{`Name: ${value}`}</p>
            <div className={styles.audio}>
                <p className={styles.audio_icon} onClick={handleSoundChange}>{sound ? 
                    <VolumeUpIcon color="primary" /> 
                    : <VolumeOffIcon color="disabled" />}
                </p>
                {/* <p className={styles.audio_icon} onClick={handleMicChange}>{mic ? 
                    <MicIcon color="primary" /> 
                    : <MicOffIcon color="disabled" />}
                </p> */}
            </div>
        </div>
    );
};

export default NodeBlock;