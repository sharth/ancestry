import { bootstrapApplication } from "@angular/platform-browser";
import { setAutoFreeze } from "immer";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";

// Don't use Object.freeze on immer produced objects, to preserve compatability with Angular.
setAutoFreeze(false);

bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => {
  console.error(err);
});
