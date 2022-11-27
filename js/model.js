class PositiveHemoculture {

    constructor(patient_id, stay_begin_date, labo_sample_date, labo_germ_name, labo_commensal, specific_info) {
        this.patient_id = patient_id;
        this.stay_begin_date = stay_begin_date;
        this.labo_sample_date = labo_sample_date;
        this.labo_germ_name = labo_germ_name;
        this.labo_commensal = labo_commensal;
        this.specific_info = specific_info; //require to keep specific information (not required for the algorithm)
        this.labo_sample_datetime_moment = moment(labo_sample_date, "YYYY-MM-DD", true);
        this.stay_begin_date_moment = moment(stay_begin_date, "YYYYMMDD", true);

        this.days_since_begin_stay = this.labo_sample_datetime_moment.clone().diff(this.stay_begin_date_moment.clone(), "days");
        
        if (!this.labo_sample_datetime_moment.isValid()) {
            alert("Not a valid date in format 'YYYY-MM-DD' for '" + labo_sample_date + "' patient_id " + patient_id)
        }

        if (!this.stay_begin_date_moment.isValid()) {
            alert("Not a valid date in format 'YYYYMMDD' for '" + stay_begin_date + "' patient_id " + patient_id)
        }
        
        this.labo_sample_datetime_timestamp = this.labo_sample_datetime_moment.valueOf();
        //d.labo_patient_id_sample_calendar_day = d.patient_id + "-" + formatMomentDateToStringForGranularity(d.labo_sample_datetime_moment, "day");
    }

    isNosocomial(){
        return this.days_since_begin_stay >= 2;
    }
}


class Episode {


    constructor(pos_hemoculture) {

        this.distinct_germs = [];
        this.evidences = [];
        this.polymicrobial_evidences = [];
        this.copy_strains_evidences = [];
        this.evidences_based_on_non_repeated_intervals = [];
        this.is_polymicrobial = false; // by default it is false

        this.addEvidence(pos_hemoculture)
        this.first_evidence = deepCopy(pos_hemoculture);
        this.patient_id = pos_hemoculture.patient_id;
        this.stay_begin_date = pos_hemoculture.stay_begin_date;
        this.labo_sample_date = pos_hemoculture.labo_sample_date;
        this.labo_germ_name = pos_hemoculture.labo_germ_name;
        this.labo_commensal = pos_hemoculture.labo_commensal;
        this.labo_sample_datetime_moment = moment(pos_hemoculture.labo_sample_date, "YYYY-MM-DD");
        this.labo_sample_datetime_timestamp = this.labo_sample_datetime_moment.valueOf();
    }

    getClassification() {
        //If only 1 commensal
        if (this.evidences.filter(e => e.labo_commensal == 1).length == 1) {
            return "[C]"; //contamination
        }
        if (this.evidences.filter(e => e.labo_commensal != 1) > 0 && this.distinct_germs.length > 1) {
            //what if 2 contaminations in same day? is it a polymicrobial or 2 contaminations?
            return "[P]"; //contamination
        }

        return "";
    }

    /** Takes the first episode from the evidences, since they are always sorted from the method addEvidence */
    getFirstEvidence(){
        this.evidences[0];
    }

    /** Takes the first episode from the evidences */
    getEpisodeDate(){
        var min = Number.MAX_VALUE;
        this.evidences.forEach(e => min = Math.min(e.labo_sample_datetime_timestamp, min));
        return new Date(min);
    }

    distinct_germs_label() {
        return this.distinct_germs.join("+")
    }

    episode_date() {
        this.labo_sample_date
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

    addEvidenceBasedOnNonRepeatInterval(pos_hemoculture) {
        this.evidences_based_on_non_repeated_intervals.push(deepCopy(pos_hemoculture));
        this.addEvidence(pos_hemoculture);
    }

    //private adds an evidence and ensures the array is sorted
    addEvidence(pos_hemoculture) {
        this.evidences.push(deepCopy(pos_hemoculture));
        this.evidences = this.evidences.sort(function (e1, e2){
            return e1.labo_sample_datetime_moment.valueOf() - e2.labo_sample_datetime_moment.valueOf() 
        })
        this.distinct_germs = _.uniq(this.evidences.map(e => e.labo_germ_name));
    }
}
