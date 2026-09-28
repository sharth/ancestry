import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  gedcomFamilyAttributes,
  gedcomFamilyEvents,
  gedcomIndividualAttributes,
  gedcomIndividualEvents,
} from "../../gedcom/gedcomFactMetadata";
import { fullname } from "../../gedcom/gedcomIndividual";

export interface EventItem {
  eventType: string;
  date: string;
  linkXref?: string;
  linkName?: string;
  isFamily?: boolean;
}

export interface AddressGroup {
  name: string;
  events: EventItem[];
}

export interface PlaceGroup {
  name: string;
  addresses: AddressGroup[];
}

/** Deterministic, URL-safe anchor/route id for a place name. */
export function placeSlug(placeName: string): string {
  return (
    "place-" +
    placeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

/** Every individual/family event that has a place or address, grouped by
 * place name and then by address, sorted alphabetically at both levels. */
export function computePlaceGroups(database: GedcomDatabase): PlaceGroup[] {
  const placeMap = new Map<string, Map<string, EventItem[]>>();

  const addEvent = (place: string, address: string, event: EventItem) => {
    // If both are empty, we might not want to include them, but the loop checks for this.
    const p = place !== "" ? place : "[Unknown Place]";
    const a = address !== "" ? address : "[Unknown Address]";

    let pMap = placeMap.get(p);
    if (!pMap) {
      pMap = new Map();
      placeMap.set(p, pMap);
    }

    let aMap = pMap.get(a);
    if (!aMap) {
      aMap = [];
      pMap.set(a, aMap);
    }

    aMap.push(event);
  };

  for (const individual of Object.values(database.individuals)) {
    const name = fullname(individual);
    for (const event of individual.facts) {
      if (event.place || event.address) {
        addEvent(event.place, event.address, {
          eventType:
            gedcomIndividualAttributes[event.tag]?.humanReadableDescription ??
            gedcomIndividualEvents[event.tag]?.humanReadableDescription ??
            event.tag,
          date: event.date.value,
          linkXref: individual.xref,
          linkName: name,
          isFamily: false,
        });
      }
    }
  }

  for (const family of Object.values(database.families)) {
    for (const event of family.facts) {
      if (event.place || event.address) {
        addEvent(event.place, event.address, {
          eventType:
            gedcomFamilyAttributes[event.tag]?.humanReadableDescription ??
            gedcomFamilyEvents[event.tag]?.humanReadableDescription ??
            event.tag,
          date: event.date.value,
          linkXref: family.xref,
          linkName: `Family ${family.xref}`,
          isFamily: true,
        });
      }
    }
  }

  return Array.from(placeMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([placeName, addressesMap]) => {
      const sortedAddresses: AddressGroup[] = Array.from(addressesMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([addressName, events]) => ({
          name: addressName,
          events: events,
        }));
      return { name: placeName, addresses: sortedAddresses };
    });
}
