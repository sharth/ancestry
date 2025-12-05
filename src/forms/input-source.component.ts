import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomDate } from "../gedcom/gedcomDate";
import type { GedcomSource } from "../gedcom/gedcomSource";
import { InputMultimediaLinksComponent } from "./input-multimedia-links.component";
import { InputRepositoryLinksComponent } from "./input-repository-links.component";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";
import type { OnInit } from "@angular/core";
import { Component, effect, input, model, signal } from "@angular/core";
import { Field, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-source",
  imports: [
    Field,
    InputMultimediaLinksComponent,
    InputRepositoryLinksComponent,
    InputUnknownRecordsComponent,
  ],
  templateUrl: "./input-source.component.html",
  styleUrl: "./input.component.css",
})
export class InputSourceComponent implements OnInit {
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly xref = input.required<string>();

  readonly source = signal<GedcomSource>({
    xref: "",
    abbr: "",
    title: "",
    text: "",
    repositoryLinks: [],
    multimediaLinks: [],
    unknownRecords: [],
  });
  readonly form = form(this.source);

  readonly updateAngularDatabase = effect(() => {
    const now: GedcomDate = {
      value: new Date()
        .toLocaleString("en-gb", { dateStyle: "medium" })
        .toLocaleUpperCase(),
    };
    const source = {
      ...this.source(),
      changeDate: { date: now },
    };
    if (source.xref !== "") {
      this.ancestryDatabase.update((ancestryDatabase) => {
        const sources = new Map(ancestryDatabase.sources);
        sources.set(source.xref, source);
        return { ...ancestryDatabase, sources };
      });
    }
  });

  ngOnInit(): void {
    this.source.set(
      this.ancestryDatabase().sources.get(this.xref()) ?? {
        xref: this.xref(),
        abbr: "",
        title: "",
        text: "",
        repositoryLinks: [],
        multimediaLinks: [],
        unknownRecords: [],
      },
    );
  }
}
