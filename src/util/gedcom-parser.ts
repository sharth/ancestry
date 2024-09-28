import { reportUnparsedRecord } from '../util/record-unparsed-records';
import * as gedcom from '../gedcom';

export class GedcomParser {
  parseGedcomCitation(gedcomRecord: gedcom.GedcomRecord): gedcom.GedcomCitation {
    if (gedcomRecord.tag !== 'SOUR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();
  
    const gedcomCitation = new gedcom.GedcomCitation(gedcomRecord.value);
    gedcomCitation.gedcomRecord = gedcomRecord;
  
    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case '_TMPLT':
        case '_QUAL':
        case 'QUAY':
          break;
        case 'OBJE':
          childRecord.children.forEach(reportUnparsedRecord);
          gedcomCitation.obje = childRecord.value;
          break;
        case 'NAME':
          childRecord.children.forEach(reportUnparsedRecord);
          gedcomCitation.name = childRecord.value;
          break;
        case 'NOTE':
          childRecord.children.forEach(reportUnparsedRecord);
          gedcomCitation.note = childRecord.value;
          break;
        case 'PAGE':
          childRecord.children.forEach(reportUnparsedRecord);
          gedcomCitation.page = childRecord.value;
          break;
        case 'DATA':
          gedcomCitation.text = this.parseGedcomCitationData(childRecord);
          break;
        default:
          reportUnparsedRecord(childRecord);
          break;
      }
    }
  
    return gedcomCitation;
  }

  parseGedcomCitationData(gedcomRecord: gedcom.GedcomRecord ): string {
    if (gedcomRecord.tag !== 'DATA') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value != null) throw new Error();
  
    let text = '';
  
    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'TEXT':
          if (childRecord.value)
            text += childRecord.value;
          childRecord.children.forEach(reportUnparsedRecord);
          break;
        default:
          reportUnparsedRecord(childRecord);
          break;
      }
    }
    return text;
  }

  parseGedcomEvent(record: gedcom.GedcomRecord): gedcom.GedcomEvent {
    if (record.xref != null) throw new Error();
  
    const type = new Map([
      ['BAPM', 'Baptism'],
      ['BIRT', 'Birth'],
      ['BURI', 'Burial'],
      ['CENS', 'Census'],
      ['DEAT', 'Death'],
      ['DIV', 'Divorce'],
      ['EDUC', 'Education'],
      ['EMIG', 'Emigration'],
      ['EVEN', 'Event'],
      ['IMMI', 'Immigration'],
      ['MARB', 'Marriage Banns'],
      ['MARR', 'Marriage'],
      ['NAME', 'Name'],
      ['NATU', 'Naturalization'],
      ['OCCU', 'Occupation'],
      ['PROB', 'Probate'],
      ['RELI', 'Religion'],
      ['RESI', 'Residence'],
      ['RETI', 'Retirement'],
      ['SEX', 'Sex'],
      ['SSN', 'Social Security Number'],
      ['WILL', 'Will'],
    ]).get(record.tag) ?? record.tag;
  
    const gedcomEvent = new gedcom.GedcomEvent(type);
    gedcomEvent.value = record.value;
  
    for (const childRecord of record.children) {
      switch (childRecord.tag) {
        case '_SHAR':
          gedcomEvent.sharedWithXrefs.push(this.parseGedcomEventShare(childRecord));
          break;
        case 'SOUR':
          gedcomEvent.citations.push(this.parseGedcomCitation(childRecord));
          break;
        case 'DATE':
          this.parseGedcomEventDate(gedcomEvent, childRecord);
          break;
        case 'TYPE':
          gedcomEvent.type = this.parseGedcomEventType(childRecord);
          break;
        case 'ADDR':
          gedcomEvent.address = this.parseGedcomEventAddress(childRecord);
          break;
        case 'PLAC':
          gedcomEvent.place = this.parseGedcomEventPlace(childRecord);
          break;
        case 'CAUS':
          gedcomEvent.cause = this.parseGedcomEventCause(childRecord);
          break;
        case '_SENT': break;
        case '_SDATE': break;
        case '_PRIM': break;
        case '_PROOF': break;
        case 'NOTE': break;
        default:
          reportUnparsedRecord(childRecord);
          break;
      }
    }
  
    return gedcomEvent;
  }

  parseGedcomEventAddress(gedcomRecord: gedcom.GedcomRecord): string {
    if (gedcomRecord.tag !== 'ADDR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();
  
    gedcomRecord.children.forEach(reportUnparsedRecord);
    return gedcomRecord.value;
  }
  
  parseGedcomEventPlace(gedcomRecord: gedcom.GedcomRecord): string {
    if (gedcomRecord.tag !== 'PLAC') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();
  
    gedcomRecord.children.forEach(reportUnparsedRecord);
    return gedcomRecord.value;
  }
  
  parseGedcomEventCause(gedcomRecord: gedcom.GedcomRecord): string {
    if (gedcomRecord.tag !== 'CAUS') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();
  
    gedcomRecord.children.forEach(reportUnparsedRecord);
    return gedcomRecord.value;
  }  

  parseGedcomEventDate(gedcomEvent: gedcom.GedcomEvent, gedcomRecord: gedcom.GedcomRecord): void {
    if (gedcomRecord.tag !== 'DATE') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomEvent.date = gedcomRecord.value;
    gedcomEvent.dateDescriptive = gedcomRecord.value.replaceAll(/\w+/g, (s: string) => {
      switch (s) {
        case 'JAN': return 'January';
        case 'FEB': return 'February';
        case 'MAR': return 'March';
        case 'APR': return 'April';
        case 'MAY': return 'May';
        case 'JUN': return 'June';
        case 'JUL': return 'July';
        case 'AUG': return 'August';
        case 'SEP': return 'September';
        case 'OCT': return 'October';
        case 'NOV': return 'November';
        case 'DEC': return 'December';
        case 'AFT': return 'after';
        case 'BET': return 'between';
        case 'BEF': return 'before';
        case 'ABT': return 'about';
        case 'CAL': return 'calculated';
        case 'EST': return 'estimated';
        default: return s.toLowerCase();
      }
    }).replace(/^\w/, (s) => s.toUpperCase());

    // const dateHelper = '(?:(?:(\\d+) +)?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC) +)(\\d+)'
    // const dateValue = new RegExp(`^${dateHelper}$`)
    // const datePeriod = new RegExp(`^FROM +${dateHelper} +TO +${dateHelper}$`)
    // const dateRange = new RegExp(`^BET +${dateHelper} +AND +${dateHelper}$`)
    // const dateApprox = new RegExp(`^(FROM|TO|AFT|BEF|ABT|CAL|EST) +${dateHelper}$`)

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  parseGedcomEventShare(gedcomRecord: gedcom.GedcomRecord): string {
    if (gedcomRecord.tag !== '_SHAR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(reportUnparsedRecord);
    return gedcomRecord.value;
  }

  parseGedcomEventType(gedcomRecord: gedcom.GedcomRecord): string {
    if (gedcomRecord.tag !== 'TYPE') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(reportUnparsedRecord);
    return gedcomRecord.value;
  }

  parseGedcomFamily(record: gedcom.GedcomRecord): gedcom.GedcomFamily {
    if (record.abstag !== 'FAM') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    const gedcomFamily = new gedcom.GedcomFamily(record.xref);
    gedcomFamily.gedcomRecord = record;

    for (const childRecord of record.children) {
      switch (childRecord.tag) {
        case 'CHIL':
          this.parseGedcomFamilyChild(gedcomFamily, childRecord);
          break;
        case 'HUSB':
          this.parseGedcomFamilyHusband(gedcomFamily, childRecord);
          break;
        case 'WIFE':
          this.parseGedcomFamilyWife(gedcomFamily, childRecord);
          break;
        case 'DIV':
        case 'EVEN':
        case 'MARR':
        case 'MARB':
          gedcomFamily.events.push(this.parseGedcomEvent(childRecord));
          break;
        default:
          reportUnparsedRecord(childRecord);
          break;
      }
    }

    return gedcomFamily;
  }

  parseGedcomFamilyChild(gedcomFamily: gedcom.GedcomFamily, gedcomRecord: gedcom.GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM.CHIL') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const childXref = gedcomRecord.value;
    // const individual = this.gedcomDatabase.individual(gedcomRecord.value);
    // individual.childOfFamilyXref = gedcomFamily.xref;
    gedcomFamily.childXrefs.push(childXref);

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  parseGedcomFamilyHusband(gedcomFamily: gedcom.GedcomFamily, gedcomRecord: gedcom.GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM.HUSB') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const husbandXref = gedcomRecord.value;
    // const individual = this.gedcomDatabase.individual(gedcomRecord.value);
    // individual.parentOfFamilyXrefs.push(gedcomFamily.xref);
    gedcomFamily.husbandXref = husbandXref;

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  parseGedcomFamilyWife(gedcomFamily: gedcom.GedcomFamily, gedcomRecord: gedcom.GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM.WIFE') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const wifeXref = gedcomRecord.value;
    // const individual = this.gedcomDatabase.individual(gedcomRecord.value);
    // individual.parentOfFamilyXrefs.push(gedcomFamily.xref);
    gedcomFamily.wifeXref = wifeXref;

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  parseGedcomIndividual(record: gedcom.GedcomRecord): gedcom.GedcomIndividual {
    if (record.abstag !== 'INDI') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    const gedcomIndividual = new gedcom.GedcomIndividual(record.xref);
    gedcomIndividual.gedcomRecord = record;

    for (const childRecord of record.children) {
      switch (childRecord.tag) {
        case 'BAPM':
        case 'BIRT':
        case 'BURI':
        case 'CENS':
        case 'DEAT':
        case 'EDUC':
        case 'EMIG':
        case 'EVEN':
        case 'IMMI':
        case 'MARB':
        case 'MARR':
        case 'NATU':
        case 'OCCU':
        case 'PROB':
        case 'RELI':
        case 'RESI':
        case 'RETI':
        case 'WILL':
        case 'DIV':
        case 'SSN':
          gedcomIndividual.events.push(this.parseGedcomEvent(childRecord));
          break;
        case 'NAME':
          this.parseGedcomIndividualName(gedcomIndividual, childRecord);
          break;
        case 'SEX':
          this.parseGedcomIndividualSex(gedcomIndividual, childRecord);
          break;
        case 'FAMS': break; // Let's just use the links inside the Family record.
        case 'FAMC': break; // Let's just use the links inside the Family record.
        case '_FSFTID':
          gedcomIndividual.familySearchId = this.parseGedcomIndividualFamilySearchId(childRecord);
          break;
        default:
          reportUnparsedRecord(childRecord);
          break;
      }
    }

    return gedcomIndividual;
  }

  parseGedcomIndividualFamilySearchId(gedcomRecord: gedcom.GedcomRecord): string {
    if (gedcomRecord.abstag !== 'INDI._FSFTID') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(reportUnparsedRecord);
    return gedcomRecord.value;
  }

  parseGedcomIndividualName(gedcomIndividual: gedcom.GedcomIndividual, gedcomRecord: gedcom.GedcomRecord): void {
    if (gedcomRecord.abstag !== 'INDI.NAME') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    // if (gedcomRecord.value != null) throw new Error();

    const gedcomEvent = new GedcomParser().parseGedcomEvent(gedcomRecord);
    gedcomIndividual.events.push(gedcomEvent);
    gedcomEvent.value = gedcomRecord.value;

    if (gedcomIndividual.name == null) {
      gedcomIndividual.name = gedcomRecord.value;
      gedcomIndividual.surname = gedcomRecord.value?.match('/(.*)/')?.[1];
    }

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'SOUR':
          gedcomEvent.citations.push(new GedcomParser().parseGedcomCitation(childRecord));
          break;
        default:
          reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  parseGedcomIndividualSex(gedcomIndividual: gedcom.GedcomIndividual, gedcomRecord: gedcom.GedcomRecord): void {
    if (gedcomRecord.abstag !== 'INDI.SEX') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const gedcomEvent = new GedcomParser().parseGedcomEvent(gedcomRecord);
    gedcomIndividual.events.push(gedcomEvent);
    gedcomEvent.value = gedcomRecord.value;

    if (gedcomIndividual.sex == null) {
      switch (gedcomRecord.value) {
        case 'M':
          gedcomIndividual.sex = 'Male';
          break;
        case 'F':
          gedcomIndividual.sex = 'Female';
          break;
      }
    }

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  parseGedcomSource(record: gedcom.GedcomRecord): gedcom.GedcomSource {
    if (record.abstag !== 'SOUR') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    const gedcomSource = new gedcom.GedcomSource(record.xref);
    gedcomSource.canonicalGedcomRecord = record;

    for (const childRecord of record.children) {
      switch (childRecord.tag) {
        case 'ABBR':
          if (gedcomSource.abbr != null) throw new Error();
          gedcomSource.abbr = this.parseGedcomSourceAbbreviation(childRecord);
          break;
        case 'TEXT':
          if (gedcomSource.text != null) throw new Error();
          gedcomSource.text = this.parseGedcomSourceText(childRecord);
          break;
        case 'TITL':
          if (gedcomSource.title != null) throw new Error();
          gedcomSource.title = this.parseGedcomSourceTitle(childRecord);
          break;
        case 'REPO':
          gedcomSource.repositoryCitations.push(this.parseGedcomSourceRepositoryCitation(childRecord));
          break;
        // case 'OBJE':
        //   gedcomSource.multimediaXrefs.push(this.parseGedcomSourceMultimediaLink(childRecord));
        //   break;
        default:
          gedcomSource.unknownRecords.push(childRecord);
          break;
      }
    }

    return gedcomSource;
  }

  parseGedcomSourceAbbreviation(gedcomRecord: gedcom.GedcomRecord): string {
    if (gedcomRecord.abstag !== 'SOUR.ABBR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();
    gedcomRecord.children.forEach(reportUnparsedRecord);

    return gedcomRecord.value;
  }

  parseGedcomSourceTitle(gedcomRecord: gedcom.GedcomRecord): string {
    if (gedcomRecord.abstag !== 'SOUR.TITL') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();
    gedcomRecord.children.forEach(reportUnparsedRecord);

    return gedcomRecord.value;
  }

  parseGedcomSourceText(gedcomRecord: gedcom.GedcomRecord) {
    if (gedcomRecord.abstag !== 'SOUR.TEXT') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();
    gedcomRecord.children.forEach(reportUnparsedRecord);

    return gedcomRecord.value;
  }

  parseGedcomSourceRepositoryCitation(gedcomRecord: gedcom.GedcomRecord) {
    if (gedcomRecord.abstag !== 'SOUR.REPO') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const repositoryXref = gedcomRecord.value;
    const callNumbers: string[] = [];

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'CALN':
          if (childRecord.abstag != 'SOUR.REPO.CALN') throw new Error();
          if (childRecord.xref != null) throw new Error();
          if (childRecord.value == null) throw new Error();
          if (childRecord.children.length > 0) throw new Error();
          callNumbers.push(childRecord.value);
          break;
        default:
          reportUnparsedRecord(childRecord);
          break;
      }
    }

    return {repositoryXref, callNumbers};
  }

  parseGedcomSourceMultimediaLink(gedcomRecord: gedcom.GedcomRecord): string {
    if (gedcomRecord.abstag !== 'SOUR.OBJE') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    return gedcomRecord.value;
  }

  parseGedcomMultimedia(record: gedcom.GedcomRecord): gedcom.GedcomMultimedia {
      if (record.abstag !== 'OBJE') throw new Error();
      if (record.xref == null) throw new Error();
      if (record.value != null) throw new Error();

      const gedcomMultimedia = new gedcom.GedcomMultimedia(record.xref);
      
      for (const childRecord of record.children) {
          switch (childRecord.tag) {
              case 'FILE':
                  if (childRecord.xref != null) throw new Error();
                  if (gedcomMultimedia.filePath != null)
                      throw new Error("Multiple filePaths are not supported.");
                  gedcomMultimedia.filePath = childRecord.value;

                  for (const grandchildRecord of childRecord.children) {
                      switch (grandchildRecord.tag) {
                          case 'FORM':
                              if (grandchildRecord.xref != null) throw new Error();
                              if (gedcomMultimedia.mediaType != null)
                                  throw new Error("Multiple mediaTypes are not allowed");
                              gedcomMultimedia.mediaType = grandchildRecord.value;
                              grandchildRecord.children.forEach(reportUnparsedRecord)
                              break;
                          default:
                              reportUnparsedRecord(grandchildRecord)
                              break;
                      }
                  }
                  break;
              default:
                  reportUnparsedRecord(childRecord);
                  break;
          }
      }

      return gedcomMultimedia;
  }


  parseGedcomSubmitter(gedcomRecord: gedcom.GedcomRecord): gedcom.GedcomSubmitter {
      if (gedcomRecord.abstag !== 'SUBM') throw new Error();
      if (gedcomRecord.xref == null) throw new Error();
      if (gedcomRecord.value != null) throw new Error();
    
      const gedcomSubmitter = new gedcom.GedcomSubmitter(gedcomRecord.xref, gedcomRecord);
    
      for (const childRecord of gedcomRecord.children) {
        switch (childRecord.tag) {
          case 'NAME':
            if (childRecord.xref != null) throw new Error();
            if (childRecord.value == null) throw new Error();
            gedcomSubmitter.name = childRecord.value;
            break;
          case '_EMAIL':
            if (childRecord.xref != null) throw new Error();
            if (childRecord.value == null) throw new Error();
            gedcomSubmitter.email = childRecord.value;
            break;
          default:
            reportUnparsedRecord(childRecord);
            break;
        }
      }
    
      return gedcomSubmitter;
    }
    
  parseGedcomRepository(gedcomRecord: gedcom.GedcomRecord): gedcom.GedcomRepository {
      if (gedcomRecord.abstag !== 'REPO') throw new Error();
      if (gedcomRecord.xref == null) throw new Error();
      if (gedcomRecord.value != null) throw new Error();

      const gedcomRepository = new gedcom.GedcomRepository(gedcomRecord.xref);

      for (const childRecord of gedcomRecord.children) {
        switch (childRecord.tag) {
          case 'NAME':
            if (childRecord.abstag !== 'REPO.NAME') throw new Error();
            if (childRecord.xref != null) throw new Error();
            if (childRecord.value == null) throw new Error();
            if (childRecord.children.length != 0) throw new Error();
            gedcomRepository.name = childRecord.value;
            break;

          default:
            reportUnparsedRecord(childRecord);
            break;
        }
      }
      return gedcomRepository;
  }
};
