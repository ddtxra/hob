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


function selectionChanged() {

    var case_id = $('#dataset-selector').find(":selected").text();
    var algo = $('#algo-selector').find(":selected").val();
    var parameters = {
        implementation: algo
    };

    $('#description').html("");
    $("#fv_pos_hemo").empty();
    $("#fv_episodes").empty();
    $("#fv_expected").empty();
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
    updateVis(positive_hemocultures, result.episodes, scenario.expected_episodes);
}


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

// listeners
$('#dataset-selector').change(selectionChanged);
$('#algo-selector').change(selectionChanged);