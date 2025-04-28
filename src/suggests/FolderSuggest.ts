import { AbstractInputSuggest, App } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<string> {
    private folders: string[];

    constructor(private inputEl: HTMLInputElement, app: App) {
        super(app, inputEl);
 
        const rootFolder = "/"
        
        const vaultFolders = this.app.vault.getAllFolders()
            .map(folder => folder.path);

        this.folders = [rootFolder].concat(vaultFolders);

        //this.onSelect((value, evt) => this.onSelectHandler(value, evt));
    }

    onSelectHandler(Value:string, event: MouseEvent | KeyboardEvent){
        //const suggestions = this.getSuggestions(Value);
    }

    getSuggestions(inputStr: string): string[] {
        const inputLower = inputStr.toLowerCase();
        return this.folders.filter(folder => 
            folder.toLowerCase().includes(inputLower)
        );
    }

    renderSuggestion(folder: string, el: HTMLElement): void {
        el.createEl("div", { text: folder });
    }

    selectSuggestion(folder: string): void {
        this.inputEl.value = folder;
        const event = new Event('input');
        this.inputEl.dispatchEvent(event);
        this.inputEl.focus();
        this.close();
    }
}