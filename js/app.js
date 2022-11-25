$.get("static/cases.tsv", function(tsv_cases) {
    //$.get("static/cases.tsv", function(tsv_cases) {

    //$.get("static/cases.tsv", function(tsv_cases) {
    $("#dataText").val(tsv_cases);
    let json_scenarios = parseTSVAndConvertToJSON(tsv_cases, "\t");
    console.log(json_scenarios);
    showScenarios(json_scenarios);
});

var ALGOS = ["HUG", "HUG_v2023", "PRAISE"];


$("#compute").click(function() {
    let json_scenarios = parseTSVAndConvertToJSON($("#dataText").val(), "\t");
    showScenarios(json_scenarios);
});

function showScenarios(scenarios) {

    $('#description').html("");
    $("#fv_pos_hemo").empty();
    $("#fv_episodes").empty();
    $("#fv_expected").empty();

    var scenarioCounter = 0;

    scenarios.forEach(function(s) {

        ALGOS.forEach(function(algo) {
            let episodes = computeBSIEpisodes({ implementation: algo }, deepCopy(s.positive_hemocultures))["episodes"];
            s.addEpisodeComputation(algo, episodes);
        })

        if (s.positive_hemocultures.length > 0) {
            updateVis(scenarioCounter++, s.description, s.positive_hemocultures, s.episodes_computed, s.episodes_expected);
        }

    })

    //console.log(scenarios);


    ALGOS.forEach(key => {
        let number_distinct_patients = _.uniq(_.flatMap(scenarios, s => s.positive_hemocultures).map(c => c.patient_id)).length;
        let number_of_stays = _.uniq(_.flatMap(scenarios, s => s.positive_hemocultures).map(c => c.patient_id + "#" + c.stay_id)).length;
        let number_positive_hemocultures = _.flatMap(scenarios, s => s.positive_hemocultures).length;

        $("#" + key + "_ROW").find("td:eq(0)").text(number_distinct_patients)
        $("#" + key + "_ROW").find("td:eq(1)").text(number_of_stays);
        $("#" + key + "_ROW").find("td:eq(2)").text(number_positive_hemocultures)

        let number_episodes = _.flatMap(scenarios, s => s.episodes_computed[key]).length;

        $("#" + key + "_ROW").find("td:eq(3)").text(number_episodes)
    })


    //$("#" + algo.description + "_ROW").find("td:eq(1)").text(episodes.length)


}

function getEpsiodesForAllAglorithms(positive_hemocultures) {


    let episodes_implementations = ALGOS.map(function(algo) {
        let episodes = computeBSIEpisodes({
            implementation: algo
        }, deepCopy(positive_hemocultures))["episodes"];

        return {
            name: algo,
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

        var expected_episodes = [];


        for (let current_line = 1; current_line < lines.length; current_line++) {

            let content = lines[current_line].trim();
            if (content.startsWith(">")) {
                var expected_line = false;
                expected_episodes = [];

                current_scenario = new Scenario();
                scenarios.push(current_scenario);
            } else if (content.startsWith("#")) {

                var comment = content.replace("#", "").trim();
                if (comment.startsWith("!")) {
                    expected_line = false;
                    comment = "<span style='color:red'>" + comment.slice(1, ).trim() + "</span>";
                }

                if (comment.startsWith("?")) {
                    expected_line = false;
                    comment = "<span style='color:orange'>" + comment.slice(1, ).trim() + "</span>";
                }

                if (!expected_line && comment.startsWith("expected")) {
                    expected_line = true; //première ligne
                } else if (comment.startsWith("expected")) {
                    var expectedValues = comment.split("\t");

                    console.log(comment);
                    var expected_epi = {
                        algo: expectedValues[0].split(".")[1],
                        patient_id: expectedValues[1],
                        episode_date: expectedValues[2],
                        distinct_germs_label: expectedValues[3],
                    }

                    if (typeof expected_epi.patient_id != "undefined") {
                        expected_episodes.push(expected_epi);
                    }
                    expected_episodes_by_algo = _.groupBy(expected_episodes, "algo");

                    current_scenario.setEpisodesExpectedByAlgo(expected_episodes_by_algo)



                } else {
                    current_scenario.addDescription(comment);
                }


            } else {

                var expected_line = false;


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

        var expected_line = false;

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