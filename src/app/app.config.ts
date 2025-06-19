import { routes } from "./app.routes";
import {
  type ApplicationConfig,
  provideZonelessChangeDetection,
} from "@angular/core";
import { provideAnimations } from "@angular/platform-browser/animations";
import {
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
  withInMemoryScrolling,
} from "@angular/router";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withHashLocation(),
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
      }),
    ),
    provideZonelessChangeDetection(),
    provideAnimations(),
  ],
};
