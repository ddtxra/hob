function hug_implementation_v2(parameters, positive_hemos) {

    var VALID_NEW_CASES_DAYS = parameters.valid_new_cases_days ? parameters.valid_new_cases_days : 14;
    var DAYS_TO_AGG_COMMENSALS_TOGETHER = 3;

    var positive_hemocultures = prepareData(deepCopy(positive_hemos));

    var date_str = "2021-01-02";
    var date = moment(date_str);

    positive_hemocultures.forEach(function(ph) {
        ph.days = moment(ph.labo_sample_date, "YYYY-MM-DD").diff(moment("2020-12-25", "YYYY-MM-DD"), "days")
    })

    function countEpisodes(pos_hemocultures) {
        var episodes = {};
        pos_hemocultures.forEach(function(ph) {
            //TODO check with Marie No if we need to filter by stay?
            var patient_stay = "P-" + ph.patient_id + "-S-" + ph.stay_id;
            if (!episodes[patient_stay]) {
                episodes[patient_stay] = [];
            }
            //If it is empty push the first
            if (episodes[patient_stay].length == 0) {
                episodes[patient_stay].push(ph);
            } else if (episodes[patient_stay].length > 0) {
                //If not empty let's find the previous case for the same germ and check if it is more than 14 days before
                let episodes_with_same_germ = episodes[patient_stay].filter(e => e.labo_germ_name == ph.labo_germ_name);
                let last_valid_case_with_same_germ = episodes_with_same_germ[episodes_with_same_germ.length - 1];
                let existing_case_in_same_day = episodes[patient_stay].filter(e => e.days == ph.days).length > 0;
                //If there is not a valid case for the same germ or that is more than 14 (VALID_NEW_CASES_DAYS) days we can add it)
                if ((!last_valid_case_with_same_germ || ((ph.days - last_valid_case_with_same_germ.days) > VALID_NEW_CASES_DAYS)) && !existing_case_in_same_day) {
                    episodes[patient_stay].push(ph);
                }
            }
        });
        return episodes;
    }


    function filterBSICases(pos_hemocultures) {

        let cases = {};
        let common_skin_commensals = {};

        pos_hemocultures.forEach(function(l) {

            let patient_stay = "P-" + l.patient_id + "-S-" + l.stay_id;
            if (!cases[patient_stay]) {
                cases[patient_stay] = [];
            }

            //If it is not a commansal or we don't know if it is one, we treat him as true BSI
            if (l.labo_commensal == "0" || l.labo_commensal == "-1") {
                //If it is empty push the first
                if (cases[patient_stay].length == 0) {

                    let epi = deepCopy(l);
                    epi.distinct_germs = [];
                    epi.ph_evidences = [];

                    epi.distinct_germs.push(l.labo_germ_name)

                    epi.distinct_germs = _.uniq(epi.distinct_germs);
                    epi.ph_evidences.push(l);
                    cases[patient_stay].push(epi);
                }
                //If not empty let's find the cases that are still valid (no more than 14 days)
                else if (cases[patient_stay].length > 0) {

                    var valid_cases = cases[patient_stay].filter(c => (l.days - c.days) <= VALID_NEW_CASES_DAYS);
                    console.log("still valid")
                    console.log(valid_cases);
                    valid_cases.forEach(function(epi) {
                        if (_.includes(epi.distinct_germs, l.labo_germ_name) || epi.days == l.days) {

                            epi.distinct_germs = _.uniq(epi.distinct_germs);
                            epi.ph_evidences.push(l);
                            cases[patient_stay].push(epi);

                        }
                    })


                    //TODO check if cases can not be merged !

                }


                /*                else if (cases[patient_stay].length > 0) {

                                    console.log("BOOOOOUM", l);

                                    let cases_with_same_germ = cases[patient_stay].filter(c => c.labo_germ_name == l.labo_germ_name);
                                    let last_valid_case_with_same_germ = cases_with_same_germ[cases_with_same_germ.length - 1];
                                    let existing_case_in_same_day = cases[patient_stay].filter(c => c.days == l.days).length > 0;

                                    //If there is not a valid case for the same germ or that is more than 14 (VALID_NEW_CASES_DAYS) days we can add it)
                                    if ((!last_valid_case_with_same_germ || ((l.days - last_valid_case_with_same_germ.days) > VALID_NEW_CASES_DAYS)) && !existing_case_in_same_day) {
                                        cases[patient_stay].push(l);
                                    }

                                    let cases_with_different_germ = cases[patient_stay].filter(c => c.labo_germ_name != l.labo_germ_name);
                                }*/

            } else if (l.labo_commensal == "1") {


                //TODO remove me!
                l.episode_germs = [];

                if (!common_skin_commensals[patient_stay]) {
                    common_skin_commensals[patient_stay] = [];
                }

                let commensals_for_patient_same_germ = common_skin_commensals[patient_stay].filter(c => c.labo_germ_name == l.labo_germ_name);
                let last_commensals_for_patient = commensals_for_patient_same_germ[commensals_for_patient_same_germ.length - 1];
                let valid_commensal_cases = common_skin_commensals[patient_stay].filter(c => c.used_for_cases);
                let last_valid_commensal_case = valid_commensal_cases[valid_commensal_cases.length - 1];
                let existing_case_in_same_day = cases[patient_stay].filter(c => c.days == l.days).length > 0;

                if (last_valid_commensal_case) {
                    console.log((l.days - last_valid_commensal_case.days))
                }

                //if there is not a valid commensal used as true pathogene yet OR
                // that the last
                if ((!last_valid_commensal_case || ((l.days - last_valid_commensal_case.days) > VALID_NEW_CASES_DAYS)) && !existing_case_in_same_day) {



                    let existing_case_in_same_day_of_last_commensal = last_commensals_for_patient ? cases[patient_stay].map(c => c.days).indexOf(last_commensals_for_patient.days) != -1 : false;
                    if (last_commensals_for_patient && !last_commensals_for_patient.used_for_cases && !existing_case_in_same_day_of_last_commensal) {

                        //Check the time between last commensal and this one
                        let time1 = moment(last_commensals_for_patient.labo_sample_date);
                        let time2 = moment(l.labo_sample_date);
                        let diff = time2.diff(time1, 'days');

                        //Should be more than one hour and less than 3*24 hours (3 days)
                        if (diff >= 1 && diff <= DAYS_TO_AGG_COMMENSALS_TOGETHER) {
                            last_commensals_for_patient.used_for_cases = true;
                            //Add the commensal to the cases
                            cases[patient_stay].push(last_commensals_for_patient);
                        }
                    }
                }
                //Add the commensal to the list
                common_skin_commensals[patient_stay].push(l);
            }
        });

        return cases;
    }


    function mapKeysToArray(gpsd) {
        let all_cases = [];
        Object.keys(gpsd).forEach(patient_stays => {
            let cases_for_patient = gpsd[patient_stays];
            all_cases = all_cases.concat(cases_for_patient);
        });
        return all_cases;
    }

    /*
    function addPolyMicrobialInformationToEpisode(pos_hemocultures, episode) {
        var episodeClone = deepCopy(episode);
        if (pos_hemocultures) {
            var pos_hemocultures_for_stay = pos_hemocultures.filter(ph => ph.stay_id == episodeClone.stay_id);
            var germs = _.uniq([]
                .concat(pos_hemocultures_for_stay.filter(ph => parseInt(ph.days) == parseInt(episodeClone.days)).map(e => e.labo_germ_name))
            );
            episodeClone.episode_germs_count = germs.length;
            episodeClone.episode_germs = germs;
        }
        return episodeClone;
    }


    function get_bsi_episodes_from_pos_hemocultures(pos_hemo_filtered) {
        return mapKeysToArray(countEpisodes(pos_hemo_filtered)).map(c => formatCase(c)).map((c => addPolyMicrobialInformationToEpisode(pos_hemo_filtered, c)))
    }


    var bsi_cases = mapKeysToArray(filterBSICases(labs_with_positive_hemocultures)).map(c => formatCase(c));
    var casesCommensals = get_bsi_episodes_from_pos_hemocultures(labs_with_positive_hemocultures.filter(ph => ph.labo_commensal == "1")) // pour les commensals
    var casesNotKnown = get_bsi_episodes_from_pos_hemocultures(labs_with_positive_hemocultures.filter(ph => ph.labo_commensal == "-1")) // pour ceux qu'on connait pas
    var casesKnownPathogen = get_bsi_episodes_from_pos_hemocultures(labs_with_positive_hemocultures.filter(ph => ph.labo_commensal == "0")) // pour ceux qui sont des TRUE BSI
    */


    var casesMap = filterBSICases(positive_hemocultures);

    console.log("paf");
    console.log(casesMap);

    var cases = mapKeysToArray(casesMap)

    console.log("Pos hemo");
    console.log(JSON.stringify(cases, null, 2))


    /*var exportData = {
        consolidated_episodes: consolidated_episodes,
        known_pathogenes_episodes: casesKnownPathogen,
        commensals_episodes: casesCommensals,
        not_classified_episodes: casesNotKnown,
        result: bsi_cases,
        positive_hemocultures: data["positive_hemocultures"],
        equipments: data["equipments"],
        distinct_equipments: data["distinct_equipments"],
        distinct_materials: data["distinct_materials"]
    }

    return exportData;*/

    var data = {
        episodes: cases
    }
    console.log(data);

    return data;



}