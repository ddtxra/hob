function updateVis(patient_id, positive_hemos, expected) {


    var episodes_hug_v0 = computeBSIEpisodes({
        implementation: "HUG" //HUGV0
    }, positive_hemos)["episodes"];


    var episodes_hug_v2 = computeBSIEpisodes({
        implementation: "HUGV2" //HUGV2
    }, positive_hemos)["episodes"];

    var episodes_praise = computeBSIEpisodes({
        implementation: "HUGV2" //PRAISE
    }, positive_hemos)["episodes"];


    console.log(episodes_hug_v0);
    
    var positive_hemocultures = prepareData(deepCopy((positive_hemos)));


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
                var label = ((false && ph.labo_polymicrobial_germs) ? ph.labo_polymicrobial_germs.join("+") : ph.labo_germ_name);
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

    function addEpisodes(ft, episodes, name){

        var feature_episodes = episodes.map(function(ph) {
            var day_of_year = ph.labo_sample_datetime_moment.dayOfYear();
            var label = ((true && ph.labo_polymicrobial_germs) ? ph.labo_polymicrobial_germs.join("+") : ph.labo_germ_name);
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

    var div_id =  "fv_pos_hemo_" + patient_id;

    $('#fv_pos_hemo').append($('<span>' + patient_id + '</span><div style="margin-top: -35px;" id=' + div_id+ '></div>'));
    var feat_v = new FeatureViewer.createFeature(fv_length, "#" + div_id, fvParams);

    addPositiveHemocultures(feat_v, positive_hemocultures);
    addEpisodes(feat_v, episodes_hug_v0, "episodes HUG_v0");
    addEpisodes(feat_v, episodes_hug_v2, "episodes HUG_v2");
    addEpisodes(feat_v, episodes_praise, "episodes praise");
    
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