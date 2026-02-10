import { AncestryService } from "../../database/ancestry.service";
import { NavbarComponent } from "./navbar.component";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("NavbarComponent", () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let formattedAncestryService: AncestryService;

  beforeEach(async () => {
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

    formattedAncestryService = TestBed.inject(AncestryService);
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call clearDatabase when Clear Database button is clicked", async () => {
    // We added the button. Let's find it.
    // It has class btn-outline-danger and value "Clear Database"
    const buttons = fixture.nativeElement.querySelectorAll(
      'input[type="button"]',
    );
    let clearButton;
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].value === "Clear Database") {
        clearButton = buttons[i];
        break;
      }
    }
    expect(clearButton).toBeTruthy();

    // Determine if we can mock window.location.reload.
    // It's hard to mock window.location in JSDom without setup.
    // But we can check if service method is called.
    // Since our implementation calls window.location.reload(), it might cause page reload in test env if not mocked?
    // JSDom usually ignores reload or logs error.
    // Let's spy on window.location.reload if possible.
    // vi.spyOn(window.location, 'reload'); // This might fail if location is read-only.
    // For now just check service call.

    Object.defineProperty(window, "location", {
      writable: true,
      value: { reload: vi.fn() },
    });

    clearButton.click();
    expect(formattedAncestryService.clearDatabase).toHaveBeenCalled();
    await fixture.whenStable();
    expect(window.location.reload).toHaveBeenCalled();
  });
});
