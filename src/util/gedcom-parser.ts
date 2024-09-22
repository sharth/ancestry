import { reportUnparsedRecord } from '../util/record-unparsed-records';
import * as gedcom from '../gedcom';

export function parseGedcomCitationFromGedcomRecord(gedcomRecord: gedcom.GedcomRecord): gedcom.GedcomCitation {
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
        gedcomCitation.text = parseCitationData(childRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomCitation;
}

function parseCitationData(gedcomRecord: gedcom.GedcomRecord ): string {
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

export function parseGedcomEventFromGedcomRecord(record: gedcom.GedcomRecord): gedcom.GedcomEvent {
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
        gedcomEvent.sharedWithXrefs.push(parseEventShare(childRecord));
        break;
      case 'SOUR':
        gedcomEvent.citations.push(parseGedcomCitationFromGedcomRecord(childRecord));
        break;
      case 'DATE':
        parseEventDate(gedcomEvent, childRecord);
        break;
      case 'TYPE':
        gedcomEvent.type = parseEventType(childRecord);
        break;
      case 'ADDR':
        gedcomEvent.address = parseEventAddress(childRecord);
        break;
      case 'PLAC':
        gedcomEvent.place = parseEventPlace(childRecord);
        break;
      case 'CAUS':
        gedcomEvent.cause = parseEventCause(childRecord);
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

function parseEventAddress(gedcomRecord: gedcom.GedcomRecord): string {
  if (gedcomRecord.tag !== 'ADDR') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(reportUnparsedRecord);
  return gedcomRecord.value;
}

function parseEventPlace(gedcomRecord: gedcom.GedcomRecord): string {
  if (gedcomRecord.tag !== 'PLAC') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(reportUnparsedRecord);
  return gedcomRecord.value;
}

function parseEventCause(gedcomRecord: gedcom.GedcomRecord): string {
  if (gedcomRecord.tag !== 'CAUS') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(reportUnparsedRecord);
  return gedcomRecord.value;
}

function parseEventDate(gedcomEvent: gedcom.GedcomEvent, gedcomRecord: gedcom.GedcomRecord): void {
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

function parseEventShare(gedcomRecord: gedcom.GedcomRecord): string {
  if (gedcomRecord.tag !== '_SHAR') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(reportUnparsedRecord);
  return gedcomRecord.value;
}

function parseEventType(gedcomRecord: gedcom.GedcomRecord): string {
  if (gedcomRecord.tag !== 'TYPE') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(reportUnparsedRecord);
  return gedcomRecord.value;
}


export function parseGedcomFamilyFromGedcomRecord(record: gedcom.GedcomRecord): gedcom.GedcomFamily {
  if (record.abstag !== 'FAM') throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomFamily = new gedcom.GedcomFamily(record.xref);
  gedcomFamily.gedcomRecord = record;

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case 'CHIL':
        parseFamilyChild(gedcomFamily, childRecord);
        break;
      case 'HUSB':
        parseFamilyHusband(gedcomFamily, childRecord);
        break;
      case 'WIFE':
        parseFamilyWife(gedcomFamily, childRecord);
        break;
      case 'DIV':
      case 'EVEN':
      case 'MARR':
      case 'MARB':
        gedcomFamily.events.push(parseGedcomEventFromGedcomRecord(childRecord));
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomFamily;
}

function parseFamilyChild(gedcomFamily: gedcom.GedcomFamily, gedcomRecord: gedcom.GedcomRecord): void {
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

function parseFamilyHusband(gedcomFamily: gedcom.GedcomFamily, gedcomRecord: gedcom.GedcomRecord): void {
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

function parseFamilyWife(gedcomFamily: gedcom.GedcomFamily, gedcomRecord: gedcom.GedcomRecord): void {
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

export function parseGedcomIndividualFromGedcomRecord(record: gedcom.GedcomRecord): gedcom.GedcomIndividual {
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
        gedcomIndividual.events.push(parseGedcomEventFromGedcomRecord(childRecord));
        break;
      case 'NAME':
        parseIndividualName(gedcomIndividual, childRecord);
        break;
      case 'SEX':
        parseIndividualSex(gedcomIndividual, childRecord);
        break;
      case 'FAMS': break; // Let's just use the links inside the Family record.
      case 'FAMC': break; // Let's just use the links inside the Family record.
      case '_FSFTID':
        gedcomIndividual.familySearchId = parseIndividualFamilySearchId(childRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomIndividual;
}

function parseIndividualFamilySearchId(gedcomRecord: gedcom.GedcomRecord): string {
  if (gedcomRecord.abstag !== 'INDI._FSFTID') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(reportUnparsedRecord);
  return gedcomRecord.value;
}

function parseIndividualName(
    gedcomIndividual: gedcom.GedcomIndividual,
    gedcomRecord: gedcom.GedcomRecord): void {
  if (gedcomRecord.abstag !== 'INDI.NAME') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  // if (gedcomRecord.value != null) throw new Error();

  const gedcomEvent = parseGedcomEventFromGedcomRecord(gedcomRecord);
  gedcomIndividual.events.push(gedcomEvent);
  gedcomEvent.value = gedcomRecord.value;

  if (gedcomIndividual.name == null) {
    gedcomIndividual.name = gedcomRecord.value;
    gedcomIndividual.surname = gedcomRecord.value?.match('/(.*)/')?.[1];
  }

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case 'SOUR':
        gedcomEvent.citations.push(parseGedcomCitationFromGedcomRecord(childRecord));
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseIndividualSex(
    gedcomIndividual: gedcom.GedcomIndividual,
    gedcomRecord: gedcom.GedcomRecord): void {
  if (gedcomRecord.abstag !== 'INDI.SEX') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const gedcomEvent = parseGedcomEventFromGedcomRecord(gedcomRecord);
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

export function constructSourceFromGedcomRecord(record: gedcom.GedcomRecord): gedcom.GedcomSource {
  if (record.abstag !== 'SOUR') throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomSource = new gedcom.GedcomSource(record.xref);
  gedcomSource.canonicalGedcomRecord = record;

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case 'ABBR':
        if (gedcomSource.abbr != null) throw new Error();
        gedcomSource.abbr = constructSourceAbbreviationFromGedcom(childRecord);
        break;
      case 'TEXT':
        if (gedcomSource.text != null) throw new Error();
        gedcomSource.text = constructSourceTextFromGedcom(childRecord);
        break;
      case 'TITL':
        if (gedcomSource.title != null) throw new Error();
        gedcomSource.title = constructSourceTitleFromGedcom(childRecord);
        break;
      case 'REPO':
        gedcomSource.repositoryCitations.push(
            constructSourceRepositoryCitationFromGedcom(childRecord));
        break;
      // case 'OBJE':
      //   gedcomSource.multimediaXrefs.push(constructMultimediaLink(childRecord));
      //   break;
      default:
        gedcomSource.unknownRecords.push(childRecord);
        break;
    }
  }

  return gedcomSource;
}

function constructSourceAbbreviationFromGedcom(gedcomRecord: gedcom.GedcomRecord): string {
  if (gedcomRecord.abstag !== 'SOUR.ABBR') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();
  gedcomRecord.children.forEach(reportUnparsedRecord);

  return gedcomRecord.value;
}

function constructSourceTitleFromGedcom(gedcomRecord: gedcom.GedcomRecord): string {
  if (gedcomRecord.abstag !== 'SOUR.TITL') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();
  gedcomRecord.children.forEach(reportUnparsedRecord);

  return gedcomRecord.value;
}

function constructSourceTextFromGedcom(gedcomRecord: gedcom.GedcomRecord) {
  if (gedcomRecord.abstag !== 'SOUR.TEXT') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();
  gedcomRecord.children.forEach(reportUnparsedRecord);

  return gedcomRecord.value;
}

function constructSourceRepositoryCitationFromGedcom(gedcomRecord: gedcom.GedcomRecord) {
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

function constructMultimediaLink(gedcomRecord: gedcom.GedcomRecord): string {
  if (gedcomRecord.abstag !== 'SOUR.OBJE') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  return gedcomRecord.value;
}

export function parseGedcomRecordsFromText(text: string): gedcom.GedcomRecord[] {
  return Array.from(generateGedcomRecordsFromText(text));
}

function* generateGedcomRecordsFromText(text: string): Generator<gedcom.GedcomRecord> {
  const lines = text.split(/\r?\n/);
  let ladder: gedcom.GedcomRecord[] = [];

  for (const [lineNumber, line] of lines.entries()) {
    if (line == '') {
      continue;
    }
    const match = /^([0-9]+) *(@[^@]+@)? *([A-Za-z0-9_]+) *(.+)?$/.exec(line);
    if (match == null) {
      throw new Error(`Failed to parse line number ${lineNumber + 1}: ${line}`);
    }
    const level = parseInt(match[1], 10);
    const [xref, tag, value] = match.slice(2);
    const abstag = [...ladder.slice(0, level).map((record) => record.tag), tag].join('.');
    const record = new gedcom.GedcomRecord(level, xref, tag, abstag, value, []);

    if (level == 0) {
      if (ladder.length > 0) {
        yield ladder[0];
      }
      ladder = [record];
    } else if (tag === 'CONC') {
        ladder.at(-1)!.value ??= '';
        ladder.at(-1)!.value += (value ?? '');
    } else if (tag === 'CONT') {
        ladder.at(-1)!.value ??= '';
        ladder.at(-1)!.value += '\n';
        ladder.at(-1)!.value += (value ?? '');
    } else {
      ladder.length = level;
        ladder.at(-1)!.children.push(record);
        ladder.push(record);
    }
  }
  if (ladder.length > 0) {
    yield ladder[0];
  }
}

export function constructGedcomMultimediaFromGedcomRecord(record: gedcom.GedcomRecord): gedcom.GedcomMultimedia {
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


export function constructGedcomSubmitterFromGedcomRecord(gedcomRecord: gedcom.GedcomRecord): gedcom.GedcomSubmitter {
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
  
export function parseGedcomRepositoryFromGedcomRecord(gedcomRecord: gedcom.GedcomRecord): gedcom.GedcomRepository {
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