var parameters = {
    implementation: "HUG"
};


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
    fillDropDown(scenarios);
    SCENARIOS = scenarios;
});
/*

function convertJSONForTxtArea(jsonArray) {
    var headers = Object.keys(jsonArray[0]);
    headers = headers.filter(h => h !== "labo_sample_datetime_moment");
    headers = headers.filter(h => h !== "labo_sample_datetime_timestamp");
    
    var txt = headers.join("\t") + "\n";
    txt += jsonArray.map(ph => headers.map(h => ph[h]).join("\t")).join("\n");
    return txt;
}*/

$('#dataset-selector').change(function() {

    var case_id = $('#dataset-selector').find(":selected").text();

    $('#description').html("");
    $("#fv_pos_hemo").empty();
    $("#fv_episodes").empty();
    $('#pos_hemo_grid').empty();
    $('#episodes_grid').empty();

    var scenario = SCENARIOS[case_id];
    if (scenario) {
        $("#scenarioContainer").show();
    } else {
        $("#scenarioContainer").hide();
    }


    var positive_hemocultures = scenario.positive_hemocultures;
    //var pos_hemo_txt = convertJSONForTxtArea(positive_hemocultures);
    //$('#pos_hemocultre_txtarea').val(pos_hemo_txt);
    $('#description').html(scenario.description);


    var result = computeBSIEpisodes(parameters, positive_hemocultures);

    updateVis(positive_hemocultures, result.episodes);

});

function showRawTab() {
    $("#rawDataTab").addClass("active");
    $("#computedDataTab").removeClass("active");
    $("#pos_hemo_grid").show();
    $("#episodes_grid").hide();
}

function showComputedTab() {
    $("#computedDataTab").addClass("active");
    $("#rawDataTab").removeClass("active");
    $("#pos_hemo_grid").hide();
    $("#episodes_grid").show();
}

$('#rawDataTab').click(function() {
    showRawTab();
});

$('#computedDataTab').click(function() {
    showComputedTab();
});

$("#scenarioContainer").hide();