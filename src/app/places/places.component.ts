import { AncestryService } from "../../database/ancestry.service";
import { gedcomEventTags } from "../../gedcom/gedcomEvent";
import { fullname } from "../../gedcom/gedcomIndividual";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { RouterLink } from "@angular/router";

interface EventItem {
  eventType: string;
  date: string;
  linkXref?: string;
  linkName?: string;
  isFamily?: boolean;
}

interface AddressGroup {
  name: string;
  events: EventItem[];
}

interface PlaceGroup {
  name: string;
  addresses: AddressGroup[];
}

@Component({
  selector: "app-places",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./places.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacesComponent {
  readonly ancestryService = inject(AncestryService);

  readonly places = computed(() => {
    const database = this.ancestryService.ancestryDatabase();
    if (!database) return [];

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
      for (const event of individual.events) {
        if (event.place || event.address) {
          addEvent(event.place, event.address, {
            eventType: gedcomEventTags.get(event.tag) ?? event.tag,
            date: event.date.value,
            linkXref: individual.xref,
            linkName: name,
            isFamily: false,
          });
        }
      }
    }

    for (const family of Object.values(database.families)) {
      for (const event of family.events) {
        if (event.place || event.address) {
          addEvent(event.place, event.address, {
            eventType: gedcomEventTags.get(event.tag) ?? event.tag,
            date: event.date.value,
            linkXref: family.xref,
            linkName: `Family ${family.xref}`,
            isFamily: true,
          });
        }
      }
    }

    const sortedPlaces: PlaceGroup[] = Array.from(placeMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([placeName, addressesMap]) => {
        const sortedAddresses: AddressGroup[] = Array.from(
          addressesMap.entries(),
        )
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([addressName, events]) => ({
            name: addressName,
            events: events,
          }));
        return { name: placeName, addresses: sortedAddresses };
      });

    return sortedPlaces;
  });
}
