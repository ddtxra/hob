function hug_implementation_v2(parameters, positive_hemos) {

    var VALID_NEW_CASES_DAYS = parameters.valid_new_cases_days ? parameters.valid_new_cases_days : 14;
    var DAYS_TO_AGG_COMMENSALS_TOGETHER = 3;

    var positive_hemocultures = deepCopy(positive_hemos);

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



    function buildEpisodeFromPositiveHemoculture(pos_hemoculture) {
        //TODO pass just required attributes
        return new Episode(pos_hemoculture);
    }

    function filterBSICases(pos_hemocultures) {

        let episodes_to_investigate = {};
        let common_skin_commensals = {};

        pos_hemocultures.forEach(function(current_ph) {

            let patient_stay = "P-" + current_ph.patient_id + "-S-" + current_ph.stay_id;
            if (!episodes_to_investigate[patient_stay]) {
                episodes_to_investigate[patient_stay] = [];
            }

            //If it is not a commansal or we don't know if it is one, we treat him as true BSI
            if (current_ph.labo_commensal == "0" || current_ph.labo_commensal == "-1") {
                //If it is empty push the first
                if (episodes_to_investigate[patient_stay].length == 0) {

                    let epi = buildEpisodeFromPositiveHemoculture(current_ph);
                    episodes_to_investigate[patient_stay].push(epi);
                }

                //If not empty let's find the cases that are still valid (no more than 14 days)
                else if (episodes_to_investigate[patient_stay].length > 0) {

                    let current_ph_processed = false;
                    let episodes_to_investigate_still_open = episodes_to_investigate[patient_stay].filter(c => (current_ph.days - c.days) < VALID_NEW_CASES_DAYS);
                    episodes_to_investigate_still_open.forEach(function(episode_open) {
                        //If it is the same germ or it is the same day we add a copy strain evidence (same germ within the 14 days)
                        if (episode_open.containsGerm(current_ph.labo_germ_name)) {
                            episode_open.addCopyStrainEvidence(current_ph);
                            current_ph_processed = true;
                        }
                        //If it a different germ, but on the same day
                        else if (episode_open.labo_sample_date == current_ph.labo_sample_date) {
                            episode_open.addPolymicrobialEvidence(current_ph);
                            current_ph_processed = true;
                        }
                    })

                    if (!current_ph_processed) {
                        let epi = buildEpisodeFromPositiveHemoculture(current_ph);
                        episodes_to_investigate[patient_stay].push(epi);
                    }



                    //TODO check if cases can be merged !

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

            } else if (current_ph.labo_commensal == "1") {


                //TODO remove me!
                current_ph.distinct_germs = [];

                if (!common_skin_commensals[patient_stay]) {
                    common_skin_commensals[patient_stay] = [];
                }

                let commensals_for_patient_same_germ = common_skin_commensals[patient_stay].filter(c => c.labo_germ_name == current_ph.labo_germ_name);
                let last_commensals_for_patient = commensals_for_patient_same_germ[commensals_for_patient_same_germ.length - 1];
                let valid_commensal_cases = common_skin_commensals[patient_stay].filter(c => c.used_for_cases);
                let last_valid_commensal_case = valid_commensal_cases[valid_commensal_cases.length - 1];
                let existing_case_in_same_day = episodes_to_investigate[patient_stay].filter(c => c.days == current_ph.days).length > 0;

                /*if (last_valid_commensal_case) {
                    console.log((current_ph.days - last_valid_commensal_case.days))
                }*/

                //if there is not a valid commensal used as true pathogene yet OR
                // that the last
                if ((!last_valid_commensal_case || ((current_ph.days - last_valid_commensal_case.days) > VALID_NEW_CASES_DAYS)) && !existing_case_in_same_day) {


                    let existing_case_in_same_day_of_last_commensal = last_commensals_for_patient ? episodes_to_investigate[patient_stay].map(c => c.days).indexOf(last_commensals_for_patient.days) != -1 : false;
                    if (last_commensals_for_patient && !last_commensals_for_patient.used_for_cases && !existing_case_in_same_day_of_last_commensal) {

                        //Check the time between last commensal and this one
                        let time1 = moment(last_commensals_for_patient.labo_sample_date);
                        let time2 = moment(current_ph.labo_sample_date);
                        let diff = time2.diff(time1, 'days');

                        //Should be more than one hour and less than 3*24 hours (3 days)
                        if (diff >= 1 && diff <= DAYS_TO_AGG_COMMENSALS_TOGETHER) {
                            last_commensals_for_patient.used_for_cases = true;
                            //Add the commensal to the cases
                            episodes_to_investigate[patient_stay].push(buildEpisodeFromPositiveHemoculture(last_commensals_for_patient));
                        }
                    }
                }
                //Add the commensal to the list
                common_skin_commensals[patient_stay].push(current_ph);
            }
        });

        return episodes_to_investigate;
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
            episodeClone.distinct_germs_count = germs.length;
            episodeClone.distinct_germs = germs;
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

    //    console.log("paf");
    //    console.log(casesMap);

    var cases = mapKeysToArray(casesMap)

    //    console.log("Pos hemo");
    //    console.log(JSON.stringify(cases, null, 2))


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