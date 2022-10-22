class Scenario {

    constructor() {
        this.description = "";
        this.positive_hemocultures = [];
        this.episodes_computations = {};
    }

    addPositiveHemoculture(positive_hemoculture) {
        return this.positive_hemocultures.push(positive_hemoculture);
    }

    addDescription(description) {
        this.description += description + "<br>";
    }

    addEpsiodeComputation(algo_name, episodes) {
        this.episodes_computations[algo_name] = episodes;
    }


}


class PositiveHemoculture {

    constructor(patient_id, stay_id, labo_sample_date, labo_germ_name, labo_commensal) {
        this.patient_id = patient_id;
        this.stay_id = stay_id;
        this.labo_sample_date = labo_sample_date;
        this.labo_germ_name = labo_germ_name;
        this.labo_commensal = labo_commensal;
        this.labo_sample_datetime_moment = moment(labo_sample_date, "YYYY-MM-DD", true);
        if(!this.labo_sample_datetime_moment.isValid()) {
            alert("Not a valid date in format 'YYYY-MM-DD' for '" + labo_sample_date + "' patient_id " + patient_id)
        }
        this.labo_sample_datetime_timestamp = this.labo_sample_datetime_moment.valueOf();
        //d.labo_patient_id_sample_calendar_day = d.patient_id + "-" + formatMomentDateToStringForGranularity(d.labo_sample_datetime_moment, "day");
    }

}

class Episode {

    distinct_germs = [];
    evidences = [];
    polymicrobial_evidences = [];
    copy_strains_evidences = [];
    labo_sample_datetime_moment
    is_polymicrobial = false; // by default it is false

    constructor(pos_hemoculture) {
        this.addEvidence(pos_hemoculture)
        this.first_evidence = deepCopy(pos_hemoculture);
        this.patient_id = pos_hemoculture.patient_id;
        this.stay_id = pos_hemoculture.stay_id;
        this.labo_sample_date = pos_hemoculture.labo_sample_date;
        this.labo_germ_name = pos_hemoculture.labo_germ_name;
        this.labo_commensal = pos_hemoculture.labo_commensal;
        this.labo_sample_datetime_moment = moment(pos_hemoculture.labo_sample_date, "YYYY-MM-DD");
        this.labo_sample_datetime_timestamp = this.labo_sample_datetime_moment.valueOf();
        this.days = pos_hemoculture.days;

    }

    getClassification(){
        //If only 1 commensal
        if(this.evidences.filter(e => e.labo_commensal == 1).length == 1){
            return "[C]"; //contamination
        }
        if(this.evidences.filter(e => e.labo_commensal != 1) > 0 && this.distinct_germs.length > 1){
            //what if 2 contaminations in same day? is it a polymicrobial or 2 contaminations?
            return "[P]"; //contamination
        }

        return "";
    }

    containsGerm(germ_name) {
        return _.includes(this.distinct_germs, germ_name)
    }

    addPolymicrobialEvidence(pos_hemoculture) {
        this.is_polymicrobial = true;
        this.polymicrobial_evidences.push(deepCopy(pos_hemoculture));
        this.addEvidence(pos_hemoculture);
    }

    addCopyStrainEvidence(pos_hemoculture) {
        this.copy_strains_evidences.push(deepCopy(pos_hemoculture));
        this.addEvidence(pos_hemoculture);
    }

    //private
    addEvidence(pos_hemoculture) {
        this.evidences.push(deepCopy(pos_hemoculture));
        this.distinct_germs = _.uniq(this.evidences.map(e => e.labo_germ_name));
    }
}


class EpisodeFlow {

    constructor(id, valid_days) {
        this.id = id;
        this.episodes = [];
        this.valid_days = valid_days ? valid_days : 14;
    }


    createNewEpisodeFromPositiveHemoculture(pos_hemoculture) {
        this.episodes.push(new Episode(pos_hemoculture));
    }

    isEmpty() {
        return this.episodes.length == 0;
    }

    getValidEpisodesForPositiveHemoculture(pos_hemoculture){
        return this.episodes.filter(c => (pos_hemoculture.days - c.days) < this.valid_days)
    }

    getStillValidEpisodeWithSameGerm(pos_hemoculture){
        return this.getValidEpisodesForPositiveHemoculture(pos_hemoculture).filter(c => (pos_hemoculture.labo_germ_name == c.labo_germ_name))
    }

    getEpisodeOnSameDay(pos_hemoculture){
        return this.episodes.filter(c => (pos_hemoculture.days == c.days))
    }

    addPolymicrobialEvidenceToExistingEpisode(pos_hemoculture, episode){
        episode.addPolymicrobialEvidence(pos_hemoculture);
    }

    addCopyStrainEvidenceToExistingEpisode(pos_hemoculture, episode){
        episode.addCopyStrainEvidence(pos_hemoculture);
    }

    /* this case is the most tricky, it happens when you start having a pathA on day 1 and then on day 3 you have a different pathogene (so it counts as 2 evidences). but later during the day you have the same pathogene A, so it should be fusionned
        patient_10043		2021-01-04	pathA	0
        patient_10043		2021-01-06	pathC	0
        patient_10043		2021-01-06	pathA	0
    */
    combinePolymicrobialEpisodeWithCopyStrain(polymicrobial, previous_copy_strain){
        polymicrobial.evidences.forEach(function (e){
            previous_copy_strain.addPolymicrobialEvidence(e);
        })

        //remove the polymicrobial
        var idx = 0;
        this.episodes.forEach(function (e){
            if(e == polymicrobial)return
            idx++;
        })
        this.episodes = this.episodes.slice(0, idx).concat(this.episodes.slice(idx+1, ))
    }



}