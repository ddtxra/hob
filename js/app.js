//$.get("static/single_case.tsv", function(tsv_cases) {
$.get("static/cases.tsv", function(tsv_cases) {
    $("#dataText").val(tsv_cases);
    let json_scenarios = parseTSVAndConvertToJSON(tsv_cases, "\t");
    showScenarios(json_scenarios);
});


$("#compute").click(function() {
    let json_scenarios = parseTSVAndConvertToJSON($("#dataText").val(), "\t");
    showScenarios(json_scenarios);
});

function showScenarios(scenarios) {

    $('#description').html("");
    $("#fv_pos_hemo").empty();
    $("#fv_episodes").empty();
    $("#fv_expected").empty();

    let tableData = {};
    var scenarioCounter = 0;

    scenarios.forEach(function(s) {

        let episode_implementations = getEpsiodesForAllAglorithms(s.positive_hemocultures);
        updateVis(scenarioCounter++, s.description, s.positive_hemocultures, episode_implementations);

        //for each impl
        episode_implementations.forEach(impl => {
            if (!tableData[impl.name]) {
                tableData[impl.name] = { "episodes_count": 0 };
            }
            tableData[impl.name]["episodes_count"] = (tableData[impl.name]["episodes_count"] + impl.episodes.length);
        })
    })


    Object.keys(tableData).forEach(key => {
        $("#" + key + "_ROW").find("td:eq(0)").text(_.uniq(scenarios.map(c => c.patient_id)).length)
        $("#" + key + "_ROW").find("td:eq(1)").text(_.uniq(scenarios.filter(p => (p.description == "")).map(c => c.patient_id + "#" + c.stay_id)).length)
        $("#" + key + "_ROW").find("td:eq(2)").text(scenarios.filter(p => (p.description == "")).length)

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

    let scenarios = [];
    let current_scenario = new Scenario("");
    for (let current_line = 1; current_line < lines.length; current_line++) {


        if (lines[current_line].trim() == "") {
            continue;
        } else if (lines[current_line].startsWith("#")) {
            current_scenario = new Scenario(lines[current_line].replace("#", "").trim());
            scenarios.push(current_scenario);

        } else {
            let values = lines[current_line].split(separator);

            let object = {};
            for (let c = 0; c < column_names.length; c++) {
                let col_name = column_names[c];
                object[col_name] = values[c];
            }

            let ph = new PositiveHemoculture(object.patient_id, object.stay_id, object.labo_sample_date, object.labo_germ_name, object.labo_commensal);
            current_scenario.addPositiveHemoculture(ph);

        }

    }

    return scenarios;
}