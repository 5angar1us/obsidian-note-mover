import { App } from "obsidian";
import { DataviewApi } from "obsidian-dataview";
import { AbstractPropertySuggest } from "./AbstractPropertySuggest";

export class PropertyValueSuggest extends AbstractPropertySuggest {
    private values: string[] = [];
    private loading = true; 
    private cache = new Map<string, string[]>();

    constructor(
        inputEl: HTMLInputElement, 
        app: App,
        private dv: DataviewApi,
        private property: string
    ) {
        super(inputEl, app); 
        this.reloadValues();
    }

    public setProperty(targetPropert: string) {
        if (targetPropert !== this.property) {
            this.property = targetPropert;
            this.reloadValues();
        }
    }

    private async reloadValues() {
        this.loading = true;
        this.values = [];

        if (this.cache.has(this.property)) {
            this.values = this.cache.get(this.property)!;
            this.loading = false;
            return;
        }

        const pages = this.dv.pages(); // DataArray<any>
        const freq = new Map<string, number>();
        pages.forEach((p: any) => {
            const raw = p[this.property];
            if (raw == null) return;
            const arr = Array.isArray(raw) ? raw : [raw];
            arr.forEach(val => {
                const s = String(val);
                freq.set(s, (freq.get(s) || 0) + 1);
            });
        });

        this.values = Array.from(freq.entries())
            .sort((a, b) => b[1] - a[1]) // Сортируем по частоте
            .map(([val]) => val); // Берем только значения

        this.cache.set(this.property, this.values); // Кэшируем *все* найденные значения
        this.loading = false;
        
    }

    // Реализация абстрактного метода
    getContent(): string[] {
        // Возвращаем пустой массив во время загрузки, чтобы избежать ошибок
        return this.loading ? [] : this.values;
    }
}
