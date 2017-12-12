document.addEventListener("DOMContentLoaded", ready);

// Space Tree object
var st;

function ready() {

    const decodeButton = document.querySelector("#decodebtn");
    const input = document.querySelector("#msginput");
    const canvas = document.querySelector("#infovis");
    const encoded = document.querySelector("#encmsg");
    const decoded = document.querySelector("#decdmsg");
    const stopResumeBtn = document.querySelector("#stopResumeBtn");
    const speedSelect = document.querySelector("#speedSelect");
    const startMsg = "She sells sea shells by the sea shore";
    
    let delay;
    let enc;
    let running = true;
    let decoding = false;

    input.value = startMsg;
    speedSelect.value = "Slow";


    function setEncodedMessage(msg) {
        encoded.innerHTML = msg;
    }

    function setDecodedMessage(msg) {
        decoded.innerHTML = msg;
    }

    function refreshCanvas() {
        canvas.innerHTML = "";
    }

    function updateDelay(){
        let delays = {
            'Very slow': 4000,
            'Slow': 2000,
            'Medium': 1000,
            'Fast': 500,
            'Very fast': 200
        };
        delay = delays[speedSelect.value];
    }

    function pause() {
        if (running) {
            running = false;
            stopResumeBtn.textContent = 'Resume';
            stopResumeBtn.classList.remove('btn-warning');
            stopResumeBtn.classList.add('btn-success');
        }
    }

    function resume() {
        if (!running) {
            running = true;
            stopResumeBtn.textContent = 'Pause';
            stopResumeBtn.classList.add('btn-warning');
            stopResumeBtn.classList.remove('btn-success');
        }
    }

    function disableStopResumeButton() {
        stopResumeBtn.disabled = true;
        stopResumeBtn.classList.remove('btn-success');
        stopResumeBtn.classList.remove('btn-warning');
        stopResumeBtn.classList.add('btn-default');
        stopResumeBtn.textContent = 'Pause';
    }

    function enableStopResumeButton() {
        stopResumeBtn.disabled = false;
        stopResumeBtn.classList.remove('btn-default');
        stopResumeBtn.classList.add(running ? 'btn-warning' : 'btn-success');
    }

    function decode() {
        if (!decoding) {
            decoding = true;
            enableStopResumeButton();
            messageDecode(enc);
            decodeButton.classList.remove('btn-info');
            decodeButton.classList.add('btn-danger');
            decodeButton.textContent = 'Discard';
            input.disabled = true;
        }
    }

    function refresh(clearDecodedMessageOutput) {
        input.disabled = false;
        if(clearDecodedMessageOutput){
            enc = null;
            messageEncode(input.value);
            setDecodedMessage('');
        }
    }

    function discard(clearDecodedMessageOutput) {
        decoding = false;
        running = true;
        disableStopResumeButton();
        decodeButton.classList.add('btn-info');
        decodeButton.classList.remove('btn-danger');
        decodeButton.textContent = 'Decode';
        refresh(clearDecodedMessageOutput);
    }

    function messageEncode(message) {
        refreshCanvas();
        enc = huffmanEncode(message);
        setEncodedMessage(makeEncodedDivHTML(enc));
        currentNodeID = null;
        st = initSpaceTree(enc);
    }

    function messageDecode(enc) {
        var result = [];
        var index = 0;
        currentNodeID = null;
        st.plot();

        function updateEncodedMessageHighlighting() {
            setEncodedMessage(makeEncodedDivHTML(enc, index++));
        }

        function updateDecodedMessage() {
            setDecodedMessage(result.join(""));
        }

        function asyncDecodeStep(elem, path) {
            updateEncodedMessageHighlighting();
            currentNodeID = makeNodeID(path);  // Setting global variable to sync with SpaceTree rendering
            if (!isArray(elem)) {
                result.push(elem);
                updateDecodedMessage();
            }
            st.plot(); // Repaint the tree
        }

        huffmanDecodeGenAsync(
            enc,
            (elem, path) => delayedCheckedPromiseWrap(
                () => asyncDecodeStep(elem, path),
                () => running,
                () => !decoding,
                delay
            ),
            () => { updateDecodedMessage(); discard(false); },
            () => { discard(true); }
        );
    }

    decodeButton.addEventListener('click', function () {
        if (!decoding) {
            decode();
        } else {
            //discard();
            decoding = false;
        }
    });

    stopResumeBtn.addEventListener('click', function () {
        if (running) {
            pause();
        } else {
            resume();
        }
    });

    input.addEventListener('keyup', function(){
        messageEncode(input.value);
        setDecodedMessage("");
    });

    speedSelect.addEventListener('change', updateDelay);

    updateDelay();
    refresh(true);
    decode();

    //showDecodingInConsole();
}

function showDecodingInConsole() {  // A helper function
    let enc = huffmanEncode(input.value);
    console.log(enc);
    console.log("\n\n\n ------- Synchronouse decoding ------- \n\n");
    huffmanDecodeGen(enc, elem => { console.log(elem) });
    console.log("\n\n\n ------- Async decoding ------- \n\n");
    huffmanDecodeGenAsync(enc, elem => { console.log(elem) }, () => { });
}

function makeEncodedDivHTML(enc, index) {
    let message = enc.encodedMessage;
    let digitsPerRow = 10;
    let partit = partition(message, digitsPerRow, digitsPerRow, true);
    let result = '';
    let ctr = 0;
    partit.forEach(row => {
        let rowString = '';
        if (index !== undefined && index >= 0 && index < row.length) {
            if (index > 0) {
                rowString = row.slice(0, index).join(' ');
                rowString += ' ';
            }
            rowString += '<span class="highlight-step">' + row[index] + '</span>';
            rowString += ' ';
            rowString += row.slice(index + 1).join(" ");
        } else {
            rowString += row.join(' ');
        }
        rowString += '<br>';
        index -= row.length;
        result += rowString;
    });
    return result;
}