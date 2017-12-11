
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

function getHuffmanTree(elems) {
    let sorted = sortedBy(tally(elems), el => el.frequency);
    return nestWhile(combineNodes, sorted, x => x.length > 1)[0].value;
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


/**
 * Main function to perform Huffman encoding of the message. Takes a message string
 * to encode. Returns an object with the tree and encoded message
 * 
 * @param {*} msg 
 */ 
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


// Traditionally written synchronous decoder
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


/**
 * Generator to construct infinite Huffman tree iterator driven by encoded message.
 * Note: this generator does not yield promises
 * 
 * @param {*} root 
 * @param {*} node 
 * @param {*} step 
 */
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


/**
 * Generator to construct infinite Huffman tree iterator driven by encoded message.
 * Yields promises 
 * 
 * @param {*} root  - root node of the Huffman tree
 * @param {*} node  - current node being iterated over
 * @param {*} step  - a binary integer (0 or 1) to pick the left or right branch of the Huffman tree
 * @param {*} action  - a function to be applied to the node. Should return a promise that would 
 * resolve into the next step, or an object from which one can extract the next step
 */

function makeAsyncTreeGenerator(){ // Need extra level to encapsulate path
    let path = [];
    return function* treeIterateWithAction(root, node, step, action) {
        let nextStep;
        if (isArray(node)) {
            let subNode = node[step];
            path.push(step);
            nextStep = yield action(subNode, path);
            if (nextStep === undefined) {
                return;
            }
            yield* treeIterateWithAction(root, subNode, nextStep, action);
        } else {
            path = [];
            yield* treeIterateWithAction(root, root, step, action);
        }
    }
};

function huffmanDecodeGen(encoded, f){
    let root = encoded.tree;
    let encmsg = encoded.encodedMessage.slice();

    function action(val){
        if(val.value !== undefined){  // Only do something with the leaves 
            f(val.value);
        }
    }

    let treeIt = treeIterate(root, root, encmsg.shift());
    action(treeIt.next());
    while(encmsg.length > 0){
        action(treeIt.next(encmsg.shift()));
    };
}


function huffmanDecodeGenAsync(encoded, action, callback, settings) {
    let root = encoded.tree;
    let encmsg = encoded.encodedMessage.slice();
    let delay = (settings && settings.delay) || 1000;

    // A function to model async. operations happening in between Huffman tree
    // traversal steps
    function asyncAction(val, path) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                action(val, path);
                resolve(encmsg.shift())
            }, delay);
        });
    }

    // Coroutine helper to resolve promises and feed results back into the Huffman
    // tree traversal generator
    let coroutine = (genIt, callback) => {
        const handle = (result) => {
            if(result.done){
                return Promise.resolve(result.value).then(res => callback(res));
            } else{
                return Promise.resolve(result.value).then(res => handle(genIt.next(res))) 
            }
            
        };
        return handle(genIt.next());
    }

    coroutine(makeAsyncTreeGenerator()(root, root, encmsg.shift(), asyncAction), callback);
}


function makeNodeID(path){
    return "node_" + path.map(el => el.toString()).join('');
}

function huffmanTreeToJSON(tree){
    let path = [];

    function makeJSONNode(node, path){
        return {
            id: makeNodeID(path),
            name: isArray(node)? "": ""+node,
            data: {},
            children: []
        };
    }

    function traverse(node, parentJSON){
        let newJSONNode = makeJSONNode(node, path);
        if(isArray(node)){
            path.push(0);
            traverse(node[0], newJSONNode);
            path.pop();
            path.push(1);
            traverse(node[1], newJSONNode);
            path.pop();            
        } 
        parentJSON.children.push(newJSONNode);
    }

    let result = makeJSONNode(tree, []);
    traverse(tree, result);
    return result.children[0];
}
