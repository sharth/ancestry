import type { ApplicationConfig } from "@angular/core";
import {
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
  withInMemoryScrolling,
  withRouterResources,
} from "@angular/router";

import { routes } from "./app.routes";

declare const USE_HASH_LOCATION: boolean;

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterResources(),
      ...(USE_HASH_LOCATION ? [withHashLocation()] : []),
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
      }),
    ),
  ],
};
