var parameters = {
    implementation: "HUG"
};

//Done for optimisation reasons
function prepareData(scenarios) {
    var scenarioKeys = Object.keys(scenarios);
    scenarioKeys.forEach(function(scenarioKey) {
        var scenario = scenarios[scenarioKey];
        scenario["positive_hemocultures"].forEach(function(d) {
            d.labo_sample_datetime_moment = moment(d.labo_sample_date, "YYYY-MM-DD");
            //d.labo_patient_id_sample_calendar_day = d.patient_id + "-" + formatMomentDateToStringForGranularity(d.labo_sample_datetime_moment, "day");
            d.labo_sample_datetime_timestamp = d.labo_sample_datetime_moment.valueOf();
        })
    })
}

function fillDropDown(scenarios) {
    var selector = $("#form-selector");
    Object.keys(scenarios).forEach(function(scenario_key) {
        $("<option />", {
            value: scenario_key,
            text: scenario_key
        }).appendTo(selector);
    })
}

$.getJSON("static/test_scenarios.json", function(scenarios) {
    prepareData(scenarios)
    fillDropDown(scenarios);
    SCENARIOS = scenarios;
});

function convertJSONForTxtArea(jsonArray) {
    var headers = Object.keys(jsonArray[0]);
    headers = headers.filter(h => h !== "labo_sample_datetime_moment");
    headers = headers.filter(h => h !== "labo_sample_datetime_timestamp");
    
    var txt = headers.join("\t") + "\n";
    txt += jsonArray.map(ph => headers.map(h => ph[h]).join("\t")).join("\n");
    return txt;
}

$('#dataset-selector').change(function() {

    var case_id = $('#dataset-selector').find(":selected").text();
    var positive_hemocultures = SCENARIOS[case_id].positive_hemocultures;
    var pos_hemo_txt = convertJSONForTxtArea(positive_hemocultures);

    $('#pos_hemocultre_txtarea').val(pos_hemo_txt);


    var result = computeBSIEpisodes(parameters, positive_hemocultures);
    console.log(result);

    updateVis(positive_hemocultures, result.episodes);

});
