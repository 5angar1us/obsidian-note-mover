import { App, ButtonComponent, debounce, Modal, Notice, Setting } from "obsidian";
import { DataviewApi, getAPI } from "obsidian-dataview";
import { QueryPreviewModal } from "./../QueryPreviewModal";
import { DataViewWhereExpression, Rule } from "./../settingsTypes";
import { ErrorDetailsValidationComponent } from "./Validation/ErrorDetailsValidationComponent";
import { IconValidationComponent } from "./Validation/IconValidationComponent";
import { ValidationComposer } from "./Validation/ValidationComposer";

import { nmDatawiewWhereExpession__input, nmSearch__input } from "src/cssConsts";
import { buildMoveQuery } from "src/FileMoveEngine/buildQuery";
import NoteMover from "src/main";
import { FolderSuggest } from "src/suggests/FolderSuggest";
import { MultipleTagSuggest } from "src/suggests/MultipleSuggest";
import { PropertyKeySuggest } from "src/suggests/PropertySuggest";
import { PropertyValueSuggest } from "src/suggests/PropertyValueSuggest";
import { normalizePath } from "src/strongTypes/normalizePath";



export class RuleModal extends Modal {
    private dv: DataviewApi;

    private sourcePath: string;
    private withSubfolders: boolean;
    private targetPath: string;
    private filter: DataViewWhereExpression;

    private validation: () => void;
    private validationComposer: ValidationComposer;

    private saved = false;

    private tags: string[] = []

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
        this.filter = rule?.filter || '' as DataViewWhereExpression;
        this.dv = getAPI(app) as DataviewApi;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: this.rule ? 'Edit Rule' : 'New Rule' });

        this.addSourceFolderSearch(contentEl);

        this.addTargetFolderSearch(contentEl);

        this.filterCondition(contentEl);

        this.setupSaveCancelButtons(contentEl);

        this.validation();
    }

    private filterCondition(contentEl: HTMLElement) {
        new Setting(contentEl)
            .setName('Filter Condition')
            .setHeading();
        
        const expandableSection = (title: string, expanded = false) => {
            const details = contentEl.createEl('details', {
                attr: expanded ? { open: '' } : {}
            });
            details.createEl('summary', { text: title });
            return details;
        };

        // Секция документации
        const docsSection = expandableSection('Documentation');
        const docsFragment = document.createDocumentFragment();

        docsFragment.append(
            'For detailed instructions, refer to the ',
            createEl('a', {
                text: 'Dataview documentation',
                href: 'https://blacksmithgu.github.io/obsidian-dataview/'
            }),
            '.',
            'Useful sections include:',
            createEl('ul', {}, ul => {
                ul.append(
                    createEl('li', { text: 'Query Language Reference – for guidance on constructing the WHERE expression.' }),
                    createEl('li', { text: 'Metadata on Pages – to discover all available metadata fields for your notes.' })
                );
            }),
            createEl('h5', { text: 'Basic examples:' }),
            createEl('ul', {}, ul => {
                ul.append(
                    createEl('li', { text: 'Comparison operators: <, >, <=, >=, =, !=' }),
                    createEl('li', { text: 'Combine conditions with AND/OR' }),
                    createEl('li', {}, li => {
                        li.append(
                            createEl('code', { text: 'contains(file.tags, "#3done")' }),
                            ' - check for tag'
                        );
                    }),
                    createEl('li', {}, li => {
                        li.append(
                            createEl('code', { text: 'fileClass = "ChatBot Prompt"' }),
                            ' - check property value'
                        );
                    })
                );
            }),
            createEl('h5', { text: 'Function calls:' }),
            createEl('ul', {}, ul => {
                ul.append(
                    createEl('li', {}, li => {
                        li.append(createEl('code', { text: 'contains(file.name, "WIP")' }));
                    }),
                    createEl('li', {}, li => {
                        li.append(createEl('code', { text: 'string(file.day.year)' }));
                    })
                );
            })
        );

        docsSection.appendChild(docsFragment);

        //
        // Tag Search Section
        //
        const tagsSearchSection = expandableSection('Tag Search');
        new Setting(tagsSearchSection)
            .setName('Search Tags')
            .addSearch(search => {
                new MultipleTagSuggest(search.inputEl, this.app);
                search
                    .setPlaceholder('Enter tag to search')
                    .onChange((value) => {
                        const t = value.split(',')
                            .map(tag => tag.trim())
                            .filter(tag => tag);

                        this.tags = t;
                    })

            })
            .addExtraButton(btn =>
                btn.setIcon('code')
                    .setTooltip('Copy as query snippet')
                    .onClick(async () => {
                        const snippet = this.tags
                            .map(tag => `contains(file.tags, "${tag}")`)
                            .join(' AND ');
                        try {
                            await navigator.clipboard.writeText(snippet);
                            this.showConfirmation();
                        } catch (err) {
                            console.error('Copy error:', err);
                        }
                    }))
            .addExtraButton(btn =>
                btn.setIcon('documents')
                    .setTooltip('Copy as plain text')
                    .onClick(async () => {
                        const formattedTags = this.tags.join(',');
                        try {
                            await navigator.clipboard.writeText(formattedTags);
                            this.showConfirmation();
                        } catch (err) {
                            console.error('Copy error:', err);
                        }
                    }))

        //
        // Property Search Section
        //
        const propsSearchSection = expandableSection('Property Search');
        let propKey = '';
        let propVal = '';
        let valueSuggest: PropertyValueSuggest | null = null;
        let keyInputEl: HTMLInputElement | null = null;
        let valueInputEl: HTMLInputElement | null = null;

        new Setting(propsSearchSection)
            .setName('Search Properties')
            // input property key
            .addSearch(search => {
                keyInputEl = search.inputEl;
                new PropertyKeySuggest(search.inputEl, this.app);
                search
                    .setPlaceholder('Enter property to search')
                    .onChange((value) => {
                        propKey = value.trim();
                        if (valueSuggest) {
                            valueSuggest.setProperty(propKey);
                        }
                    });
            })
            // input property value
            .addSearch(search => {
                valueInputEl = search.inputEl;
                valueSuggest = new PropertyValueSuggest(search.inputEl, this.app, getAPI(this.app), propKey);
                search
                    .setPlaceholder('Enter value to search')
                    .onChange((value) => {
                        propVal = value.trim();


                    });
            })
            .addExtraButton(btn =>
                btn.setIcon('code')
                    .setTooltip('Copy as query snippet')
                    .onClick(async () => {

                        if (propKey.trim() == "" && propVal.trim() == "") return;

                        const formatted = `${propKey} = "${propVal}"`
                        try {
                            await navigator.clipboard.writeText(formatted);
                            this.showConfirmation();
                        } catch (err) {
                            console.error('Copy error:', err);
                        }
                    })
            ).addExtraButton(btn => {
                btn.setIcon('trash')
                    .setTooltip('Clear fields')
                    .onClick(() => {
                        if (keyInputEl) {
                            keyInputEl.value = '';
                        }
                        if (valueInputEl) {
                            valueInputEl.value = '';
                        }
                        propKey = '';
                        propVal = '';
                        if (valueSuggest) {
                            valueSuggest.setProperty('');
                        }
                    });
            });

        //
        // Сам textarea WHERE
        //
        const datavieWhereExpessionSettings = new Setting(contentEl)
            .addTextArea(text => {
                text
                    .setValue(this.filter)
                    .setPlaceholder('Dataview WHERE condition')
                    .onChange((value) => {
                        this.filter = value as DataViewWhereExpression;
                        this.validation();
                    });

                const minRowCount = 2;
                text.inputEl.rows = minRowCount;
                text.inputEl.classList.add(nmDatawiewWhereExpession__input);

                const dynamicAdjustHeight = () => {
                    const textArea = text.inputEl;

                    textArea.style.height = "auto";
                    const maxHeight = parseFloat(getComputedStyle(textArea).maxHeight);
                    const newHeight = Math.min(textArea.scrollHeight, maxHeight);

                    textArea.style.height = newHeight + "px";
                };
                text.inputEl.addEventListener("input", dynamicAdjustHeight);
                dynamicAdjustHeight();
            })
            .addButton(btn => {
                btn.setIcon("eye")
                    .setTooltip("Show the full Dataview request")
                    .onClick(() => {
                        new QueryPreviewModal(
                            this.app,
                            buildMoveQuery(normalizePath(this.sourcePath), this.filter)
                        ).open();
                    });
            });


        datavieWhereExpessionSettings.infoEl.remove();

        const IconValidationComp = new IconValidationComponent(
            datavieWhereExpessionSettings.controlEl
        );
        const ErrorDetailsValidationComp = new ErrorDetailsValidationComponent(
            contentEl
        );
        this.validationComposer = new ValidationComposer(
            IconValidationComp,
            ErrorDetailsValidationComp
        );
        this.validation = this.validationComposer.wrapValidate(async () => {
            return await this.dv.tryQuery(
                buildMoveQuery(normalizePath(this.sourcePath), this.filter)
            );
        }, 400);
    }

    private setupSaveCancelButtons(contentEl: HTMLElement) {
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
                            filter: this.filter.trim() as DataViewWhereExpression
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

    private addTargetFolderSearch(contentEl: HTMLElement) {
        new Setting(contentEl)
            .setName('Target Folder')
            .setHeading();

        new Setting(contentEl)
            .addSearch((search) => {
                new FolderSuggest(search.inputEl, this.app);


                search.setValue(this.targetPath)
                    .setPlaceholder('Folder path')
                    .onChange((value) => {
                        this.targetPath = value;
                    });

                // @ts-ignore
                search.containerEl.addClass(nmSearch__input);
            })
            .infoEl.remove();
    }

    private addSourceFolderSearch(contentEl: HTMLElement) {
        new Setting(contentEl)
            .setName('Source Folder')
            .setHeading();

        new Setting(contentEl)
            .addSearch((search) => {
                new FolderSuggest(search.inputEl, this.app);

                search.setValue(this.sourcePath)
                    .setPlaceholder('Folder path')
                    .onChange((value) => {
                        this.sourcePath = value;
                    });

                // @ts-ignore
                search.containerEl.addClass(nmSearch__input);

            })
            .addToggle((toggle) => {
                toggle.setValue(this.withSubfolders)
                    .setTooltip('Include subfolders')
                    .onChange((value) => {
                        this.withSubfolders = value;
                    });
            })
            .infoEl.remove();
    }

    onClose() {
        if (!this.saved) this.onSubmit?.(null!);
        this.contentEl.empty();
    }

    private showConfirmation() {
        new Notice('Copied!')
    }
}
