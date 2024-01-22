import { computed, signal, Injectable } from '@angular/core';

export class ChunkStreamByNewline extends TransformStream {
  constructor() {
    let incomplete_line = '';
    super({
      start(controller) {
        incomplete_line = '';
      },
      async transform(chunk, controller) {
        var lines = (incomplete_line + chunk).split(/\r?\n/);
        incomplete_line = lines.pop() || "";
        for (var line of lines) {
          controller.enqueue(line);
        }
      },
      flush(controller) {
        if (incomplete_line) {
          controller.enqueue(incomplete_line);
        }
      }
    });
  }
};

export class ChunkStreamByRecord extends TransformStream {
  constructor() {
    let ladder = new Array<Record>;
    super({
      start(controller) {
        ladder.length = 0;
      },
      async transform(chunk: string, controller) {
        const match = chunk.match(/^([0-9]+) *(@[^@]+@)? *([A-Za-z0-9_]+) *(.+)?$/);
        if (!match) throw new Error();
        const level = parseInt(match[1], 10);
        const [xref, tag, value] = match.slice(2);
        const abstag = new Array(...ladder.slice(0, level).map(record => record.tag), tag).join('.')
        const record = { level: level, xref: xref, tag: tag, abstag: abstag, value: value, children: [] };
        if (record.level == 0) {
          if (ladder.length)
            controller.enqueue(ladder[0]);
          ladder = [record];
        } else if (record.tag == 'CONC') {
          ladder.at(-1)!.value += record.value;
        } else if (record.tag == 'CONT') {
          ladder.at(-1)!.value += '\n' + record.value;
        } else {
          ladder.length = record.level;
          ladder.at(-1)!.children.push(record);
          ladder.push(record);
        }
      },
      flush(controller) {
        if (ladder.length)
          controller.enqueue(ladder[0]);
      }
    });
  }
};

export class GedcomStreamToDatabase extends WritableStream {
  constructor(gedcom_database: Database) {
    const gedcom_parser = new Parser(gedcom_database);
    super({
      write(gedcom_record) {
        gedcom_parser.parse(gedcom_record)
      },
      close() { },
      abort(err) {
        console.error('GedcomStreamToDatabase error:', err);
      },
    });
  }
};

interface Record {
  level: number;
  xref?: string;
  tag: string,
  abstag: string,
  value?: string,
  children: Array<Record>
};

export class Individual {
  constructor(public xref: string) { }
  events: Array<Event> = [];
  name?: string;
  surname?: string;
  sex?: ('Male' | 'Female');
  familySearchId?: string;
};

export class Family {
  constructor(public xref: string) { }
  husband?: Individual;
  wife?: Individual;
  children = new Array<Individual>();
  events = new Array<Event>();
};

export class Source {
  constructor(public xref: string) { }
  abbr?: string;
  text?: string;
  titl?: string;
  bibl?: string;
};

export class Event {
  description?: string;
  address?: string;
  place?: string;
  cause?: string;
  date?: string;
  value?: string;
  citations = new Array<Citation>();
};

export class Citation {
  constructor(public source: Source) { }
  name?: string;
  obje?: string;
  note?: string;
  text?: string;
  page?: string;
}

export class Database {
  individuals = new Map<string, Individual>();
  families = new Map<string, Family>();
  sources = new Map<string, Source>();

  individual(xref: string) {
    if (!xref.startsWith("@I")) throw new Error();
    if (!this.individuals.has(xref))
      this.individuals.set(xref, new Individual(xref));
    return this.individuals.get(xref)!;
  }

  family(xref: string) {
    if (!xref.startsWith("@F")) throw new Error();
    if (!this.families.has(xref))
      this.families.set(xref, new Family(xref));
    return this.families.get(xref)!;
  }

  individualOrFamily(xref: string): (Individual | Family) {
    if (xref.startsWith("@I")) return this.individual(xref);
    else if (xref.startsWith("@F")) return this.family(xref);
    else throw new Error();
  }

  source(xref: string) {
    if (!xref.startsWith("@S")) throw new Error();
    if (!this.sources.has(xref))
      this.sources.set(xref, new Source(xref));
    return this.sources.get(xref)!;
  }
};

export class Parser {
  gedcom_database: Database;
  unparsed_tags = new Set<string>;

  constructor(gedcom_database: Database) {
    this.gedcom_database = gedcom_database;
  }

  reportUnparsedRecord(gedcom_record: Record) {
    if (!this.unparsed_tags.has(gedcom_record.abstag)) {
      console.warn('Unparsed tag ', gedcom_record.abstag);
      this.unparsed_tags.add(gedcom_record.abstag);
    }
  }

  parse(gedcom_record: Record) {
    switch (gedcom_record.tag) {
      case 'INDI':
        this.parseIndividual(gedcom_record);
        break;
      case 'FAM':
        this.parseFamily(gedcom_record);
        break;
      case 'SOUR':
        this.parseSource(gedcom_record);
        break;
      default:
        this.reportUnparsedRecord(gedcom_record);
        break;
    }
  }

  parseIndividual(gedcom_record: Record) {
    if (gedcom_record.tag != "INDI") throw new Error();
    if (gedcom_record.level != 0) throw new Error();
    if (gedcom_record.xref == undefined) throw new Error();
    if (gedcom_record.value != undefined) throw new Error();

    const gedcom_individual: Individual = this.gedcom_database.individual(gedcom_record.xref);

    const parseName = (gedcom_record: Record) => {
      if (gedcom_record.xref != undefined) throw new Error();
      // if (gedcom_record.value != undefined) throw new Error();

      if (!gedcom_individual.name) {
        gedcom_individual.name = gedcom_record.value;
        gedcom_individual.surname = gedcom_record.value?.match(`/(.*)/`)?.[1];
      }
      this.parseEvent(gedcom_individual, gedcom_record);
    };

    const parseSex = (gedcom_record: Record) => {
      if (gedcom_record.xref != undefined) throw new Error();
      if (gedcom_record.value == undefined) throw new Error();

      switch (gedcom_record.value) {
        case 'M': gedcom_individual.sex ??= 'Male'; break;
        case 'F': gedcom_individual.sex ??= 'Female'; break;
      }
      this.parseEvent(gedcom_individual, gedcom_record);
    }

    for (const child_record of gedcom_record.children) {
      switch (child_record.tag) {
        case 'BAPM': case 'BIRT': case 'BURI': case 'CENS': case 'DEAT':
        case 'EDUC': case 'EMIG': case 'EVEN': case 'IMMI': case 'MARB':
        case 'MARR': case 'NATU': case 'OCCU': case 'PROB': case 'RELI':
        case 'RESI': case 'RETI': case 'WILL': case 'DIV': case 'SSN':
          this.parseEvent(gedcom_individual, child_record);
          break;
        case 'NAME':
          parseName(child_record);
          break;
        case 'SEX':
          parseSex(child_record);
          break;
        case 'FAMS':
        case 'FAMC':
          // Let's just use the links inside the Family record.
          break;
        case '_FSFTID':
          child_record.children.forEach(this.reportUnparsedRecord, this);
          gedcom_individual.familySearchId ??= gedcom_record.value;
          break;
        default:
          this.reportUnparsedRecord(child_record);
          break;
      }
    }
  }

  parseFamily(gedcom_record: Record) {
    if (gedcom_record.tag != "FAM") throw new Error();
    if (gedcom_record.level != 0) throw new Error();
    if (gedcom_record.xref == undefined) throw new Error();
    if (gedcom_record.value != undefined) throw new Error();

    const gedcom_family: Family = this.gedcom_database.family(gedcom_record.xref);

    const parseHusband = (gedcom_record: Record) => {
      if (gedcom_record.xref != undefined) throw new Error();
      if (gedcom_record.value == undefined) throw new Error();
      gedcom_record.children.forEach(this.reportUnparsedRecord, this);
      gedcom_family.husband = this.gedcom_database.individual(gedcom_record.value);
    };

    const parseWife = (gedcom_record: Record) => {
      if (gedcom_record.xref != undefined) throw new Error();
      if (gedcom_record.value == undefined) throw new Error();
      gedcom_record.children.forEach(this.reportUnparsedRecord, this);
      gedcom_family.wife = this.gedcom_database.individual(gedcom_record.value);
    };

    const parseChild = (gedcom_record: Record) => {
      if (gedcom_record.xref != undefined) throw new Error();
      if (gedcom_record.value == undefined) throw new Error();
      gedcom_record.children.forEach(this.reportUnparsedRecord, this);
      gedcom_family.children.push(this.gedcom_database.individual(gedcom_record.value));
    }

    for (const child_record of gedcom_record.children) {
      switch (child_record.tag) {
        case 'HUSB':
          parseHusband(child_record);
          break;
        case 'WIFE':
          parseWife(child_record);
          break;
        case 'CHIL':
          parseChild(child_record);
          break;
        case 'DIV':
        case 'EVEN':
        case 'MARR':
        case 'MARB':
          this.parseEvent(gedcom_family, child_record);
          break;
        default:
          this.reportUnparsedRecord(child_record);
          break;
      }
    }
  }

  parseEvent(gedcom_container: (Individual | Family), gedcom_record: Record) {
    if (gedcom_record.xref) throw new Error();

    const gedcom_event = new Event();
    gedcom_container.events.push(gedcom_event);

    gedcom_event.description = new Map([
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
    ]).get(gedcom_record.tag) || gedcom_record.tag;

    const shareEvent = (gedcom_record: Record) => {
      if (gedcom_record.xref != undefined) throw new Error();
      if (gedcom_record.value == undefined) throw new Error();

      const gedcom_friend = this.gedcom_database.individualOrFamily(gedcom_record.value);
      gedcom_friend.events.push(gedcom_event);

      for (const child_record of gedcom_record.children) {
        switch (child_record.tag) {
          case 'ROLE':
            break;
          default:
            this.reportUnparsedRecord(child_record);
            break;
        }
      }
    };

    const sourceEvent = (gedcom_record: Record) => {
      if (gedcom_record.xref != undefined) throw new Error();
      if (gedcom_record.value == undefined) throw new Error();

      const gedcom_source = this.gedcom_database.source(gedcom_record.value);
      const gedcom_citation = new Citation(gedcom_source);
      gedcom_event.citations.push(gedcom_citation);

      for (const child_record of gedcom_record.children) {
        switch (child_record.tag) {
          case '_TMPLT':
          case '_QUAL':
          case 'QUAY':
            break;
          case 'OBJE':
            // child_record.children.forEach(this.reportUnparsedRecord, this);
            gedcom_citation.obje = child_record.value;
            break;
          case 'NAME':
            child_record.children.forEach(this.reportUnparsedRecord, this);
            gedcom_citation.name = child_record.value;
            break;
          case 'NOTE':
            child_record.children.forEach(this.reportUnparsedRecord, this);
            gedcom_citation.note = child_record.value;
            break;
          case 'PAGE':
            child_record.children.forEach(this.reportUnparsedRecord, this);
            gedcom_citation.page = child_record.value;
            break;
          case 'DATA':
            if (child_record.xref != undefined) throw new Error();
            if (child_record.value != undefined) throw new Error();
            for (let grandchild_record of child_record.children) {
              switch (grandchild_record.tag) {
                case 'TEXT':
                  grandchild_record.children.forEach(this.reportUnparsedRecord, this);
                  gedcom_citation.text ??= '';
                  gedcom_citation.text += grandchild_record.value;
                  break;
                default:
                  this.reportUnparsedRecord(grandchild_record);
                  break;
              }
            }
            break;
          default:
            this.reportUnparsedRecord(child_record);
            break;
        }
      }
    }

    const dateEvent = (gedcom_record: Record) => {
      if (gedcom_record.xref != undefined) throw new Error();
      if (gedcom_record.value == undefined) throw new Error();
      gedcom_record.children.forEach(this.reportUnparsedRecord, this);
      gedcom_event.date = gedcom_record.value;
    };

    for (const child_record of gedcom_record.children) {
      switch (child_record.tag) {
        case '_SHAR':
          shareEvent(child_record);
          break;
        case 'SOUR':
          sourceEvent(child_record);
          break;
        case 'DATE':
          dateEvent(child_record);
          break;
        case 'TYPE':
          child_record.children.forEach(this.reportUnparsedRecord, this);
          gedcom_event.description = child_record.value;
          break;
        case 'ADDR':
          child_record.children.forEach(this.reportUnparsedRecord, this);
          gedcom_event.address = child_record.value;
          break;
        case 'PLAC':
          child_record.children.forEach(this.reportUnparsedRecord, this);
          gedcom_event.place = child_record.value;
          break;
        case 'CAUS':
          child_record.children.forEach(this.reportUnparsedRecord, this);
          gedcom_event.cause = child_record.value;
          break;
        case 'TAG':
          child_record.children.forEach(this.reportUnparsedRecord, this);
          gedcom_event.description = child_record.value;
          break;
        case '_SENT': 
        case '_SDATE':
        case '_PRIM':
        case '_PROOF':
        case 'NOTE':
          break;
        default:
          this.reportUnparsedRecord(child_record);
          break;
      }
    }
  }

  parseSource(gedcom_record: Record) {
    if (!gedcom_record.xref) throw new Error();
    if (gedcom_record.value) throw new Error();

    const gedcom_source = this.gedcom_database.source(gedcom_record.xref);

    for (const child_record of gedcom_record.children) {
      switch (child_record.tag) {
        case 'ABBR':
          child_record.children.forEach(this.reportUnparsedRecord, this);
          gedcom_source.abbr ??= child_record.value;
          break;
        case 'TEXT':
          child_record.children.forEach(this.reportUnparsedRecord, this);
          gedcom_source.text ??= child_record.value;
          break;
        case 'TITL':
          child_record.children.forEach(this.reportUnparsedRecord, this);
          gedcom_source.titl ??= child_record.value;
          break;
        case '_BIBL':
          child_record.children.forEach(this.reportUnparsedRecord, this);
          gedcom_source.bibl ??= child_record.value;
          break;
        default:
          this.reportUnparsedRecord(child_record);
          break;
      }
    }
  }
};

@Injectable({
  providedIn: 'root',
})
export class AncestryService {
  readonly database = signal(new Database());
  readonly individuals = computed(() => Array.from(this.database().individuals.values()));
  readonly families = computed(() => Array.from(this.database().families.values()));
  readonly sources = computed(() => Array.from(this.database().sources.values()));

  constructor() {
    const database = new Database();
    const parser = new Parser(database);
    const stream = new ReadableStream<string>({
      pull(controller) {
        const text = localStorage.getItem('text');
        if (text) controller.enqueue(text);
        controller.close();
      }
    });
    stream
      .pipeThrough(new ChunkStreamByNewline())
      .pipeThrough(new ChunkStreamByRecord())
      .pipeTo(new WritableStream({
        write(gedcom_record: Record) {
          parser.parse(gedcom_record)
        },
      }))
      .then(() => {
        this.database.set(database);
      });
  }

  reset() {
    localStorage.removeItem('text');
    this.database.set(new Database());
  }

  resetAndLoadFile(file: File) {
    const streams = file.stream().tee();

    let text = '';
    streams[0]
      .pipeThrough(new TextDecoderStream())
      .pipeTo(new WritableStream({
        write(stuff: string) {
          text += stuff
        },
      }))
      .then(() => {
        localStorage.setItem('text', text);
      });

    const database = new Database();
    const parser = new Parser(database);
    streams[1]
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new ChunkStreamByNewline())
      .pipeThrough(new ChunkStreamByRecord())
      .pipeTo(new WritableStream({
        write(gedcom_record: Record) {
          parser.parse(gedcom_record)
        },
      }))
      .then(() => {
        this.database.set(database)
      });
  }

  individual(xref: string) {
    if (!this.database().individuals.has(xref))
      throw new Error(`No individual with xref '${xref}'`);
    return this.database().individuals.get(xref)!;
  }

  source(xref: string) {
    if (!this.database().sources.has(xref))
      throw new Error(`No source with xref '${xref}`);
    return this.database().sources.get(xref)!;
  }
}
