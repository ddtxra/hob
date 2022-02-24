function computeBSIEpisodes(parameters, positive_hemocultures) {

    if (parameters.implementation == "HUG") {
        return hug_implementation(parameters, positive_hemocultures);
    } else {
        alert("No implementation for" + parameters.implementation);
    }

}

//Done for optimisation reasons
function prepareData(positive_hemocultures) {
    positive_hemocultures.forEach(function(d) {
        d.labo_sample_datetime_moment = moment(d.labo_sample_date, "YYYY-MM-DD");
        //d.labo_patient_id_sample_calendar_day = d.patient_id + "-" + formatMomentDateToStringForGranularity(d.labo_sample_datetime_moment, "day");
        d.labo_sample_datetime_timestamp = d.labo_sample_datetime_moment.valueOf();
    })
    return positive_hemocultures;
}

function deepCopy(object) {
    return JSON.parse(JSON.stringify(object));
}