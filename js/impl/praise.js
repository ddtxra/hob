function praise_implementation(parameters, positive_hemos) {

    var positive_hemocultures = prepareData(deepCopy(positive_hemos));

    var REPEAT_INTERVAL_DAYS_TRUE_PATHOEGENES = parameters.valid_new_cases_days ? parameters.valid_new_cases_days : 14;
    var REPEAT_INTERVAL_DAYS_COMMENSALS = parameters.valid_new_cases_hours ? parameters.valid_new_cases_hours : 3;

    var date_str = "2021-01-02";
    var date = moment(date_str);

    return {
        episodes: []
    }

}