import {
  type ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import {
  provideRouter,
  withComponentInputBinding,
  withHashLocation,
  withInMemoryScrolling,
  withRouterResources,
} from "@angular/router";

import { routes } from "./app.routes";
import { ReportingErrorHandler } from "./error-banner/error-reporter";

declare const USE_HASH_LOCATION: boolean;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: ReportingErrorHandler },
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
