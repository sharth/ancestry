import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AncestryService } from "../../database/ancestry.service";
import { HelloComponent } from "./hello.component";

describe("HelloComponent", () => {
  let component: HelloComponent;
  let fixture: ComponentFixture<HelloComponent>;
  let ancestryService: AncestryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelloComponent],
    }).compileComponents();

    ancestryService = TestBed.inject(AncestryService);
    fixture = TestBed.createComponent(HelloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
