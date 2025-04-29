import { AbstractInputSuggest, App, prepareFuzzySearch, SearchResult } from "obsidian";

export abstract class AbstractPropertySuggest extends AbstractInputSuggest<string> {

    constructor(protected inputEl: HTMLInputElement, app: App) {
        super(app, inputEl);
    }

    protected doFuzzySearch(target: string, maxResults = 20, minScore = -2): string[] {
        const content = this.getContent();
        if (!target || target.length < 1) {
            return content.slice(0, maxResults);
        }

        const fuzzy = prepareFuzzySearch(target);
        const matches: [string, SearchResult | null][] = content.map((element) => [element, fuzzy(element)]);
        const goodMatches = matches.filter(
            (match): match is [string, SearchResult] => (match[1] !== null && match[1].score > minScore));
        goodMatches.sort((a, b) => b[1].score - a[1].score);
        const ret = goodMatches.map((c) => c[0]);
        return ret.slice(0, maxResults);
    }

    getSuggestions(inputStr: string): string[] {
        if (!this.getContent()) {
            return [];
        }
        return this.doFuzzySearch(inputStr);
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.createEl("div", { text: value });
    }


    selectSuggestion(value: string): void {
        this.inputEl.value = value;
        this.inputEl.dispatchEvent(new Event("input"));
        this.inputEl.focus();
        this.close();
    }

    abstract getContent(): string[];
}
