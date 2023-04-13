class Scenario {

    constructor() {
        this.description = "";
        this.positive_hemocultures = [];
        this.episodes_computed = {};
        this.episodes_expected = {};
    }

    addPositiveHemoculture(positive_hemoculture) {
        return this.positive_hemocultures.push(positive_hemoculture);
    }

    addDescription(description) {
        this.description += description + "<br>";
    }

    addEpisodeComputation(algo_name, episodes) {
        this.episodes_computed[algo_name] = episodes;
    }

    setEpisodesExpectedByAlgo(episodes_by_algo) {
        this.episodes_expected = episodes_by_algo;
    }

}


/*class EpisodeFlow {

    constructor(id, valid_days, episodes) {
        this.id = id;
        this.episodes = episodes ? episodes : [];
        this.valid_days = valid_days ? valid_days : 14;
    }


    createNewEpisodeFromPositiveHemoculture(pos_hemoculture) {
        this.episodes.push(new Episode(pos_hemoculture));
    }

    isEmpty() {
        return this.episodes.length == 0;
    }

    getValidEpisodesForPositiveHemoculture(pos_hemoculture) {
        return this.episodes.filter(e => (pos_hemoculture.labo_sample_date - e.labo_sample_date) < this.valid_days)
    }

    getStillValidEpisodeWithSameGerm(pos_hemoculture) {
        return this.getValidEpisodesForPositiveHemoculture(pos_hemoculture).filter(c => (pos_hemoculture.labo_germ_name == c.labo_germ_name))
    }

    getEpisodeOnSameDay(pos_hemoculture) {
        return this.episodes.filter(c => (pos_hemoculture.labo_sample_date.format("YYYY-MM-DD") == c.labo_sample_date.format("YYYY-MM-DD")))
    }

    //check whether there is already an episode on same day
    getEpisodeWithEvidencesOnSameDay(pos_hemoculture) {
        return this.episodes.filter(function(e) {
            return e.evidences.filter(c => (pos_hemoculture.labo_sample_date.format("YYYY-MM-DD") == c.days.format("YYYY-MM-DD")) > 0)
        })
    }

    addPolymicrobialEvidenceToExistingEpisode(pos_hemoculture, episode) {
        episode.addPolymicrobialEvidence(pos_hemoculture);
    }

    addCopyStrainEvidenceToExistingEpisode(pos_hemoculture, episode) {
        episode.addCopyStrainEvidence(pos_hemoculture);
    }

    // this case is the most tricky, it happens when you start having a pathA on day 1 and then on day 3 you have a different pathogene (so it counts as 2 evidences). but later during the day you have the same pathogene A, so it should be fusionned
    //    patient_10043		2021-01-04	pathA	0
    //    patient_10043		2021-01-06	pathC	0
    //    patient_10043		2021-01-06	pathA	0
    //
    combinePolymicrobialEpisodeWithCopyStrain(polymicrobial, previous_copy_strain) {
        polymicrobial.evidences.forEach(function(e) {
            previous_copy_strain.addPolymicrobialEvidence(e);
        })

        //remove the polymicrobial
        var idx = 0;
        this.episodes.forEach(function(e) {
            if (e == polymicrobial) return
            idx++;
        })
        this.episodes = this.episodes.slice(0, idx).concat(this.episodes.slice(idx + 1, ))
    }
}
*/