$.getJSON("static/cases.json", function(cases) {
    showCases(cases);
});

function showCases(cases) {

    $('#description').html("");
    $("#fv_pos_hemo").empty();
    $("#fv_episodes").empty();
    $("#fv_expected").empty();
    var algo = $('#algo-selector').find(":selected").val();

    cases.filter(c => c.description != "").forEach(function(c) {
        var positive_hemocultures = cases.filter(p => ((c.patient_id == p.patient_id) && (p.description == "")));
        showCase(c.patient_id, c.description, positive_hemocultures)
    })

}

function showCase(patient_id, description, positive_hemocultures) {
    //var pos_hemo_txt = convertJSONForTxtArea(positive_hemocultures);
    //$('#pos_hemocultre_txtarea').val(pos_hemo_txt);
    $('#description').html(description);
    updateVis(patient_id, positive_hemocultures);
}
