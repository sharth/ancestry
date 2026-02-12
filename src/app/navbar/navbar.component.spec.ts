import { AncestryService } from "../../database/ancestry.service";
import { NavbarComponent } from "./navbar.component";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("NavbarComponent", () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let ancestryService: AncestryService;
  let clearDatabaseButton: HTMLInputElement;

  beforeEach(async () => {
    vi.stubGlobal("location", { reload: vi.fn() });
    const spy = {
      openGedcom: vi.fn(),
      requestPermissions: vi.fn(),
      clearDatabase: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: AncestryService, useValue: spy },
        provideRouter([]),
      ],
    }).compileComponents();

    ancestryService = TestBed.inject(AncestryService);
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const clearDatabaseButtonOrNull = (
      fixture.nativeElement as HTMLElement
    ).querySelector("#clearDatabaseButton");
    expect(clearDatabaseButtonOrNull).toBeTruthy();
    expect(clearDatabaseButtonOrNull).toBeInstanceOf(HTMLInputElement);
    clearDatabaseButton = clearDatabaseButtonOrNull as HTMLInputElement;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call clearDatabase when Clear Database button is clicked", async () => {
    clearDatabaseButton.click();
    expect(ancestryService.clearDatabase).toHaveBeenCalled();
    await fixture.whenStable();
    expect(window.location.reload).toHaveBeenCalled();
  });
});
