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
        st = init(enc);
    }

    function messageDecode(enc) {
        var result = [];
        var index = 0;
        currentNodeID = null;
        st.plot();

        function asyncDecodeCallback(elem) {
            setEncodedMessage(makeEncodedDivHTML(enc, index++));
            if (!isArray(elem)) {
                console.log(elem);
                result.push(elem);
                setDecodedMessage(result.join(""));
                if (index > 20 && index < 40) {
                    currentNodeID = "node_2";
                } else {
                    currentNodeID = null;
                }
                st.plot();
            }
        }

        huffmanDecodeGenAsync(
            enc,
            asyncDecodeCallback,
            () => { setDecodedMessage(result.join("")); },
            { delay: 300 }
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
            rowString += '<span style="color:green; font-weight:bold">' + row[index] + '</span>';
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