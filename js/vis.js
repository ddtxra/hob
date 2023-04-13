function updateVis(scenario_id, description, positive_hemos, episodes_computed, episodes_expected) {

    var positive_hemocultures = deepCopy((positive_hemos));

    // let the grid know which columns and what data to use
    var fvParams = {
        showAxis: true,
        showSequence: true,
        brushActive: true, //zoom
        toolbar: true, //current zoom & mouse position
        //bubbleHelp: true,
        zoomMax: 1 //define the maximum range of the zoom
    };

    function addPositiveHemocultures(ft, positive_hemocultures) {
        var lines = _.groupBy(positive_hemocultures, function(p) { return p.patient_id + "@" + p.stay_begin_date });
        Object.keys(lines).sort().forEach(pat => {
            var pos_hem = lines[pat];
            var feature_pos_hemo = pos_hem.map(function(ph) {
                var day_of_year = ph.labo_sample_datetime_moment.dayOfYear();
                var label = ((false && ph.distinct_germs) ? ph.distinct_germs.join("+") : ph.labo_germ_name);
                return {
                    x: day_of_year,
                    y: day_of_year + 0.999,
                    description: label,
                    color: getColorFromPalette(label)
                }
            });


            ft.addFeature({
                data: feature_pos_hemo,
                name: pat,
                className: "test",
                type: "rect" // ['rect', 'path', 'line']
            });

        });

    }

    function addExpected(ft, expected, name) {

        let feature_episodes = expected.map(function(epi) {
            let day_of_year = moment(epi.episode_date, "YYYY-MM-DD").dayOfYear();
            let label = epi.distinct_germs_label;
            return {
                x: day_of_year,
                y: day_of_year + 0.999,
                description: label,
                color: getColorFromPalette(label)
            }
        });

        ft.addFeature({
            data: feature_episodes,
            name: name,
            className: "test",
            type: "rect" // ['rect', 'path', 'line']
        });
    }

    function addEpisodes(ft, episodes, name) {

        let feature_episodes = episodes.map(function(epi) {
            let day_of_year = epi.labo_sample_datetime_moment.dayOfYear();
            let label = ((epi.distinct_germs) ? epi.distinct_germs.join("+") : epi.labo_germ_name);
            if (typeof epi.getClassification !== "undefined") {
                label += " | " + epi.getClassification()
                if (epi.evidences) {
                    label += epi.evidences.length
                }
            }

            return {
                x: day_of_year,
                y: day_of_year + 0.999,
                description: label,
                color: getColorFromPalette(label)
            }
        });

        ft.addFeature({
            data: feature_episodes,
            name: name,
            className: "test",
            type: "rect" // ['rect', 'path', 'line']
        });
    }

    var timestamps = (positive_hemocultures.map(p => p.labo_sample_datetime_timestamp));
    var fv_length = Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 1000 / 60 / 60 / 24) + 7;
    //var fv_length = 30;
    var fv_length = Math.max(fv_length, 10);

    var div_id = "fv_pos_hemo_" + scenario_id;

    var expected_txt = "";

    if (episodes_expected && Object.keys(episodes_expected).length > 0) {

        Object.keys(episodes_computed).forEach(function(algo) {

            if (episodes_expected[algo]) {

                var computed = episodes_computed[algo];
                var expected = episodes_expected[algo];

                var computedOnlyComparableFields = computed.map(g => {
                    return {
                        patient_id: g.patient_id,
                        date: g.labo_sample_date,
                        germs: g.distinct_germs_label()
                    }
                })


                var expectednlyComparableFields = expected.map(g => {
                    return {
                        patient_id: g.patient_id,
                        date: g.episode_date,
                        germs: g.distinct_germs_label
                    }
                })

                computed_str = JSON.stringify(computedOnlyComparableFields);
                expected_str = JSON.stringify(expectednlyComparableFields);

                var comparison = (computed_str == expected_str);
                expected_txt += comparison ? "<span style='color:green'><br>OK for " + algo + "</>" : "<span style='color:red'><br>NOT_OK for " + algo + "<br><ul>computed (" + computedOnlyComparableFields.length + "): " + computed_str + "<br></ul><ul>expected (" + expectednlyComparableFields.length + "): " + expected_str + " </ul></>";
            }
        })

    }

    $('#fv_pos_hemo').append($('<div class="panel panel-default"><br><h3>' + positive_hemocultures[0].patient_id + '</h3><p>' + description + '</p><div style="margin-top: -35px;" id=' + div_id + '></div><i>' + expected_txt + '</i></div>'));
    var feat_v = new FeatureViewer.createFeature(fv_length, "#" + div_id, fvParams);


    feat_v.addFeature({
        data: [{ x: 1, y: fv_length }],
        name: "POSITIVE HEMO",
        description: "paf",
        color: "black",
        type: "path" // ['rect', 'path', 'line']
    });

    addPositiveHemocultures(feat_v, positive_hemocultures);




    feat_v.addFeature({
        data: [{ x: 1, y: fv_length }],
        name: "COMP. EPISODES",
        description: "paf",
        color: "green",
        type: "path" // ['rect', 'path', 'line']
    });

    Object.keys(episodes_computed).forEach(function(key) {
        addEpisodes(feat_v, episodes_computed[key], key);
    });



    if (episodes_expected && Object.keys(episodes_expected).length > 0) {

        feat_v.addFeature({
            data: [{ x: 1, y: fv_length }],
            name: "EXPECTED EPIS.",
            description: "paf",
            color: "blue",
            type: "path" // ['rect', 'path', 'line']
        });


        Object.keys(episodes_expected).forEach(function(key) {
            addExpected(feat_v, episodes_expected[key], key);
        });
    }

    //addFeature(new FeatureViewer.createFeature(fv_length, "#fv_classification", fvParams), episodes, true);

    /*if (episodes_expected && episodes_expected.data && episodes_expected.data.length > 0) {
        addFeature(new FeatureViewer.createFeature(fv_length, "#fv_episodes_expected", fvParams), prepareData(episodes_expected.data), true);
    }*/


    $("#explanation_episodes_expected").html("pifpaf");
    if (episodes_expected && episodes_expected.description) {
        $("#explanation_episodes_expected").html(episodes_expected.description);
    } else {
        $("#explanation_episodes_expected").html("");
    }
}