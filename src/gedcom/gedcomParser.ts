import { type GedcomRecord } from './gedcomRecord'
import { GedcomEvent } from './gedcomEvent'
import { type GedcomFamily } from './gedcomFamily'
import { type GedcomDatabase } from './gedcomDatabase'
import { GedcomCitation } from './gedcomCitation'
import { ChunkStreamByRecord } from './chunkStreamByRecord'
import { ChunkStreamByNewline } from './chunkStreamByNewline'
import { type GedcomIndividual } from './gedcomIndividual'
import { type GedcomSource } from './gedcomSource'

export class GedcomParser {
  constructor (public readonly gedcomDatabase: GedcomDatabase) {}
  private readonly unparsedTags = new Set<string>()

  reportUnparsedRecord (gedcomRecord: GedcomRecord): void {
    if (!this.unparsedTags.has(gedcomRecord.abstag)) {
      console.warn('Unparsed tag ', gedcomRecord.abstag)
      this.unparsedTags.add(gedcomRecord.abstag)
    }
  }

  async parseText (text: string): Promise<void> {
    await this.parseStream(new ReadableStream<string>({
      pull (controller) {
        controller.enqueue(text)
        controller.close()
      }
    }))
  }

  async parseStream (stream: ReadableStream<string>): Promise<void> {
    await stream
      .pipeThrough(new ChunkStreamByNewline())
      .pipeThrough(new ChunkStreamByRecord())
      .pipeTo(new WritableStream({
        write: (gedcomRecord: GedcomRecord) => { this.parse(gedcomRecord) }
      }))
  }

  parse (gedcomRecord: GedcomRecord): void {
    switch (gedcomRecord.tag) {
      case 'INDI': this.parseIndividual(gedcomRecord); break
      case 'FAM': this.parseFamily(gedcomRecord); break
      case 'SOUR': this.parseSource(gedcomRecord); break
      default: this.reportUnparsedRecord(gedcomRecord); break
    }
  }

  parseIndividual (gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'INDI') throw new Error()
    if (gedcomRecord.level !== 0) throw new Error()
    if (gedcomRecord.xref == null) throw new Error()
    if (gedcomRecord.value != null) throw new Error()

    const gedcomIndividual: GedcomIndividual = this.gedcomDatabase.individual(gedcomRecord.xref)

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'BAPM': this.parseEvent(gedcomIndividual, childRecord); break
        case 'BIRT': this.parseEvent(gedcomIndividual, childRecord); break
        case 'BURI': this.parseEvent(gedcomIndividual, childRecord); break
        case 'CENS': this.parseEvent(gedcomIndividual, childRecord); break
        case 'DEAT': this.parseEvent(gedcomIndividual, childRecord); break
        case 'EDUC': this.parseEvent(gedcomIndividual, childRecord); break
        case 'EMIG': this.parseEvent(gedcomIndividual, childRecord); break
        case 'EVEN': this.parseEvent(gedcomIndividual, childRecord); break
        case 'IMMI': this.parseEvent(gedcomIndividual, childRecord); break
        case 'MARB': this.parseEvent(gedcomIndividual, childRecord); break
        case 'MARR': this.parseEvent(gedcomIndividual, childRecord); break
        case 'NATU': this.parseEvent(gedcomIndividual, childRecord); break
        case 'OCCU': this.parseEvent(gedcomIndividual, childRecord); break
        case 'PROB': this.parseEvent(gedcomIndividual, childRecord); break
        case 'RELI': this.parseEvent(gedcomIndividual, childRecord); break
        case 'RESI': this.parseEvent(gedcomIndividual, childRecord); break
        case 'RETI': this.parseEvent(gedcomIndividual, childRecord); break
        case 'WILL': this.parseEvent(gedcomIndividual, childRecord); break
        case 'DIV': this.parseEvent(gedcomIndividual, childRecord); break
        case 'SSN': this.parseEvent(gedcomIndividual, childRecord); break
        case 'NAME': this.parseIndividualName(gedcomIndividual, childRecord); break
        case 'SEX': this.parseIndividualSex(gedcomIndividual, childRecord); break
        case 'FAMS': break // Let's just use the links inside the Family record.
        case 'FAMC': break // Let's just use the links inside the Family record.
        case '_FSFTID': this.parseIndividualFamilySearchId(gedcomIndividual, childRecord); break
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseIndividualFamilySearchId (gedcomIndividual: GedcomIndividual, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'INDI._FSFTID') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    gedcomIndividual.familySearchId ??= gedcomRecord.value

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseIndividualName (gedcomIndividual: GedcomIndividual, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'INDI.NAME') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    // if (gedcomRecord.value != null) throw new Error();

    const gedcomEvent = new GedcomEvent('Name')
    gedcomIndividual.events.push(gedcomEvent)
    gedcomEvent.value = gedcomRecord.value

    if (gedcomIndividual.name == null) {
      gedcomIndividual.name = gedcomRecord.value
      gedcomIndividual.surname = gedcomRecord.value?.match('/(.*)/')?.[1]
    }

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'SOUR': this.parseCitation(gedcomEvent, childRecord); break
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseIndividualSex (gedcomIndividual: GedcomIndividual, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'INDI.SEX') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    const gedcomEvent = new GedcomEvent('Sex')
    gedcomIndividual.events.push(gedcomEvent)
    gedcomEvent.value = gedcomRecord.value

    if (gedcomIndividual.sex == null) {
      switch (gedcomRecord.value) {
        case 'M': gedcomIndividual.sex = 'Male'; break
        case 'F': gedcomIndividual.sex = 'Female'; break
      }
    }

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseFamily (gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.tag !== 'FAM') throw new Error()
    if (gedcomRecord.level !== 0) throw new Error()
    if (gedcomRecord.xref == null) throw new Error()
    if (gedcomRecord.value != null) throw new Error()

    const gedcomFamily: GedcomFamily = this.gedcomDatabase.family(gedcomRecord.xref)

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'CHIL': this.parseFamilyChild(gedcomFamily, childRecord); break
        case 'HUSB': this.parseFamilyHusband(gedcomFamily, childRecord); break
        case 'WIFE': this.parseFamilyWife(gedcomFamily, childRecord); break
        case 'DIV':this.parseEvent(gedcomFamily, childRecord); break
        case 'EVEN':this.parseEvent(gedcomFamily, childRecord); break
        case 'MARR':this.parseEvent(gedcomFamily, childRecord); break
        case 'MARB': this.parseEvent(gedcomFamily, childRecord); break
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseFamilyChild (gedcomFamily: GedcomFamily, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM.CHIL') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    const individual = this.gedcomDatabase.individual(gedcomRecord.value)
    individual.childOfFamily = gedcomFamily
    gedcomFamily.children.push(individual)

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseFamilyHusband (gedcomFamily: GedcomFamily, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM.HUSB') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    const individual = this.gedcomDatabase.individual(gedcomRecord.value)
    individual.parentOfFamilies.push(gedcomFamily)
    gedcomFamily.husband = individual

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseFamilyWife (gedcomFamily: GedcomFamily, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'FAM.WIFE') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    const individual = this.gedcomDatabase.individual(gedcomRecord.value)
    individual.parentOfFamilies.push(gedcomFamily)
    gedcomFamily.wife = individual

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseEvent (gedcomIndividualOrFamily: (GedcomIndividual | GedcomFamily), gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.xref != null) throw new Error()

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
      ['WILL', 'Will']
    ]).get(gedcomRecord.tag) ?? gedcomRecord.tag

    const gedcomEvent = new GedcomEvent(type)
    gedcomIndividualOrFamily.events.push(gedcomEvent)

    gedcomEvent.value = gedcomRecord.value
    gedcomEvent.record = gedcomRecord

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case '_SHAR': this.parseEventShare(gedcomEvent, childRecord); break
        case 'SOUR': this.parseCitation(gedcomEvent, childRecord); break
        case 'DATE': this.parseEventDate(gedcomEvent, childRecord); break
        case 'TYPE': this.parseEventType(gedcomEvent, childRecord); break
        case 'ADDR': this.parseEventAddress(gedcomEvent, childRecord); break
        case 'PLAC': this.parseEventPlace(gedcomEvent, childRecord); break
        case 'CAUS': this.parseEventCause(gedcomEvent, childRecord); break
        case '_SENT': break
        case '_SDATE': break
        case '_PRIM': break
        case '_PROOF': break
        case 'NOTE': break
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseEventAddress (gedcomEvent: GedcomEvent, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.tag !== 'ADDR') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    gedcomEvent.address = gedcomRecord.value

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          this.reportUnparsedRecord(childRecord)
          break
      }
    }
  }

  parseEventPlace (gedcomEvent: GedcomEvent, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.tag !== 'PLAC') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    gedcomEvent.place = gedcomRecord.value

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          this.reportUnparsedRecord(childRecord)
          break
      }
    }
  }

  parseEventCause (gedcomEvent: GedcomEvent, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.tag !== 'CAUS') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    gedcomEvent.cause = gedcomRecord.value

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          this.reportUnparsedRecord(childRecord)
          break
      }
    }
  }

  parseEventDate (gedcomEvent: GedcomEvent, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.tag !== 'DATE') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    gedcomEvent.date = gedcomRecord.value
    gedcomEvent.dateDescriptive = gedcomEvent.date.replaceAll(/\w+/g, (s: string) => {
      switch (s) {
        case 'JAN': return 'January'
        case 'FEB': return 'February'
        case 'MAR': return 'March'
        case 'APR': return 'April'
        case 'MAY': return 'May'
        case 'JUN': return 'June'
        case 'JUL': return 'July'
        case 'AUG': return 'August'
        case 'SEP': return 'September'
        case 'OCT': return 'October'
        case 'NOV': return 'November'
        case 'DEC': return 'December'
        case 'AFT': return 'after'
        case 'BET': return 'between'
        case 'BEF': return 'before'
        case 'ABT': return 'about'
        case 'CAL': return 'calculated'
        case 'EST': return 'estimated'
        default: return s.toLowerCase()
      }
    }).replace(/^\w/, s => s.toUpperCase())

    // const dateHelper = '(?:(?:(\\d+) +)?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC) +)(\\d+)'
    // const dateValue = new RegExp(`^${dateHelper}$`)
    // const datePeriod = new RegExp(`^FROM +${dateHelper} +TO +${dateHelper}$`)
    // const dateRange = new RegExp(`^BET +${dateHelper} +AND +${dateHelper}$`)
    // const dateApprox = new RegExp(`^(FROM|TO|AFT|BEF|ABT|CAL|EST) +${dateHelper}$`)

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseEventShare (gedcomEvent: GedcomEvent, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.tag !== '_SHAR') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    const gedcomIndividualOrFamily = this.gedcomDatabase.individualOrFamily(gedcomRecord.value)
    gedcomIndividualOrFamily.events.push(gedcomEvent)

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'ROLE': break
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseEventType (gedcomEvent: GedcomEvent, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.tag !== 'TYPE') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    gedcomEvent.type = gedcomRecord.value

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseCitation (gedcomEvent: GedcomEvent, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.tag !== 'SOUR') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    const gedcomSource = this.gedcomDatabase.source(gedcomRecord.value)
    const gedcomCitation = new GedcomCitation(gedcomSource)
    gedcomEvent.citations.push(gedcomCitation)

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case '_TMPLT':
        case '_QUAL':
        case 'QUAY':
          break
        case 'OBJE':
          childRecord.children.forEach(this.reportUnparsedRecord.bind(this))
          gedcomCitation.obje = childRecord.value
          break
        case 'NAME':
          childRecord.children.forEach(this.reportUnparsedRecord.bind(this))
          gedcomCitation.name = childRecord.value
          break
        case 'NOTE':
          childRecord.children.forEach(this.reportUnparsedRecord.bind(this))
          gedcomCitation.note = childRecord.value
          break
        case 'PAGE':
          childRecord.children.forEach(this.reportUnparsedRecord.bind(this))
          gedcomCitation.page = childRecord.value
          break
        case 'DATA': this.parseCitationData(gedcomCitation, childRecord); break
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseCitationData (gedcomCitation: GedcomCitation, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.tag !== 'DATA') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value != null) throw new Error()

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'TEXT':
          childRecord.children.forEach(this.reportUnparsedRecord.bind(this))
          gedcomCitation.text ??= ''
          gedcomCitation.text += childRecord.value
          break
        default:
          this.reportUnparsedRecord(childRecord)
          break
      }
    }
  }

  parseSource (gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'SOUR') throw new Error()
    if (gedcomRecord.xref == null) throw new Error()
    if (gedcomRecord.value != null) throw new Error()

    const gedcomSource = this.gedcomDatabase.source(gedcomRecord.xref)

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'ABBR': this.parseSourceAbbr(gedcomSource, childRecord); break
        case 'TEXT': this.parseSourceText(gedcomSource, childRecord); break
        case 'TITL': this.parseSourceTitle(gedcomSource, childRecord); break
        case '_BIBL': this.parseSourceBibl(gedcomSource, childRecord); break
        default: this.reportUnparsedRecord(childRecord); break
      }
    }
  }

  parseSourceAbbr (gedcomSource: GedcomSource, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'SOUR.ABBR') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    gedcomSource.shortTitle = gedcomRecord.value

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          this.reportUnparsedRecord(childRecord)
          break
      }
    }
  }

  parseSourceBibl (gedcomSource: GedcomSource, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'SOUR._BIBL') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    gedcomSource.bibl = gedcomRecord.value

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          this.reportUnparsedRecord(childRecord)
          break
      }
    }
  }

  parseSourceText (gedcomSource: GedcomSource, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'SOUR.TEXT') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    gedcomSource.text = gedcomRecord.value

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          this.reportUnparsedRecord(childRecord)
          break
      }
    }
  }

  parseSourceTitle (gedcomSource: GedcomSource, gedcomRecord: GedcomRecord): void {
    if (gedcomRecord.abstag !== 'SOUR.TITL') throw new Error()
    if (gedcomRecord.xref != null) throw new Error()
    if (gedcomRecord.value == null) throw new Error()

    gedcomSource.fullTitle = gedcomRecord.value

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        default:
          this.reportUnparsedRecord(childRecord)
          break
      }
    }
  }
};
