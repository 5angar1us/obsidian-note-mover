import { App, Modal, Setting } from "obsidian";
import NoteMover from "src/main";
import { Rule } from "./settingsTypes";
import { FolderSuggest3 } from "src/suggests/folder-suggest3";

export class RuleModal extends Modal {
    private saved = false;
    private sourcePath: string;
    private withSubfolders: boolean;
    private targetPath: string;
    private filter: string;

    constructor(
        app: App,
        private plugin: NoteMover,
        private rule?: Rule,
        private onSubmit?: (rule: Rule) => void
    ) {
        super(app);
        this.sourcePath = rule?.sourceFolder.path || '';
        this.withSubfolders = rule?.sourceFolder.withSubfolders ?? true;
        this.targetPath = rule?.targetFolder.path || '';
        this.filter = rule?.filter || '';
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: this.rule ? 'Edit Rule' : 'New Rule' });
        new Setting(contentEl)
        .setName('Source Folder')
        .addSearch((search) => {
            new FolderSuggest3(search.inputEl, this.app);
            search.setValue(this.sourcePath)
                .setPlaceholder('Folder path')
                .onChange((value) => {
                    this.sourcePath = value;
                });

        })
        .addToggle((toggle) => {
            toggle.setValue(this.withSubfolders)
                .setTooltip('Include subfolders')
                .onChange((value) => {
                    this.withSubfolders = value;
                });
        });

        new Setting(contentEl)
        .setName('Target Folder')
        .addSearch((search) => {
            new FolderSuggest3(search.inputEl, this.app);
            search.setValue(this.targetPath)
                .setPlaceholder('Folder path')
                .onChange((value) => {
                    this.targetPath = value;
                });
        });

        new Setting(contentEl)
            .setName('Filter Condition')
            .addTextArea((text) => {
                text.setValue(this.filter)
                    .setPlaceholder('Dataview WHERE condition')
                    .onChange((value) => {
                        this.filter = value;
                    });
            });

        new Setting(contentEl)
            .addButton((btn) => {
                btn.setButtonText('Save')
                    .setCta()
                    .onClick(() => {
                        this.saved = true;
                        this.onSubmit?.({
                            sourceFolder: {
                                path: this.sourcePath.trim(),
                                withSubfolders: this.withSubfolders
                            },
                            targetFolder: {
                                path: this.targetPath.trim()
                            },
                            filter: this.filter.trim()
                        });
                        this.close();
                    });
                
                // TODO: Remove this hack for modal window focus
                // Problem: After opening the modal window, the first element in the modal window is in focus. 
                // This is probably the standard behavior. This also works in obsidian-metalbind-plugin modal windows. 
                // Although in the quick add plugin, the first element is not highlighted when editing the selection 
                // and the reason for this could not be found.
                //
                // Since this button, in my opinion, should always be at the bottom, I decided to choose it for focus.
                setTimeout(() => btn.buttonEl.focus(), 10);
            })
            .addButton((btn) => {
                btn.setButtonText('Cancel')
                    .onClick(() => {
                        this.close();
                    });
            });

           
       
    }

    onClose() {
        if (!this.saved) this.onSubmit?.(null!);
        this.contentEl.empty();
    }
}