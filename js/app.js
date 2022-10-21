$.get("static/cases.tsv", function(tsv_cases) {
    //$.get("static/data.tsv", function(tsv_cases) {

    //$.get("static/cases.tsv", function(tsv_cases) {
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
        let number_distinct_patients = _.uniq(_.flatMap(scenarios, s => s.positive_hemocultures).map(c => c.patient_id)).length;
        let number_of_stays = _.uniq(_.flatMap(scenarios, s => s.positive_hemocultures).map(c => c.patient_id + "#" + c.stay_id)).length;
        let number_positive_hemocultures = _.flatMap(scenarios, s => s.positive_hemocultures).length;

        $("#" + key + "_ROW").find("td:eq(0)").text(number_distinct_patients)
        $("#" + key + "_ROW").find("td:eq(1)").text(number_of_stays);
        $("#" + key + "_ROW").find("td:eq(2)").text(number_positive_hemocultures)

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
    let lines = cases_tsv.replace(/\r/gm, '').split("\n").filter(l => l.trim().length != 0);
    let column_names = lines[0].split(separator);

    ["patient_id", "stay_id", "labo_sample_date", "labo_germ_name", "labo_commensal"].forEach(function(col) {
        if (column_names.indexOf(col) == -1) {
            let msg = "Can't find " + col + " in tsv file";
            window.alert(msg);
            throw Error(msg);
        }
    })

    let scenarios = [];

    if (cases_tsv.indexOf(">") != -1) {

        let current_scenario = new Scenario();
        scenarios.push(current_scenario);

        for (let current_line = 1; current_line < lines.length; current_line++) {

            let content = lines[current_line].trim();
            if (content.startsWith(">")) {
                current_scenario = new Scenario();
                scenarios.push(current_scenario);
            } else if (content.startsWith("#")) {

                var comment = content.replace("#", "").trim();
                if (comment.startsWith("!")) {
                    comment = "<span style='color:red'>" + comment.slice(1, ).trim() + "</span>";
                }

                if (comment.startsWith("?")) {
                    comment = "<span style='color:orange'>" + comment.slice(1, ).trim() + "</span>";
                }

                current_scenario.addDescription(comment);

            } else {

                let values = content.split(separator);
                let object = {};
                for (let c = 0; c < column_names.length; c++) {
                    let col_name = column_names[c];
                    object[col_name] = values[c];
                }

                let ph = new PositiveHemoculture(object.patient_id, object.stay_id, object.labo_sample_date, object.labo_germ_name, object.labo_commensal);
                current_scenario.addPositiveHemoculture(ph);

            }

        }

    } else {

        var data = [];
        for (let current_line = 1; current_line < lines.length; current_line++) {
            let content = lines[current_line].trim();
            let values = content.split(separator);
            let object = {};
            for (let c = 0; c < column_names.length; c++) {
                let col_name = column_names[c];
                object[col_name] = values[c];
            }
            data.push(new PositiveHemoculture(object.patient_id, object.stay_id, object.labo_sample_date, object.labo_germ_name, object.labo_commensal));
        }

        //var dataGroupedByStays = _.groupBy(data, d => d.patient_id + "@" + d.stay_id);
        var dataGroupedByStays = _.groupBy(data, d => d.patient_id);

        Object.keys(dataGroupedByStays).forEach(function(key) {
            let scenario = new Scenario();
            scenario.addDescription(key);
            dataGroupedByStays[key].forEach(function(ph) {
                scenario.addPositiveHemoculture(ph)
            });
            scenarios.push(scenario);
        })

    }

    return scenarios;
}