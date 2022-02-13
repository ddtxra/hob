function hug_implementation(parameters, positive_hemocultures) {

    var REPEAT_INTERVAL_DAYS_TRUE_PATHOEGENES = parameters.valid_new_cases_days ? parameters.valid_new_cases_days : 14;
    var REPEAT_INTERVAL_DAYS_COMMENSALS = parameters.valid_new_cases_hours ? parameters.valid_new_cases_hours : 3;

    var parameters_copy = JSON.parse(JSON.stringify(parameters));

    function keyToGroupEvidences(ep) {
        return ep.patient_id + ep.encounter_id 
    }

    function keyToGroupEpisodes(ep) {
        return ep.patient_id + ep.encounter_id + ep.labo_sample_date
    }

    /** Pour 1 patient donné on ne répéte le même germe si il arrive dans les 14 jours */
    function group_pos_hemoculture_by_episode_evidences(labs_with_positive_hemocultures, not_repeat_in_days) {
        var _episode_evidences = [];
        var pos_hem_group_by_germ = _.groupBy(labs_with_positive_hemocultures, "labo_germ_name");

        //group by germ first
        Object.keys(pos_hem_group_by_germ).forEach(function(germ) {
            var labs_for_germ = pos_hem_group_by_germ[germ];
            var pos_hem_group_by_germ_patient = _.groupBy(labs_for_germ, keyToGroupEvidences);

            //group by patient
            Object.keys(pos_hem_group_by_germ_patient).forEach(function(patient_germs) {
                var last_valid_pos_hem_for_patient = null;
                var labs_with_same_germ_for_patient = pos_hem_group_by_germ_patient[patient_germs];
                //make sure they are sorted
                var labs_with_same_germ_for_patient_sorted = _.sortBy(labs_with_same_germ_for_patient, "labo_sample_datetime_timestamp");
                labs_with_same_germ_for_patient_sorted.forEach(function(lab) {
                    //if no valid pos hemoculture before or if the result is bigger than 14 days
                    if (last_valid_pos_hem_for_patient == null || (lab.labo_sample_datetime_moment).diff(last_valid_pos_hem_for_patient.labo_sample_datetime_moment, "day") >= not_repeat_in_days) {
                        _episode_evidences.push(lab)
                        last_valid_pos_hem_for_patient = lab;
                    }
                })
            })
        })

        //sort at the end
        return _.sortBy(_episode_evidences, "labo_sample_datetime_timestamp");
    }

  

    function group_evidences_by_episode(_episode_evidences) {
        var episodes_group_by_patient = _.groupBy(_episode_evidences, keyToGroupEpisodes);
        var res = [];

        Object.keys(episodes_group_by_patient).forEach(function(epi_pat_cal_day) {
            var episodes_evi = episodes_group_by_patient[epi_pat_cal_day];
            var first_ep = _.sortBy(episodes_evi, "labo_sample_datetime_timestamp")[0];
            var obj = _.assign(first_ep);

            //TODO get first
            obj.labo_polymicrobial_germs = epi_pat_cal_day, "labo_germ_name";
            obj.labo_polymicrobial_count = obj.labo_polymicrobial_germs.length
            obj.evidences_count = episodes_evi.length

            res.push(obj);
        })

        function filterEpisodes(e) {
            if (parameters.start_date && parameters.end_date) {
                return moment(e.labo_sample_datetime_timestamp).isBetween(moment(parameters.start_date), moment(parameters.end_date))
            } else return true;
        }


        //ordenne et sur que les dates soient entre 
        return _.sortBy(res, "labo_sample_datetime_timestamp").filter(filterEpisodes);
        //return _.sortBy(res, "labo_sample_datetime_timestamp");

    }

    var positive_hemocultures_true_pathogenes = positive_hemocultures.filter(c => c.labo_commensal != "1" || c.labo_special_unit);

    //On prend les restants
    var positive_hemocultures_commensals = positive_hemocultures.filter(c => positive_hemocultures_true_pathogenes.map(l => l.labo_id).indexOf(c.labo_id) == -1)

    var episode_evidences_true_pathogenes = group_pos_hemoculture_by_episode_evidences(positive_hemocultures_true_pathogenes, REPEAT_INTERVAL_DAYS_TRUE_PATHOEGENES)
    var episode_evidences_commensals = group_pos_hemoculture_by_episode_evidences(positive_hemocultures_commensals, REPEAT_INTERVAL_DAYS_COMMENSALS)

    var episode_evidences = episode_evidences_true_pathogenes.concat(episode_evidences_commensals)
    var episodes = group_evidences_by_episode(episode_evidences)

    return {
        episodes: episodes,
        //episode_evidences: episode_evidences,
        episode_evidences_commensals: episode_evidences_commensals,
        episode_evidences_true_pathogenes: episode_evidences_true_pathogenes,
        positive_hemocultures_true_pathogenes: positive_hemocultures_true_pathogenes,
        positive_hemocultures_commensals: positive_hemocultures_commensals,
        positive_hemocultures: positive_hemocultures,
        parameters: parameters,
        parameters_copy: parameters_copy
    }


}