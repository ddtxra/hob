function hug_implementation_v2023(parameters, positive_hemos) {

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



    function raise_error_if_more_than_one(array) {
        if (array.length > 1) {
            alert("There must be an error with this!")
            console.log(array);
        }

    }

    function identifiyEpisodes(pos_hemocultures) {

        var episodes = [];

        var pos_hemocultures_by_patient_stay = _.groupBy(pos_hemocultures, function(p) { return "P-" + p.patient_id + "-S-" + p.stay_id });
        Object.keys(pos_hemocultures_by_patient_stay).forEach(function(patient_stay) {
            //groupe par patient
            var episodes_for_patient = [];
            var pos_hemocultures_for_patient_by_days = _.groupBy(pos_hemocultures_by_patient_stay[patient_stay], "labo_sample_date");
            Object.keys(pos_hemocultures_for_patient_by_days).sort( /* TODO */ ).forEach(function(day) {
                //puis groupe par jour
                var pos_hemocultures_for_patient_for_single_days = pos_hemocultures_for_patient_by_days[day];
                var first_pos_hemoculture_for_day = pos_hemocultures_for_patient_for_single_days[0];
                var episode = new Episode(first_pos_hemoculture_for_day);
                // si il y a plus que 1 germe dans 1 jour il est possible qu'il y a des polymcrobiens
                if (pos_hemocultures_for_patient_for_single_days.length > 1) {
                    // si ces 2 germes sont des germes différents il y a des polymicrobiens
                    var posHemoDifferentGerm = pos_hemocultures_for_patient_for_single_days.filter(ph => ph.labo_germ_name != first_pos_hemoculture_for_day.labo_germ_name);
                    posHemoDifferentGerm.forEach(function(phdg) {
                        episode.addPolymicrobialEvidence(phdg);
                    })

                    //si il y a le meme germe le meme jour on le rajoute comme copy strain
                    var posHemoSameGerm = pos_hemocultures_for_patient_for_single_days.filter(ph => ph.labo_germ_name == first_pos_hemoculture_for_day.labo_germ_name);
                    posHemoSameGerm.forEach(function(phsg) {
                        if (phsg != first_pos_hemoculture_for_day) {
                            episode.addCopyStrainEvidence(phdg);
                        }
                    })

                }
                episodes_for_patient.push(episode);

            })


            consolidated_episodes_for_patient = consolidateEpisodesBasedOnNonRepatedIntervalsRecursively(episodes_for_patient);
            episodes = episodes.concat(consolidated_episodes_for_patient)

        })

        return episodes;

    }

    function consolidateEpisodesBasedOnNonRepatedIntervalsRecursively(episodes) {
        var consolidated_count = episodes.length;
        var test_episodes = episodes;
        do {
            var consolidated_episodes = consolidateEpisodesBasedOnNonRepatedIntervals(test_episodes);
            fullRescanIfOptimisation = consolidated_episodes.length < consolidated_count;
            if (fullRescanIfOptimisation) {
                test_episodes = consolidated_episodes;
                consolidated_count = consolidated_episodes.length;
            }

        } while (fullRescanIfOptimisation);

        return consolidated_episodes;

    }

    function consolidateEpisodesBasedOnNonRepatedIntervals(episodes) {

        var consolidated_episodes = [];

        episodes.forEach(function(current_episode) {
            //se il n'y a pas encore d'episode on rajoute a l array
            if (consolidated_episodes.length == 0) {
                consolidated_episodes.push(current_episode);
            } else {
                //si il y a déjà un épisode antérieur, 
                // on va regarder pour les evidences de l'episode courant
                // si il y a une évidence antérieur avec le même germe 

                var processedEpisode = false;
                current_episode.distinct_germs.forEach(function(germ) {

                    consolidated_episodes.forEach(function(consolidated_episode) {

                        //si on a un episode consolidé avec le meme germe dans l'interval de temps des 14 jours
                        if (!processedEpisode && consolidated_episode.containsGerm(germ) && (current_episode.days - consolidated_episode.days) < VALID_NEW_CASES_DAYS) {
                            // add all evidences from the current episode to the consolidated (even the ones with different germ)
                            processedEpisode = true;
                            current_episode.evidences.forEach(function(epi) {
                                consolidated_episode.addEvidenceBasedOnNonRepeatInterval(epi)
                            })
                        }
                    })
                })
                if (!processedEpisode) {
                    processedEpisode = true;
                    consolidated_episodes.push(current_episode);
                }
            }
        })
        return consolidated_episodes;
    }




    if (positive_hemocultures.length > 0) {
        var episodes = identifiyEpisodes(positive_hemocultures);
        return {
            episodes: episodes
        }
    } else {
        return {
            episodes: []
        }

    }

    //    return data;



}