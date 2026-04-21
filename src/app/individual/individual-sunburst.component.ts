import type { AncestryDatabase } from "../../database/ancestry.service";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { fullname } from "../../gedcom/gedcomIndividual";
import type { ElementRef } from "@angular/core";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  viewChild,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import * as d3 from "d3";

interface SunburstNode {
  individual: GedcomIndividual;
  generation: number;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  color: string;
  arc: string;
}

@Component({
  selector: "app-individual-sunburst",
  imports: [RouterLink],
  templateUrl: "./individual-sunburst.component.html",
  styleUrl: "./individual.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndividualSunburstComponent {
  readonly individual = input.required<GedcomIndividual>();
  readonly ancestryDatabase = input.required<AncestryDatabase>();

  private readonly svgElement =
    viewChild.required<ElementRef<SVGSVGElement>>("svgElement");
  private readonly zoomGroup =
    viewChild.required<ElementRef<SVGGElement>>("zoomGroup");

  protected readonly centerRadius = 80;
  protected readonly ringWidth = 120;
  protected readonly s = this.centerRadius * Math.sqrt(2) - 10;

  color(individual: GedcomIndividual) {
    if (individual.sex.sex === "M") return "#add8e6"; // Light blue
    if (individual.sex.sex === "F") return "#ffb6c1"; // Light pink
    return "#eeeeee";
  }

  readonly fullname = fullname;

  readonly sunburstNodes = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const nodes: SunburstNode[] = [];
    const maxGenerations = 5;

    const traverse = (
      xref: string,
      generation: number,
      startAngle: number,
      endAngle: number,
    ) => {
      if (generation > maxGenerations) return;
      const individual = ancestryDatabase.individuals[xref];
      if (!individual) return;

      const inner = this.centerRadius + (generation - 1) * this.ringWidth;
      const outer = this.centerRadius + generation * this.ringWidth;
      const midR = (inner + outer) / 2;
      const midAngle = (startAngle + endAngle) / 2;

      const x = midR * Math.cos(midAngle - Math.PI / 2);
      const y = midR * Math.sin(midAngle - Math.PI / 2);

      let rotation = (midAngle * 180) / Math.PI - 90;
      if (rotation > 90 && rotation < 270) {
        rotation += 180;
      }
      if (rotation < -90) {
        rotation += 180;
      }

      const arcLength = midR * (endAngle - startAngle);
      const boxHeight = arcLength;
      const boxWidth = this.ringWidth - 4;

      nodes.push({
        individual: individual,
        generation: generation,
        x,
        y,
        rotation,
        width: boxWidth,
        height: boxHeight,
        color: this.color(individual),
        arc:
          d3.arc()({
            startAngle: startAngle,
            endAngle: endAngle,
            innerRadius: this.centerRadius + (generation - 1) * this.ringWidth,
            outerRadius: this.centerRadius + generation * this.ringWidth,
          }) ?? "",
      });

      const familyXref = individual.childOfFamilyXrefs[0];
      if (familyXref === undefined) return;
      const family = ancestryDatabase.families[familyXref];

      const mid = (startAngle + endAngle) / 2;
      if (family?.husbandXref) {
        traverse(family.husbandXref, generation + 1, startAngle, mid);
      }
      if (family?.wifeXref) {
        traverse(family.wifeXref, generation + 1, mid, endAngle);
      }
    };

    const individual = this.individual();
    const familyXref = individual.childOfFamilyXrefs[0];
    if (familyXref) {
      const family = ancestryDatabase.families[familyXref];
      if (family?.husbandXref) {
        traverse(family.husbandXref, 1, Math.PI / 4, Math.PI / 2);
      }
      if (family?.wifeXref) {
        traverse(family.wifeXref, 1, Math.PI / 2, (3 * Math.PI) / 4);
      }
    }

    return nodes;
  });

  private readonly zoomEffect = effect((onCleanup) => {
    const svgEl = this.svgElement().nativeElement;
    const gEl = this.zoomGroup().nativeElement;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        d3.select(gEl).attr("transform", event.transform);
      });

    d3.select(svgEl).call(zoom as any);

    onCleanup(() => {
      d3.select(svgEl).on(".zoom", null);
    });
  });
}
