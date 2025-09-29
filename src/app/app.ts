import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {Card} from 'primeng/card';
import {forkJoin} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Toast} from 'primeng/toast';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-root',
  imports: [InputText, Select, FormsModule, ScrollingModule, Card, Toast],
  providers: [MessageService],
  templateUrl: './app.html'
})
export class App implements OnInit {
  protected firstTypeName: string = "light";
  protected searchIconValue: string = '';
  protected types: any[] | undefined = ["brands", "duotone", "light", "regular", "solid", "thin"];
  protected selectedType: any | undefined = "light";
  protected items: WritableSignal<{ id: number, name: string, code: string, type: string }[]> = signal([]);
  private allIcons = new Map<string, any[]>();
  private http: HttpClient = inject(HttpClient);
  private sanitizer: DomSanitizer = inject(DomSanitizer);
  private messageService: MessageService = inject(MessageService);

  ngOnInit(): void {
    forkJoin([
      this.http.get("data/icon-pack-duotone.json"),
      this.http.get("data/icon-pack-regular.json"),
      this.http.get("data/icon-pack-brands.json"),
      this.http.get("data/icon-pack-solid.json"),
      this.http.get("data/icon-pack-light.json"),
      this.http.get("data/icon-pack-thin.json"),
    ]).subscribe((res: any[]) => {
      const keys = ["duotone", "regular", "brands", "solid", "light", "thin"];
      keys.forEach((key, i) => this.allIcons.set(key, res[i].data));
      this.updateItems();
    });
  }

  protected getSanitizedHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  protected getSelectedType(selectedType: string): void {
    this.selectedType = selectedType;
    this.firstTypeName = selectedType;
    this.updateItems();
  }

  protected searchIcon(e: any): void {
    this.searchIconValue = e.target.value.trim();
    this.updateItems();
  }

  protected copy(code: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.messageService.add({severity: 'success', summary: 'Copied!'});
      })
    }
  }

  private updateItems(): void {
    const icons = this.allIcons.get(this.selectedType) || [];
    const search = this.searchIconValue.toLowerCase();
    const filtered = icons.filter(i =>
      i.name.toLowerCase().includes(search)
    );
    filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aStarts = aName.startsWith(search);
      const bStarts = bName.startsWith(search);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return aName.localeCompare(bName);
    });
    this.items.set(filtered);
  }
}
