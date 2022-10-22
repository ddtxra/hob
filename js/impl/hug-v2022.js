function hug_implementation_v2022(parameters, positive_hemos) {

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



    function raise_error_if_more_than_one(array){
        if(array.length > 1){
            alert("There must be an error with this!")
            console.log(array);
        }

    }

    function filterBSICases(pos_hemocultures) {

        let episodes_to_investigate = {};

        pos_hemocultures.forEach(function(current_ph) {

            let patient_stay = "P-" + current_ph.patient_id + "-S-" + current_ph.stay_id;
            if (!episodes_to_investigate[patient_stay]) {
                episodes_to_investigate[patient_stay] = new EpisodeFlow(patient_stay, VALID_NEW_CASES_DAYS);
            }

            var patient_episode_flow = episodes_to_investigate[patient_stay];

            //If it is not a commensal or we don't know if it is one, we treat him as true BSI
//            if (current_ph.labo_commensal == "0" || current_ph.labo_commensal == "-1") {
                if (true) {

                //If it is empty push the first
                if (patient_episode_flow.isEmpty()) {
                   patient_episode_flow.createNewEpisodeFromPositiveHemoculture(current_ph);
                } else {

                    //Check first if there is already an episode on the same day and add it as a polymicrobial evidence in case it happens (no need to create a new episode)
                    var episode_on_same_day = patient_episode_flow.getEpisodeOnSameDay(current_ph) ;
                    if(episode_on_same_day.length > 0) {
                        raise_error_if_more_than_one(episode_on_same_day);
                        patient_episode_flow.addPolymicrobialEvidenceToExistingEpisode(current_ph, episode_on_same_day[0]);

                        var previous_episode_still_valid = patient_episode_flow.getStillValidEpisodeWithSameGerm(current_ph);
                        if(previous_episode_still_valid.length > 0) {
                            console.log("patient concerned " + patient_stay);
                            patient_episode_flow.addCopyStrainEvidenceToExistingEpisode(current_ph, previous_episode_still_valid[0])
                            patient_episode_flow.combinePolymicrobialEpisodeWithCopyStrain(episode_on_same_day[0], previous_episode_still_valid[0])
                        } 

                        //check if it can be merged with copy strain!

                    } else {

                        var episodes_still_valid_with_same_germ = patient_episode_flow.getStillValidEpisodeWithSameGerm(current_ph, VALID_NEW_CASES_DAYS);
                        if(episodes_still_valid_with_same_germ.length > 0) {
                            patient_episode_flow.addCopyStrainEvidenceToExistingEpisode(current_ph, episodes_still_valid_with_same_germ[0])
                            raise_error_if_more_than_one(episodes_still_valid_with_same_germ);

                        } else {

                            patient_episode_flow.createNewEpisodeFromPositiveHemoculture(current_ph);

                        }

                        
                    } 

                }
                    

            }/* else if (current_ph.labo_commensal == "1") {


                //TODO remove me!
                current_ph.distinct_germs = [];

                if (!common_skin_commensals[patient_stay]) {
                    common_skin_commensals[patient_stay] = [];
                }

                let commensals_for_patient_same_germ = common_skin_commensals[patient_stay].filter(c => c.labo_germ_name == current_ph.labo_germ_name);
                let last_commensals_for_patient = commensals_for_patient_same_germ[commensals_for_patient_same_germ.length - 1];
                let valid_commensal_cases = common_skin_commensals[patient_stay].filter(c => c.used_for_cases);
                let last_valid_commensal_case = valid_commensal_cases[valid_commensal_cases.length - 1];
                let existing_case_in_same_day = patient_episode_flow.getEpisodeOnSameDay(current_ph).length > 0;

                //if there is not a valid commensal used as true pathogene yet OR
                // that the last
                if ((!last_valid_commensal_case || ((current_ph.days - last_valid_commensal_case.days) > VALID_NEW_CASES_DAYS)) && !existing_case_in_same_day) {


                    let existing_case_in_same_day_of_last_commensal = last_commensals_for_patient ? episodes_to_investigate[patient_stay].episodes.map(c => c.days).indexOf(last_commensals_for_patient.days) != -1 : false;
                    if (last_commensals_for_patient && !last_commensals_for_patient.used_for_cases && !existing_case_in_same_day_of_last_commensal) {

                        //Check the time between last commensal and this one
                        let time1 = moment(last_commensals_for_patient.labo_sample_date);
                        let time2 = moment(current_ph.labo_sample_date);
                        let diff = time2.diff(time1, 'days');

                        //Should be more than one hour and less than 3*24 hours (3 days)
                        if (diff >= 1 && diff <= DAYS_TO_AGG_COMMENSALS_TOGETHER) {
                            last_commensals_for_patient.used_for_cases = true;
                            //Add the commensal to the cases
                            patient_episode_flow.createNewEpisodeFromPositiveHemoculture(last_commensals_for_patient);
                        }
                    }
                }
                //Add the commensal to the list
                common_skin_commensals[patient_stay].push(current_ph);
            }*/
        });


        return episodes_to_investigate;
    }


    function mapKeysToArray(gpsd) {
        let all_cases = [];
        Object.keys(gpsd).forEach(patient_stays => {
            let cases_for_patient = gpsd[patient_stays].episodes;
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

    var cases = mapKeysToArray(casesMap)


    var data = {
        episodes: cases
    }

    return data;



}