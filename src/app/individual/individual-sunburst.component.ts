import { AncestryService } from "../../database/ancestry.service";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from "@angular/core";

@Component({
  selector: "app-individual-relatives",
  imports: [IndividualLinkComponent],
  templateUrl: "./individual-sunburst.component.html",
  styleUrl: "./individual.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndividualSunburstComponent {
  readonly xref = input.required<string>();
  private ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    // const ancestry = this.ancestryService.contents();
    // if (ancestry === undefined) {
    //   return undefined;
    // }

    // const xref = this.xref();
    // const individual = ancestry.individuals.get(xref);
    // if (individual === undefined) {
    //   return undefined;
    // }

    // type SunburstData = {
    //   name: string;
    //   children: SunburstData[];
    // };
    // const ancestors: { individual: GedcomIndividual; sunburst: SunburstData } =
    //   [{ individual: individual, sunburst: {} }];

    // for (let i = 0; i < ancestors.length; i++) {
    //   const familyXref = ancestors[i].individual.childOfFamilyXrefs[0];
    //   if (familyXref == undefined) continue;
    // }

    // type ChartDataType = {
    //   individual: GedcomIndividual;
    //   name: string;
    //   children?: ChartDataType[];
    // };
    // const Q: ChartDataType[] = [
    //   { individual: individual, name: fullname(individual), children: [] },
    // ];
    // const chartData = [Q[0]];

    // let chartDataEntry;
    // while ((chartDataEntry = Q.pop())) {
    //   const individual = chartDataEntry.individual;
    //   const family = childOfFamily.get(individual.xref);
    //   if (family?.husbandXref) {
    //     const father = ancestry.individuals.get(family.husbandXref);
    //     if (father != undefined) {
    //       const entry = {
    //         individual: father,
    //         name: fullname(father),
    //         children: [],
    //       };
    //       Q.push(entry);
    //       chartDataEntry.children?.push(entry);
    //     }
    //     const mother = ancestry.individuals.get(family.husbandXref);
    //     if (mother != undefined) {
    //       const entry = {
    //         individual: mother,
    //         name: fullname(mother),
    //         children: [],
    //       };
    //       Q.push(entry);
    //       chartDataEntry.children?.push(entry);
    //     }
    //   }
    // }

    return {
      // chartData: chartData,
    };
  });
}

// import * as echarts from 'echarts/core';
// import { SunburstChart } from 'echarts/charts';
// import { CanvasRenderer } from 'echarts/renderers';

// echarts.use([SunburstChart, CanvasRenderer]);

// var chartDom = document.getElementById('main');
// var myChart = echarts.init(chartDom);
// var option;

// var data = [
//   {
//     name: 'Grandpa',
//     children: [
//       {
//         name: 'Uncle Leo',
//         value: 15,
//         children: [
//           {
//             name: 'Cousin Jack',
//             value: 2
//           },
//           {
//             name: 'Cousin Mary',
//             value: 5,
//             children: [
//               {
//                 name: 'Jackson',
//                 value: 2
//               }
//             ]
//           },
//           {
//             name: 'Cousin Ben',
//             value: 4
//           }
//         ]
//       },
//       {
//         name: 'Father',
//         value: 10,
//         children: [
//           {
//             name: 'Me',
//             value: 5
//           },
//           {
//             name: 'Brother Peter',
//             value: 1
//           }
//         ]
//       }
//     ]
//   },
//   {
//     name: 'Nancy',
//     children: [
//       {
//         name: 'Uncle Nike',
//         children: [
//           {
//             name: 'Cousin Betty',
//             value: 1
//           },
//           {
//             name: 'Cousin Jenny',
//             value: 2
//           }
//         ]
//       }
//     ]
//   }
// ];
// option = {
//   series: {
//     type: 'sunburst',
//     // emphasis: {
//     //     focus: 'ancestor'
//     // },
//     data: data,
//     radius: [0, '90%'],
//     label: {
//       rotate: 'radial'
//     }
//   }
// };

// option && myChart.setOption(option);
