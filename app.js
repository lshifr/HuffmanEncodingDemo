document.addEventListener("DOMContentLoaded", ready);

// Space Tree object
var st;

function ready() {

    const inputButton = document.querySelector("#encodebtn");
    const decodeButton = document.querySelector("#decodebtn");
    const input = document.querySelector("#msginput");
    const canvas = document.querySelector("#infovis");
    const encoded = document.querySelector("#encmsg");
    const decoded = document.querySelector("#decdmsg");
    const stopResumeBtn = document.querySelector("#stopResumeBtn");
    const startMsg = "She sells sea shells by the sea shore";
    const delay = 2000;

    let enc;
    let running = true;
    let decoding = false;

    input.value = startMsg;
    messageEncode(startMsg);

    function setEncodedMessage(msg) {
        encoded.innerHTML = msg;
    }

    function setDecodedMessage(msg) {
        decoded.innerHTML = msg;
    }

    function refreshCanvas() {
        canvas.innerHTML = "";
    }

    function pause(){
        if(running){
            running = false;
            stopResumeBtn.textContent = 'Resume';
            stopResumeBtn.classList.remove('btn-warning');
            stopResumeBtn.classList.add('btn-success');
        }
    }

    function resume(){
        if(!running){
            running = true;
            stopResumeBtn.textContent = 'Pause';
            stopResumeBtn.classList.add('btn-warning');
            stopResumeBtn.classList.remove('btn-success');
        }
    }

    function disableStopResumeButton(){
        stopResumeBtn.disabled = true;
        stopResumeBtn.classList.remove('btn-success');
        stopResumeBtn.classList.remove('btn-warning');
        stopResumeBtn.classList.add('btn-default');
    }

    function enableStopResumeButton(){
        stopResumeBtn.disabled = false;
        stopResumeBtn.classList.remove('btn-default');
        stopResumeBtn.classList.add(running? 'btn-warning':'btn-success');
    }

    function messageEncode(message) {
        refreshCanvas();
        enc = huffmanEncode(message);
        setEncodedMessage(makeEncodedDivHTML(enc));
        st = initSpaceTree(enc);
    }

    function messageDecode(enc) {
        var result = [];
        var index = 0;
        currentNodeID = null;
        st.plot();

        function updateEncodedMessageHighlighting(){
            setEncodedMessage(makeEncodedDivHTML(enc, index++));
        }

        function updateDecodedMessage(){
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
                delay
            ),
            () => { updateDecodedMessage(); disableStopResumeButton();},
        );
    }

    inputButton.addEventListener('click', function () {
        messageEncode(input.value);
        setDecodedMessage("");
    });

    decodeButton.addEventListener('click', function () {
        decoding = true;
        enableStopResumeButton();
        messageDecode(enc);
    });

    stopResumeBtn.addEventListener('click', function(){
        if(running){
            pause();
        } else {
            resume();
        }
    })

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