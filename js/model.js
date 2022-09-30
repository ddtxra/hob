class PositiveHemoculture {

    constructor(description, patient_id, stay_id, labo_sample_date, labo_germ_name, labo_commensal) {
        this.description = description;
        this.patient_id = patient_id;
        this.stay_id = stay_id;
        this.labo_sample_date = labo_sample_date;
        this.labo_germ_name = labo_germ_name;
        this.labo_commensal = labo_commensal;
        this.labo_sample_datetime_moment = moment(labo_sample_date, "YYYY-MM-DD");
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