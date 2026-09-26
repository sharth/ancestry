import type { ApplicationConfig } from "@angular/core";
import {
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
  withInMemoryScrolling,
} from "@angular/router";
import { routes } from "./app.routes";

declare const USE_HASH_LOCATION: boolean;

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      ...(USE_HASH_LOCATION ? [withHashLocation()] : []),
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
      }),
    ),
  ],
};

console.log(USE_HASH_LOCATION);
