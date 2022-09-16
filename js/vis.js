function updateVis(positive_hemos, episodes, expected) {

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


    function addFeature(ft, series, epi) {
        var lines = _.groupBy(series, epi ? "patient_id" : function(p) { return p.patient_id + "@" + p.stay_id });
        Object.keys(lines).sort().forEach(pat => {

            var pos_hem = lines[pat];
            var feature = pos_hem.map(function(ph) {
                var day_of_year = ph.labo_sample_datetime_moment.dayOfYear();
                var label = ((epi && ph.labo_polymicrobial_germs) ? ph.labo_polymicrobial_germs.join("+") : ph.labo_germ_name);
                return {
                    x: day_of_year,
                    y: day_of_year + 0.999,
                    description: label,
                    color: getColorFromPalette(label)
                }
            });

            ft.addFeature({
                data: feature,
                name: pat,
                className: "test",
                type: "rect" // ['rect', 'path', 'line']
            });
        });
    }


    const gridDiv = document.querySelector('#pos_hemo_grid');
    const columnDefsForPosHemos = Object.keys(positive_hemos[0]).map(function(k) { return { field: k, width: 200 } });

    new agGrid.Grid(gridDiv, {
        columnDefs: columnDefsForPosHemos,
        rowData: positive_hemos
    });

    var timestamps = (positive_hemocultures.map(p => p.labo_sample_datetime_timestamp));
    var fv_length = Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 1000 / 60 / 60 / 24) + 7;

    const columnDefsForEpisodes = Object.keys(episodes[0]).map(function(k) { return { field: k, width: 200 } }).filter(f => !f.field.endsWith("moment") && !f.field.endsWith("timestamp"));
    const episodes_grid = document.querySelector('#episodes_grid');

    new agGrid.Grid(episodes_grid, {
        columnDefs: columnDefsForEpisodes,
        rowData: episodes
    });


    //addFeature(new FeatureViewer.createFeature(fv_length, "#fv_pos_hemo", fvParams), positive_hemocultures);
    drawHighcharts("fv_pos_hemo", positive_hemocultures)

    //addFeature(new FeatureViewer.createFeature(fv_length, "#fv_episodes", fvParams), episodes, true);
    drawHighcharts("fv_episodes", episodes)

    if (expected && expected.data && expected.data.length > 0) {
        drawHighcharts("fv_expected", episodes)

        //addFeature(new FeatureViewer.createFeature(fv_length, "#fv_expected", fvParams), prepareData(expected.data), true);
    }


    showRawTab();



    $("#rawDataTab").text("Raw data (" + positive_hemocultures.length + " positive hemocultures)");
    $("#computedDataTab").text("Computed episodes (" + episodes.length + " episodes)");
    if (expected && expected.description) {
        $("#explanation_expected").html(expected.description);
    } else {
        $("#explanation_expected").html("");
    }
}