
/**
 * Implements single step of the transformation to build the Huffman tree. 
 * Each leaf node is of the form { value: symbol, frequency: n }, where frequencies
 * of symbols are sopposed to have been computed earlier.
 * 
 * In the process of combining nodes, we combine two nodes with least frequencies,
 * and make a single node of them, with a frequency being a sum of nodes' frequencies.
 * We then add this combined node to the node pool (array), and sort it by ascending
 * frequencies. The process repeats until we end up with just a single combined node,
 * at which point we have built the Huffman tree. The process ensures that the nodes
 * with least frequencies are deeper in the tree (have longer paths from the root),
 * while the more frequent elements are closer to the root.
 * 
 * @param {*} nodes 
 */
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

/**
 * Implements full process of building a Huffman tree
 * 
 * @param {*} elems 
 */
function getHuffmanTree(elems) {
    let sorted = sortedBy(tally(elems), el => el.frequency);
    return nestWhile(combineNodes, sorted, x => x.length > 1)[0].value;
}


/**
 * Traverses the Huffman tree, keeping track of the traversal path from the root.
 * When a leaf is encountered, we can then associate the path to that leaf with its
 * value (a character in hour case). The map of these asociations is returned. 
 * This allows to easily encode the message by replacing characters with their
 * Huffman tree paths (made of 0s and 1s).
 * 
 * @param {*} tree 
 */
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

/**
 * Main function to perform Huffman decoding in an asynchronous fashion. 
 * 
 * 
 * @param {*} encoded  - the encoded object: {tree: Huffman tree, encodedMessage: [0,1,1,0,1,...]}
 * @param {*} action   - in this setting, a usual callback function taking the node and path to it
 * @param {*} callback - a callback to finalize the process
 * @param {*} settings - settings object (so far only giverns the delay)
 */

function huffmanDecodeGenAsync(encoded, action, callback, settings) {
    let root = encoded.tree;
    let encmsg = encoded.encodedMessage.slice();
    let delay = (settings && settings.delay) || 1000;

    // A function to model async. operations happening in between Huffman tree
    // traversal steps. Returns a promise
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

    // Main call
    coroutine(makeAsyncTreeGenerator()(root, root, encmsg.shift(), asyncAction), callback);
}


/**
 * Constructs unique node id for a binary tree, based on the path from the root
 * to that node. A path is an array of 0s and 1s, e.g. [0,0,1]
 * 
 * @param {*} path 
 */

function makeNodeID(path){
    return "node_" + path.map(el => el.toString()).join('');
}


/**
 * Converts Huffman tree to JSON tree suitable for SpaceTree rendering. Note that we keep
 * track of the path during the traversal, to construct proper node ids using it. We need
 * this to later sync with asynchronous Huffman tree traversal, so that we could highlight
 * the proper SpaceTree node when a given Huffman tree node gets traversed.
 * 
 * @param {*} tree 
 */

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



/****************************************************************************************
 *******   Other ways to perform Huffman decoding (not used currently in code)    *******
*****************************************************************************************/


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
