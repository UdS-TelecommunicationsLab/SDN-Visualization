// objectDiff.js 
// Original: https://github.com/NV/objectDiff.js
// Modified and extended by Andreas Schmidt

var objectDiff = typeof exports != "undefined" ? exports : {};

objectDiff.token = { changed: "c", value: "v", equal: "e", primitive: "p", added: "a", removed: "r", object: "o" };

objectDiff.isDate = function isDate(obj) {
    return Object.prototype.toString.call(obj) == "[object Date]";
};

// This methods minifies the model but preserves ID info to make entities still identifiable.
objectDiff.removeEqualPath = function (difference) {
    if (!difference)
        return;

    for (var key in difference.v) {
        var obj = difference.v[key];
        var type = typeof (obj);
        if (type == "object" || type == "function") {
            if (obj && obj[objectDiff.token.changed] === objectDiff.token.equal && key !== "id") {
                delete difference.v[key];
            } else {
                objectDiff.removeEqualPath(obj);
            }
        }
    }
};

objectDiff.cleanArray = function(object) {
    if (!Array.isArray(object))
        return;

    var i = 0;
    while (i < object.length) {
        if (object[i] === undefined || object[i] === null) {
            object.splice(i, 1);
        } else {
            i++;
        }
    }
};

objectDiff.cleanRecurse = function(obj) {
    for (var key in obj) {
        var type = typeof(obj);
        if (type == "object" || type == "function") {
            objectDiff.cleanRecurse(obj[key]);
            objectDiff.cleanArray(obj);
        }
    }
};

objectDiff.applyChanges = function(object, message) {
    if (message[objectDiff.token.changed] === objectDiff.token.equal) {
        return;
    }

    if (message[objectDiff.token.changed] === objectDiff.token.object) {
        Object.keys(message[objectDiff.token.value]).forEach(function(d) {
            if (message[objectDiff.token.value][d][objectDiff.token.changed] == objectDiff.token.primitive) {
                object[d] = message[objectDiff.token.value][d][objectDiff.token.added];
            } else if (message[objectDiff.token.value][d][objectDiff.token.changed] == objectDiff.token.added) {
                object[d] = message[objectDiff.token.value][d][objectDiff.token.value];
            } else if (message[objectDiff.token.value][d][objectDiff.token.changed] == objectDiff.token.removed) {
                if (Array.isArray(object)) {
                    object[d] = undefined;
                } else {
                    delete object[d];
                }
            } else if (message[objectDiff.token.value][d][objectDiff.token.changed] == objectDiff.token.object) {
                objectDiff.applyChanges(object[d], message[objectDiff.token.value][d]);
            }
        });

        objectDiff.cleanArray(object);
    }
};

objectDiff.diff = function diff(a, b) {
    var difference = objectDiff.basicDiff(a, b);
    objectDiff.cleanRecurse(b);

    objectDiff.removeEqualPath(difference);

    return difference;
};

objectDiff.basicDiff = function basicDiff(a, b) {
    var res = {};
    if (a === b) {
        res[objectDiff.token.changed] = objectDiff.token.equal;
        res[objectDiff.token.value] = a;
        return res;
    }

    // in case that a and b are arrays, they are reshuffled based on id to make add/remove/change more sensible.
    if (Array.isArray(a) && Array.isArray(b)) {
        var idFound = false;
        for (var keyA in a) {
            if (a[keyA].id !== undefined) {
                idFound = true;
                break;
            }
        }
        
        if (!idFound) {
            for (var keyB in b) {
                if (b[keyB].id !== undefined) {
                    idFound = true;
                    break;
                }
            }
        }

        // require at least one id to be set on an element
        if (idFound) {
            var insertIndex = a.length;
            var tmpB = [];
            for (var bKey in b) {
                var found = false;
                for (var aKey = 0; aKey < a.length; aKey++) {
                    if (!a[aKey] || a[aKey].id === undefined || !b[bKey] || b[bKey].id === undefined)
                        continue;

                    if (b[bKey].id === a[aKey].id) {
                        tmpB[aKey] = b[bKey];
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    tmpB[insertIndex++] = b[bKey];
                }
            }

            // Clean and read elements to Array.
            b.splice(0, b.length);
            for (var k in tmpB) {
                b[k] = tmpB[k];
            }

        }
    }

    var value = {};
    var equal = true;

    for (var key in a) {
        if (key in b) {
            if (a[key] === b[key]) {
                value[key] = {};
                value[key][objectDiff.token.changed] = objectDiff.token.equal;
                value[key][objectDiff.token.value] = a[key];
            }
            else if ((a[key] && objectDiff.isDate(a[key])) && (b[key] && objectDiff.isDate(b[key]))) {
                if (a[key].getTime() === b[key].getTime()) {
                    value[key] = {};
                    value[key][objectDiff.token.changed] = objectDiff.token.equal;
                    value[key][objectDiff.token.value] = a[key];
                } else {
                    equal = false;
                    value[key] = { };
                    value[key][objectDiff.token.changed] = objectDiff.token.primitive;
                    value[key][objectDiff.token.added] = b[key];
                }
            } else {
                var typeA = typeof a[key];
                var typeB = typeof b[key];
                if (a[key] && b[key] && (typeA == "object" || typeA == "function") && (typeB == "object" || typeB == "function")) {
                    var valueDiff = basicDiff(a[key], b[key]);
                    if (valueDiff[objectDiff.token.changed] == objectDiff.token.equal) {
                        value[key] = {};
                        value[key][objectDiff.token.changed] = objectDiff.token.equal;
                        value[key][objectDiff.token.value] = a[key];
                    } else {
                        equal = false;
                        value[key] = valueDiff;
                    }
                } else {
                    equal = false;
                    value[key] = { };
                    value[key][objectDiff.token.changed] = objectDiff.token.primitive;
                    value[key][objectDiff.token.added] = b[key];
                }
            }
        } else {
            equal = false;
            value[key] = { };
            value[key][objectDiff.token.changed] = objectDiff.token.removed;
            value[key][objectDiff.token.value] = a[key];
        }
    }

    for (key in b) {
        if (!(key in a)) {
            equal = false;
            value[key] = { };
            value[key][objectDiff.token.changed] = objectDiff.token.added;
            value[key][objectDiff.token.value] = b[key];
        }
    }

    if (equal) {
        res[objectDiff.token.changed] = objectDiff.token.equal;
        res[objectDiff.token.value] = a;
        return res;
    } else {
        res[objectDiff.token.changed] = objectDiff.token.object;
        res[objectDiff.token.value] = value;
        return res;
    }
};