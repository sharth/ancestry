import { Injectable } from "@angular/core";
import {
  RouteReuseStrategy,
  type ActivatedRouteSnapshot,
  type DetachedRouteHandle,
} from "@angular/router";

@Injectable()
export class NoRouteReuseStrategy extends RouteReuseStrategy {
  override shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  override shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  override store(
    route: ActivatedRouteSnapshot,
    handle: DetachedRouteHandle | null,
  ): void {}

  override retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }

  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    current: ActivatedRouteSnapshot,
  ): boolean {
    return false;
  }
}
