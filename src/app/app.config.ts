import { type ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core'
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router'
import { routes } from './app.routes'
import { provideAnimations } from '@angular/platform-browser/animations'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withHashLocation()),
    provideExperimentalZonelessChangeDetection(),
    provideAnimations()
  ]
}
