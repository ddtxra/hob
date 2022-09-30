//$.get("static/single_case.tsv", function(tsv_cases) {
$.get("static/cases.tsv", function(tsv_cases) {

    var json_cases = parseTSVAndConvertToJSON(tsv_cases, "\t");
    showCases(json_cases);
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

    let algos = [{ name: "HUG", description: "HUG_SIMPLIFIED" },
        { name: "HUGV2", description: "HUGV2" } //,
        // { name: "PRAISE", description: "PRAISE" }
    ]

    let episodes_implementations = algos.map(function(algo) {
        let episodes = computeBSIEpisodes({
            implementation: algo.name
        }, deepCopy(positive_hemocultures))["episodes"];

        console.log("algo " + algo.name);
        console.log(episodes);
        console.log("----------");

        return {
            name: algo.description,
            episodes: episodes
        }
    })


    updateVis(patient_id, description, positive_hemocultures, episodes_implementations);
}


function parseTSVAndConvertToJSON(cases_tsv, separator) {
    separator = separator ? separator : "\t";
    let lines = cases_tsv.replace(/\r/gm, '').split("\n");
    let column_names = lines[0].split(separator);

    ["patient_id", "stay_id", "labo_sample_date", "labo_germ_name", "labo_commensal"].forEach(function(col) {
        if (column_names.indexOf(col) == -1) {
            let msg = "Can't find " + col + " in tsv file";
            window.alert(msg);
            throw Error(msg);
        }
    })

    let result = [];
    for (let current_line = 1; current_line < lines.length; current_line++) {
        let values = lines[current_line].split(separator);
        let object = {};
        for (let c = 0; c < column_names.length; c++) {
            let col_name = column_names[c];
            object[col_name] = values[c];
        }

        let ph = new PositiveHemoculture(object.description, object.patient_id, object.stay_id, object.labo_sample_date, object.labo_germ_name, object.labo_commensal);
        result.push(ph)
    }
    return result;
}