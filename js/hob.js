function computeBSIEpisodes(parameters, positive_hemocultures) {

    if (parameters.implementation == "HUG") {
        return hug_implementation(parameters, positive_hemocultures);
    } else {
        alert("No implementation for" + parameters.implementation);
    }

}