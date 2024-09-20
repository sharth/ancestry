import {IndexComponent} from './index.component';
import {provideExperimentalZonelessChangeDetection} from '@angular/core';
import {render, screen} from '@testing-library/angular'
import {assert} from "chai";

describe('IndexComponent', () => {
  it('should render', async () => {
    await render(IndexComponent, {
      providers: [provideExperimentalZonelessChangeDetection()],
    })

    assert.isTrue(screen.getByText('Hello!'));
    
  })
});
