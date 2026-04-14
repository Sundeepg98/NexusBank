import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not be clickable by default', () => {
    expect(component.clickable()).toBeFalse();
  });

  it('should not have footer by default', () => {
    expect(component.footer()).toBeFalse();
  });

  it('should emit clicked event when clickable and clicked', () => {
    spyOn(component.clicked, 'emit');
    component.clickable.set(true);
    component.onCardClick();
    expect(component.clicked.emit).toHaveBeenCalled();
  });

  it('should not emit clicked event when not clickable', () => {
    spyOn(component.clicked, 'emit');
    component.clickable.set(false);
    component.onCardClick();
    expect(component.clicked.emit).not.toHaveBeenCalled();
  });

  it('should have empty title by default', () => {
    expect(component.title()).toBeUndefined();
  });

  it('should accept title input', () => {
    component.title.set('Test Title');
    expect(component.title()).toBe('Test Title');
  });

  it('should have default subtitle as undefined', () => {
    expect(component.subtitle()).toBeUndefined();
  });

  it('should accept subtitle input', () => {
    component.subtitle.set('Test Subtitle');
    expect(component.subtitle()).toBe('Test Subtitle');
  });
});
