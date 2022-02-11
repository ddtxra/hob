function updateVis(jqueryDiv, positive_hemocultures, episodes) {

    jqueryDiv.empty();
    var ft = new FeatureViewer.createFeature(365, '#fv1', {
        showAxis: true,
        showSequence: true,
        brushActive: true, //zoom
        toolbar: true, //current zoom & mouse position
        //bubbleHelp: true,
        zoomMax: 50 //define the maximum range of the zoom
    });


    var patients = _.groupBy(positive_hemocultures, "patient_id");
    Object.keys(patients).forEach(pat => {

        var pos_hem = patients[pat];
        var feature = pos_hem.map(function(ph) {
            var day_of_year = ph.labo_sample_datetime_moment.dayOfYear();
            return {
                x: day_of_year,
                y: day_of_year,
                color: getColorFromPalette(ph.labo_germ_name)
            }
        });

        ft.addFeature({
            data: feature,
            name: pat,
            type: "rect" // ['rect', 'path', 'line']
        });

    });

}