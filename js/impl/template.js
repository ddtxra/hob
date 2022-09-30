function template_implementation(parameters, positive_hemos) {

    var positive_hemocultures = deepCopy(positive_hemos);

    var date_str = "2021-01-02";
    var date = moment(date_str);

    return {
        episodes: [{
            "patient_id": "patient_test",
            "stay_id": "stay_test",
            "labo_sample_date": date.format("YYYY-MM-DD"),
            "labo_germ_name": "pathA",
            "labo_commensal": "0",
            "labo_sample_datetime_moment": date,
            "labo_sample_datetime_timestamp": date.valueOf(),
            "distinct_germs": [
                "pathA",
                "pathB"
            ],
            "distinct_germs_count": 1,
            "evidences_count": 1
        }]
    }


}