import dat from 'dat.gui';
import {createContainer} from 'unstated-next';
import {useState, useMemo, useEffect} from "react";

const GUIContainer = createContainer(() => {
    const [message, setMessage] = useState('dat.gui');
    const [debug, setDebug] = useState(true);

    const gui = useMemo(() => new dat.GUI(), []);

    useEffect(() => {
        gui.add({message}, 'message').onChange(value => setMessage(value));
        gui.add({debug}, 'debug').onChange(value => setDebug(value));
    }, []);

    return {message, debug};
});

export default GUIContainer;