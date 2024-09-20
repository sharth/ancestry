// import '@testing-library/jest-dom'
import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {render, screen} from '@testing-library/angular'
import { GedcomDiffComponent } from './gedcom-diff.component';

// import {readFileSync} from 'fs';

// const rawGedcom = readFileSync('../../testdata/Queen_Eliz_II.ged');

describe('IndexComponent', () => {
  it('should render', async () => {
    await render(GedcomDiffComponent, {
      providers: [provideExperimentalZonelessChangeDetection()],
      inputs: {
        newGedcomText: "",
        oldGedcomText: "",
      }
    })

    // const file = path.join(__dirname, "./", "bla.txt");
// const fdr = fs.readFileSync(file, "utf8", function(err: any, data: any) {

    // fs.readFileSync('./testdata/Queen_Eliz_II.ged', "utf8")

    // expect(screen.getByText('Hello!')).toBeVisible()
  })
});
