function updateVis(positive_hemocultures, episodes) {

    console.log(episodes);
    var columnDefs = [
        { "field": "labo_id", width: 200},
        { "field": "patient_id", width: 200 },
        { "field": "encounter_id", width: 200 },
        { "field": "labo_sample_date", width: 200 },
        { "field": "labo_germ_name", width: 200 },
        { "field": "labo_commensal", width: 200 }]

    // let the grid know which columns and what data to use

    var fvParams = {
        showAxis: true,
        showSequence: true,
        brushActive: true, //zoom
        toolbar: true, //current zoom & mouse position
        //bubbleHelp: true,
        zoomMax: 1 //define the maximum range of the zoom
    };

    $("#fv_pos_hemo").empty();
    $("#fv_episodes").empty();
    $('#myGrid').empty();

    const gridDiv = document.querySelector('#myGrid');
    //$("#myGrid").empty();
    var ag = new agGrid.Grid(gridDiv, {
        columnDefs: columnDefs,
        rowData: positive_hemocultures
    });

    var ft_pos_hemo = new FeatureViewer.createFeature(50, "#fv_pos_hemo", fvParams);
    var ft_episodes = new FeatureViewer.createFeature(50, "#fv_episodes", fvParams);

    function addFeature(ft, series){
        var patients = _.groupBy(series, "patient_id");
        Object.keys(patients).forEach(pat => {
    
            var pos_hem = patients[pat];
            var feature = pos_hem.map(function(ph) {
                var day_of_year = ph.labo_sample_datetime_moment.dayOfYear();
                return {
                    x: day_of_year,
                    y: day_of_year,
                    description: ph.labo_germ_name + "@" + ph.encounter_id,

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

    addFeature(ft_pos_hemo, positive_hemocultures);
    addFeature(ft_episodes, episodes);

}