import { Component, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";

import {
  AncestryService,
  findGedcomFilenames,
} from "../../database/ancestry.service";
import { fullname, surname } from "../../gedcom/gedcomIndividual";
import { IdGenerator } from "../../util/id-generator";

@Component({
  selector: "app-settings",
  imports: [],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.css",
})
export class SettingsComponent {
  readonly id = inject(IdGenerator).getId("settings");
  private readonly ancestryService = inject(AncestryService);
  private readonly router = inject(Router);

  readonly gedcomResource = this.ancestryService.gedcomResource;

  // Everyone in the loaded file, as root person choices, sorted by surname
  // then full name.
  readonly rootIndividualChoices = computed(() =>
    Object.values(this.gedcomResource.value()?.gedcomDatabase.individuals ?? {})
      .map((individual) => ({
        xref: individual.xref,
        surname: surname(individual),
        name: fullname(individual) || "Unnamed Person",
      }))
      .sort(
        (a, b) =>
          a.surname.localeCompare(b.surname) ||
          a.name.localeCompare(b.name) ||
          a.xref.localeCompare(b.xref),
      ),
  );

  // Set while a chosen directory contains more than one GEDCOM file at its
  // root, so the user needs to pick which one to use.
  readonly directoryGedcomChoices = signal<
    | { directoryHandle: FileSystemDirectoryHandle; filenames: string[] }
    | undefined
  >(undefined);
  readonly directoryError = signal<string | undefined>(undefined);

  async useExampleData() {
    await this.ancestryService.openBuiltin();
  }

  async openGedcom() {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Gedcom",
            accept: { "text/plain": [".ged"] },
          },
        ],
      });
      await this.ancestryService.openGedcom(fileHandle);
    } catch (err) {
      console.error(err);
    }
  }

  async chooseDirectory() {
    this.directoryError.set(undefined);
    this.directoryGedcomChoices.set(undefined);
    try {
      const directoryHandle = await window.showDirectoryPicker({
        id: "ancestry-directory",
        mode: "read",
      });
      const filenames = await findGedcomFilenames(directoryHandle);

      if (filenames.length === 0) {
        this.directoryError.set(
          "No GEDCOM (.ged) files were found in that folder.",
        );
        return;
      }

      if (filenames.length === 1 && filenames[0] !== undefined) {
        await this.ancestryService.openDirectory(directoryHandle, filenames[0]);
        return;
      }

      this.directoryGedcomChoices.set({ directoryHandle, filenames });
    } catch (err) {
      console.error(err);
    }
  }

  async chooseGedcomInDirectory(filename: string) {
    const choices = this.directoryGedcomChoices();
    if (!choices) {
      return;
    }
    await this.ancestryService.openDirectory(choices.directoryHandle, filename);
    this.directoryGedcomChoices.set(undefined);
  }

  async setRootIndividual(xref: string) {
    try {
      await this.ancestryService.setRootIndividualXref(xref || undefined);
    } catch (err) {
      console.error(err);
    }
  }

  async requestPermissions() {
    try {
      await this.ancestryService.requestPermissions();
    } catch (err) {
      console.error(err);
    }
  }

  async clearDatabase() {
    try {
      await this.ancestryService.clearDatabase();
    } catch (err) {
      console.error(err);
    }
  }

  async enterApp() {
    await this.router.navigate(["/"]);
  }
}
