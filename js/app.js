$.getJSON("static/cases.json", function(cases) {
    console.log(cases)
    var cases = _.groupBy(cases, "patient_id");
    showCase(cases["patient_1019"]);
});


function showCase(cas) {

    var positive_hemocultures = cas.filter(c => c.description == "");
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

    //var pos_hemo_txt = convertJSONForTxtArea(positive_hemocultures);
    //$('#pos_hemocultre_txtarea').val(pos_hemo_txt);
    $('#description').html(cas.filter(c => c.description != "")[0].description);

    var result = computeBSIEpisodes(parameters, positive_hemocultures);

    updateVis(positive_hemocultures, result.episodes);
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