import { AncestryService } from "../../database/ancestry.service";
import { HelloComponent } from "./hello.component";
import { signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("HelloComponent", () => {
  let component: HelloComponent;
  let fixture: ComponentFixture<HelloComponent>;
  let formattedAncestryService: AncestryService; // Use the real type or a partial mock type

  beforeEach(async () => {
    // Create a mock for AncestryService
    const spy = {
      openGedcom: vi.fn(),
      openMultimedia: vi.fn(),
      clearDatabase: vi.fn(),
      gedcomResource: {
        value: signal(undefined),
        reload: vi.fn(),
        isLoading: signal(false),
      },
    };

    await TestBed.configureTestingModule({
      imports: [HelloComponent],
      providers: [{ provide: AncestryService, useValue: spy }],
    }).compileComponents();

    formattedAncestryService = TestBed.inject(AncestryService);
    fixture = TestBed.createComponent(HelloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call openGedcom when button is clicked", () => {
    // Determine if button exists. Since resources are undefined by default mock, it shows "Load GEDCOM File" button.
    const button = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>("button.btn-primary");
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain("Load GEDCOM File");

    button?.click();
    expect(formattedAncestryService.openGedcom).toHaveBeenCalled();
  });
});
