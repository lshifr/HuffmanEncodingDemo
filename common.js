function tally(elems) {
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

function nestWhile(f, arg, cond) {
    let res = arg;
    while (cond(res)) {
        res = f(res)
    };
    return res;
}

function uniqueElems(elems) {
    return tally(elems).map(elem => elem.value);
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

function partition(lst, size, step, tail) {
    if (step === undefined) {
        step = size;
    }
    var plen = Math.floor((lst.length - size) / step) + 1;
    var res = [];
    for (var i = 0; i < plen; i++) {
        res[i] = lst.slice(step * i, step * i + size)
    }
    if (tail && (plen * size < lst.length)) {
        res.push(lst.slice(plen * size, lst.length))
    }
    return res
};