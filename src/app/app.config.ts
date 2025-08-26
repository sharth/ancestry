import { routes } from "./app.routes";
import { NoRouteReuseStrategy } from "./no-reuse-route-strategy";
import type { ApplicationConfig } from "@angular/core";
import { provideZonelessChangeDetection } from "@angular/core";
import {
  RouteReuseStrategy,
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
    { provide: RouteReuseStrategy, useClass: NoRouteReuseStrategy },
    provideZonelessChangeDetection(),
  ],
};
