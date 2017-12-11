
function freqs(elems) {
    let counters = {};
    let result = [];
    elems.forEach(function (el) {
        if (!(el in counters)) {
            counters[el] = 1;
        } else {
            counters[el] = counters[el] + 1;
        }
    });

    for (let el in counters) {
        result.push({ value: el, frequency: counters[el] })
    };
    return result;
}

function sortedBy(elems, f) {
    return elems.slice().sort((a, b) => f(a) - f(b));
}

function combineNodes(nodes) {
    let copy = nodes.slice();
    if (copy.length <= 1) {
        return copy;
    }
    let fst = copy.shift();
    let sec = copy.shift();
    copy.push({
        value: [fst.value, sec.value],
        frequency: fst.frequency + sec.frequency
    });
    return sortedBy(copy, el => el.frequency);
}

function nestWhile(f, arg, cond) {
    let res = arg;
    while (cond(res)) {
        res = f(res)
    };
    return res;
}

function getHuffmanTree(elems) {
    let sorted = sortedBy(freqs(elems), el => el.frequency);
    return nestWhile(combineNodes, sorted, x => x.length > 1)[0].value;
}

function uniqueElems(elems) {
    return freqs(elems).map(elem => elem.value);
}

function isArray(elem) {
    return elem && elem.constructor.name === "Array";
}

function* flatten(nested) {
    if (isArray(nested)) {
        for (elem of nested) {
            yield* flatten(elem)
        }
    } else {
        yield nested;
    }
}

function getEncodings(tree) {
    let result = {};
    let path = [];

    function traverse(node, f) {
        if (!isArray(node)) {
            f(node, path.slice());
            return;
        } else {
            path.push(0);
            traverse(node[0], f);
            path.pop();
            path.push(1);
            traverse(node[1], f);
            path.pop();
        }
    }

    traverse(tree, (elem, path) => {
        result[elem] = path;
    });

    return result;
}

function huffmanEncode(msg) {
    let chars = msg.toLowerCase().split("");
    let tree = getHuffmanTree(chars);
    let encodings = getEncodings(tree);
    let encoded = Array.from(flatten(chars.map(ch => encodings[ch])));
    return {
        tree: tree,
        encodedMessage: encoded
    }
}

function huffmanDecode(encoded) {
    let root = encoded.tree;
    let encmsg = encoded.encodedMessage;
    let ctr = 0;

    function treeTraverse(tree, f) {
        if (ctr >= encmsg.length) {
            return;
        }
        let step = encmsg[ctr];
        ctr++;
        let subtree = tree[step];
        if (isArray(subtree)) {
            treeTraverse(subtree, f)
        } else {
            f(subtree);
        }
    }

    while (ctr < encmsg.length) {
        treeTraverse(root, elem => console.log(elem));
    }
}

// Generator to construct infinite Huffman tree iterator driven by encoded message
function* treeIterate(root, node, step) {
    let nextStep;
    if (isArray(node)) {
        let subNode = node[step];
        if (isArray(subNode)) {
            nextStep = yield;
        } else {
            nextStep = yield subNode;
        }
        yield* treeIterate(root, subNode, nextStep);
    } else {
        yield* treeIterate(root, root, step);
    }
}

// The 'action' function should return a promise, that would resolve into the next step,
// or an object from which one can extract the next step
function* treeIterateWithAction(root, node, step, action) {
    let nextStep;
    if (isArray(node)) {
        let subNode = node[step];
        nextStep = yield action(subNode);
        if (nextStep === undefined) {
            return;
        }
        yield* treeIterateWithAction(root, subNode, nextStep, action);
    } else {
        yield* treeIterateWithAction(root, root, step, action);
    }
}



function huffmanDecodeGen(encoded, action) {
    let root = encoded.tree;
    let encmsg = encoded.encodedMessage;

    /*
    function applyf(val){
        if(val.value){
            f(val.value)
        }
    }
    */

    function asyncAction(val) {
        return new Promise((resolve, reject) => {
            if (isArray(val)) {
                resolve(encmsg.shift())
            } else {
                setTimeout(() => {
                    action(val);
                    resolve(encmsg.shift())
                }, 1000);
            }
        });
    }

    /*
    function handle(iter, next){
        if(!next.done){
            next.value.then(resp => handle(iter, iter.next(resp)));
        } else {

        }
    }
    */

    let coroutine = (genIt) => {
        const handle = (result) => {
            if(result.done){
                return Promise.resolve(result.value);
            } else{
                return Promise.resolve(result.value).then(res => handle(genIt.next(res))) 
            }
            
        };
        return handle(genIt.next());
    }

    let treeIt = treeIterateWithAction(root, root, encmsg.shift(), asyncAction);
    //applyf(treeIt.next());

    coroutine(treeIt);

    /*
    treeIt.next().value
        .then(resp => treeIt.next(resp).value)
        .then(resp => treeIt.next(resp).value)
        .then(resp => treeIt.next(resp).value)
        .then(resp => treeIt.next(resp).value)
        .then(resp => treeIt.next(resp).value)
        .then(resp => treeIt.next(resp).value)
        .then(resp => treeIt.next(resp).value)
        .then(resp => treeIt.next(resp).value)
    */
    /*    
    for(let i = 1; i < encmsg.length; i++){
        let result = treeIt.next(encmsg[i]);
        if(result.value){
            console.log(result.value);
        }    
    }
    */

}


var msg = "She sells sea shells by the sea shore";
var chars = msg.toLowerCase().split("");
//var sorted = sortedBy(freqs(chars), el => el.frequency);
var tree = getHuffmanTree(chars);

//console.log(sorted);
//console.log(tree);
console.log(getEncodings(tree));
let enc = huffmanEncode(msg);
console.log(enc);
//huffmanDecode(huffmanEncode(msg));

/*
let treeIt = treeIterate(enc.tree, enc.tree, enc.encodedMessage[0]);
console.log(treeIt.next());
for(let i = 1; i < enc.encodedMessage.length; i++){
    let result = treeIt.next(enc.encodedMessage[i]);
    if(result.value){
        console.log(result.value);
    }    
}
*/

huffmanDecodeGen(enc, elem => { console.log(elem) });

