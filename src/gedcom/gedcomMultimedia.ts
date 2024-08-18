import { ancestryService } from "../app/ancestry.service";
import { GedcomRecord } from "./gedcomRecord";

export class GedcomMultimedia {
  constructor(public xref: string) {}

  filePath?: string;
  mediaType?: string;
};

export function constructGedcomMultimediaFromGedcomRecord(record: GedcomRecord): GedcomMultimedia {
    if (record.abstag !== 'OBJE') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    const gedcomMultimedia = new GedcomMultimedia(record.xref);
    
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
                            grandchildRecord.children.forEach((greatgrandchildRecord) => { ancestryService.reportUnparsedRecord(greatgrandchildRecord); })
                            break;
                        default:
                            ancestryService.reportUnparsedRecord(grandchildRecord)
                            break;
                    }
                }
                break;
            default:
                ancestryService.reportUnparsedRecord(childRecord);
                break;
        }
    }

    return gedcomMultimedia;
}

export function serializeGedcomMultimediaToGedcomRecord(gedcomMultimedia: GedcomMultimedia): GedcomRecord {
    return new GedcomRecord(0, gedcomMultimedia.xref, "OBJE", "OBJE", undefined, [
        new GedcomRecord(1, undefined, "FILE", "OBJE.FILE", gedcomMultimedia.filePath, [
            new GedcomRecord(2, undefined, "FORM", "OBJE.FILE.FORM", gedcomMultimedia.mediaType, [])
        ])
    ]);
}