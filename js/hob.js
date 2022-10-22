function computeBSIEpisodes(parameters, positive_hemocultures) {

    if (parameters.implementation == "HUG") {
        return hug_implementation(parameters, positive_hemocultures);
    } else if (parameters.implementation == "PRAISE") {
        return praise_implementation(parameters, positive_hemocultures);
    } else if (parameters.implementation == "HUG_v2022") {
        return hug_implementation_v2022(parameters, positive_hemocultures);
    } else {
        alert("No implementation for" + parameters.implementation);
    }
}


function parseObjectPropertiesAndConvertToMoment(obj, parse) {
    for (let k in obj) {
        if (typeof obj[k] === 'object' && obj[k] !== null) {
            parseObjectPropertiesAndConvertToMoment(obj[k], parse)
        } else if (obj.hasOwnProperty(k)) {
            if (k.endsWith("_moment")) {
                obj[k] = moment(obj[k]);
            }
        }
    }
}

function deepCopy(object) {
    let copy = JSON.parse(JSON.stringify(object));
    parseObjectPropertiesAndConvertToMoment(copy);
    return copy;
}