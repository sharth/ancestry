import { NgModule, provideZonelessChangeDetection } from "@angular/core";
import { getTestBed } from "@angular/core/testing";
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from "@angular/platform-browser/testing";

@NgModule({
  providers: [provideZonelessChangeDetection()],
})
class ZonelessTestModule {}

getTestBed().initTestEnvironment(
  [BrowserTestingModule, ZonelessTestModule],
  platformBrowserTesting(),
);
