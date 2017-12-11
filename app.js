document.addEventListener("DOMContentLoaded", ready);

var st;

function ready() {

    const inputButton = document.querySelector("#encodebtn");
    const decodeButton = document.querySelector("#decodebtn");
    const input = document.querySelector("#msginput");
    const canvas = document.querySelector("#infovis");
    const encoded = document.querySelector("#encmsg");
    const decoded = document.querySelector("#decdmsg");
    const startMsg = "She sells sea shells by the sea shore";
    const delay = 2000;

    let enc;

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

        function asyncDecodeCallback(elem, path) {
            setEncodedMessage(makeEncodedDivHTML(enc, index++));
            currentNodeID = makeNodeID(path);
            if (!isArray(elem)) {
                result.push(elem);
                setDecodedMessage(result.join(""));
            }
            //st.compute();
            st.plot();
        }

        huffmanDecodeGenAsync(
            enc,
            asyncDecodeCallback,
            () => { setDecodedMessage(result.join("")); },
            { delay: delay }
        );
    }

    inputButton.addEventListener('click', function () {
        messageEncode(input.value);
        setDecodedMessage("");
    });

    decodeButton.addEventListener('click', function () {
        messageDecode(enc);
    });

    //showDecodingInConsole();
}

function showDecodingInConsole() {
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