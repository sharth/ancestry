import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  filterTrivialGedcomRecords,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";

export interface GedcomMultimediaCrop {
  top?: number;
  left?: number;
  height?: number;
  width?: number;
}

export interface GedcomMultimediaLink {
  xref: string;
  title: string;
  crop: GedcomMultimediaCrop | undefined;
}

export function newGedcomMultimediaLink(
  fieldsToUpdate: Partial<GedcomMultimediaLink> = {},
): GedcomMultimediaLink {
  return {
    xref: "",
    title: "",
    crop: undefined,
    ...fieldsToUpdate,
  };
}

function parseGedcomMultimediaCropInteger(
  record: GedcomRecord,
): number | undefined {
  if (record.value == "") return undefined;
  const value = Number.parseInt(record.value, 10);
  if (Number.isNaN(value)) throw new Error(`Invalid integer: ${record.value}`);
  return value;
}

export function parseGedcomMultimediaLink(
  record: GedcomRecord,
): GedcomMultimediaLink {
  if (record.tag !== "OBJE") throw new Error();
  if (record.xref != "") throw new Error();
  if (record.value == "") throw new Error();

  const gedcomMultimediaLink = newGedcomMultimediaLink({
    xref: record.value,
  });

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "TITL":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        if (childRecord.children.length) throw new Error();
        if (gedcomMultimediaLink.title !== "") throw new Error();

        gedcomMultimediaLink.title = childRecord.value;
        break;

      case "CROP":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value != "") throw new Error();
        if (gedcomMultimediaLink.crop) throw new Error();

        gedcomMultimediaLink.crop = {};
        for (const cropChildRecord of childRecord.children) {
          switch (cropChildRecord.tag) {
            case "TOP":
              gedcomMultimediaLink.crop.top =
                parseGedcomMultimediaCropInteger(cropChildRecord);
              break;
            case "LEFT":
              gedcomMultimediaLink.crop.left =
                parseGedcomMultimediaCropInteger(cropChildRecord);
              break;
            case "HEIGHT":
              gedcomMultimediaLink.crop.height =
                parseGedcomMultimediaCropInteger(cropChildRecord);
              break;
            case "WIDTH":
              gedcomMultimediaLink.crop.width =
                parseGedcomMultimediaCropInteger(cropChildRecord);
              break;
            default:
              reportUnparsedRecord(cropChildRecord);
              break;
          }
        }
        break;

      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomMultimediaLink;
}

export function serializeGedcomMultimediaLink(
  gedcomMultimediaLink: GedcomMultimediaLink,
): GedcomRecord {
  return newGedcomRecord({
    tag: "OBJE",
    value: gedcomMultimediaLink.xref,
    children: filterTrivialGedcomRecords([
      gedcomMultimediaLink.crop ?
        newGedcomRecord({
          tag: "CROP",
          children: filterTrivialGedcomRecords([
            newGedcomRecord({
              tag: "TOP",
              value: gedcomMultimediaLink.crop.top?.toString() ?? "",
            }),
            newGedcomRecord({
              tag: "LEFT",
              value: gedcomMultimediaLink.crop.left?.toString() ?? "",
            }),
            newGedcomRecord({
              tag: "HEIGHT",
              value: gedcomMultimediaLink.crop.height?.toString() ?? "",
            }),
            newGedcomRecord({
              tag: "WIDTH",
              value: gedcomMultimediaLink.crop.width?.toString() ?? "",
            }),
          ]),
        })
      : null,
      newGedcomRecord({ tag: "TITL", value: gedcomMultimediaLink.title }),
    ]),
  });
}
