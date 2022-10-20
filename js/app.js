//$.get("static/single_case.tsv", function(tsv_cases) {
$.get("static/cases.tsv", function(tsv_cases) {
    $("#dataText").val(tsv_cases);
    let json_cases = parseTSVAndConvertToJSON(tsv_cases, "\t");
    showCases(json_cases);
});


$("#compute").click(function() {
    let json_cases = parseTSVAndConvertToJSON($("#dataText").val(), "\t");
    showCases(json_cases);
});

function showCases(cases) {

    $('#description').html("");
    $("#fv_pos_hemo").empty();
    $("#fv_episodes").empty();
    $("#fv_expected").empty();

    let tableData = {};


    cases.filter(c => c.description != "").forEach(function(c) {
        let positive_hemocultures = cases.filter(p => ((c.patient_id == p.patient_id) && (p.description == "")));
        let episode_implementations = getEpsiodesForAllAglorithms(positive_hemocultures);
        updateVis(c.patient_id, c.description, positive_hemocultures, episode_implementations);

        //for each impl
        episode_implementations.forEach(impl => {
            if (!tableData[impl.name]) {
                tableData[impl.name] = { "episodes_count": 0 };
            }
            tableData[impl.name]["episodes_count"] = (tableData[impl.name]["episodes_count"] + impl.episodes.length);
        })
    })


    Object.keys(tableData).forEach(key => {
        $("#" + key + "_ROW").find("td:eq(0)").text(_.uniq(cases.map(c => c.patient_id)).length)
        $("#" + key + "_ROW").find("td:eq(1)").text(_.uniq(cases.filter(p => (p.description == "")).map(c => c.patient_id + "#" + c.stay_id)).length)
        $("#" + key + "_ROW").find("td:eq(2)").text(cases.filter(p => (p.description == "")).length)

        if (key == "HUG_SIMPLIFIED") {
            $("#" + key + "_ROW").find("td:eq(4)").text(tableData[key].episodes_count)
        } else {
            $("#" + key + "_ROW").find("td:eq(3)").text(tableData[key].episodes_count)
        }
    })


    //$("#" + algo.description + "_ROW").find("td:eq(1)").text(episodes.length)


}

function getEpsiodesForAllAglorithms(positive_hemocultures) {

    let algos = [{ name: "HUG", description: "HUG_SIMPLIFIED" },
        { name: "HUGV2", description: "HUGV2" } //,
        // { name: "PRAISE", description: "PRAISE" }
    ]

    let episodes_implementations = algos.map(function(algo) {
        let episodes = computeBSIEpisodes({
            implementation: algo.name
        }, deepCopy(positive_hemocultures))["episodes"];

        return {
            name: algo.description,
            episodes: episodes
        }
    })


    return episodes_implementations;
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