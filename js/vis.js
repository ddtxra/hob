function updateVis(patient_id, description, positive_hemos, episodes_implementations, expected) {


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
        var lines = _.groupBy(positive_hemocultures, function(p) { return p.patient_id + "@" + p.stay_id });
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

    function addEpisodes(ft, episodes, name) {

        let feature_episodes = episodes.map(function(ph) {
            let day_of_year = ph.labo_sample_datetime_moment.dayOfYear();
            let label = ((ph.distinct_germs) ? ph.distinct_germs.join("+") : ph.labo_germ_name);
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

    var div_id = "fv_pos_hemo_" + patient_id;

    $('#fv_pos_hemo').append($('<div class="panel panel-default"><p>' + patient_id + ': ' + description + '</p><div style="margin-top: -35px;" id=' + div_id + '></div></div>'));
    var feat_v = new FeatureViewer.createFeature(fv_length, "#" + div_id, fvParams);

    addPositiveHemocultures(feat_v, positive_hemocultures);

    feat_v.addFeature({
        data: [{ x: 1, y: fv_length }],
        name: "EPISODES",
        description: "paf",
        color: "green",
        type: "path" // ['rect', 'path', 'line']
    });

    episodes_implementations.forEach(function(epi) {
        addEpisodes(feat_v, epi.episodes, epi.name);
    });

    //addFeature(new FeatureViewer.createFeature(fv_length, "#fv_classification", fvParams), episodes, true);

    /*if (expected && expected.data && expected.data.length > 0) {
        addFeature(new FeatureViewer.createFeature(fv_length, "#fv_expected", fvParams), prepareData(expected.data), true);
    }*/

    if (expected && expected.description) {
        $("#explanation_expected").html(expected.description);
    } else {
        $("#explanation_expected").html("");
    }
}