import { AbstractInputSuggest, App, HoverParent, HoverPopover, prepareFuzzySearch, SearchResult } from "obsidian";

// https://github.com/mo-seph/obsidian-note-from-template/blob/master/src/UISupport.ts
/*
 * Class that can be added to an existing inputElement to add suggestions.
 * It needs an implementation of `getContent` to provide the set of things to suggest from
 * By default it does a FuzzySearch over these: this can be changed to a simple search
 * by overriding `getSuggestions`
 * `targetMatch` is a regex that finds the part of the input to use as a search term
 * It should provide two groups: the first one is left alone, the second one is the
 * search term, and is replaced by the result of the suggestions. By default, it's
 * a comma separator.
 * 
 */
abstract class MultipleTextSuggest extends AbstractInputSuggest<string> {
    content: string[];
    targetMatch = /^(.*),\s*([^,]*)/


    constructor(private inputEl: HTMLInputElement, app: App, private onSelectCb: (value: string) => void = (v)=>{}) {
        super(app, inputEl);
        this.content = this.getContent();
    }

    getSuggestions(inputStr: string): string[] {
		return this.doFuzzySearch(this.getParts(inputStr)[1]);
    }

    /*
     * Returns the bit at the beginning to ignore [0] and the target bit [1]
     */
    getParts(input:string) : [string,string] {
        const m = input.match(this.targetMatch)
        if(m) {
            return [m[1],m[2]]
        } else {
            return ["",input]
        }
    }

    doSimpleSearch(target:string) : string[] {
        if( ! target || target.length < 2 ) return []
        //fuzzySearch
        const lowerCaseInputStr = target.toLocaleLowerCase();
        const t = this.content.filter((content) =>
            content.toLocaleLowerCase().contains(lowerCaseInputStr)
        );
        return t
    }

    doFuzzySearch(target: string, maxResults = 20, minScore = -2): string[] {
        if (!target || target.length < 2) return [];
        const fuzzy = prepareFuzzySearch(target);
        const matches: [string, SearchResult | null][] = this.content.map((element) => [element, fuzzy(element)]);
        const goodMatches = matches.filter((match): match is [string, SearchResult] => (match[1] !== null && match[1].score > minScore));
        goodMatches.sort((a, b) => b[1].score - a[1].score);
        const ret = goodMatches.map((c) => c[0]);
        return ret.slice(0, maxResults);
    }

    renderSuggestion(content: string, el: HTMLElement): void {
        el.setText(content);
    }

    selectSuggestion(content: string, evt: MouseEvent | KeyboardEvent): void {
        let [head,tail] = this.getParts(this.inputEl.value)
        //console.log(`Got '${head}','${tail}' from `, this.inputEl.value)
        if( head.length > 0 ) {
            this.onSelectCb(head + ", "+content);
            this.inputEl.value = head + ", " +this.wrapContent(content)
        }
        else {
            this.onSelectCb(content);
            this.inputEl.value = this.wrapContent(content) 
        }
        this.inputEl.dispatchEvent(new Event("change"))
        this.inputEl.setSelectionRange(0, 1)
        this.inputEl.setSelectionRange(this.inputEl.value.length,this.inputEl.value.length)
        this.inputEl.focus()
        this.close();
    }

    wrapContent(content:string):string {
        return content
    }

    abstract getContent(): string[];

}

export class MultipleTagSuggest extends MultipleTextSuggest {
    getContent() {
        // this is an undocumented function...
        // https://github.com/Fevol/obsidian-typings/blob/14d1b3f7fc0f6d167a9721a0f60a14ba4815fee8/src/obsidian/augmentations/MetadataCache.d.ts#L338
        // @ts-ignore
        const tagMap = this.app.metadataCache.getTags() as Record<string, number>;
        return Object.keys(tagMap).map((k) => k.replace("#", ""));
    }
}

export class MultipleFolderSuggest extends MultipleTextSuggest {
	getContent() {
        const folders = this.app.vault.getAllFolders();
      
        return folders.map(folder=> folder.path);
	  }
}
