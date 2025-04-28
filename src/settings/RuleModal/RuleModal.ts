import { App, debounce, Modal, Setting } from "obsidian";
import NoteMover from "src/main";
import { FolderSuggest } from "src/suggests/FolderSuggest";
import { buildMoveQuery } from "src/FileMoveEngine/buildQuery";
import { normalizePath } from "src/strongTypes/normalizePath";
import { DataviewApi, getAPI } from "obsidian-dataview";
import { log } from "src/logger/CompositeLogger";
import { nm_filter_status, nmDatawiewWhereExpession__input, nmSearch__input } from "src/cssConsts";
import { QueryPreviewModal } from "../QueryPreviewModal";
import { DataViewWhereExpression, Rule } from "../settingsTypes";
import { ErrorDetailsValidationComponent } from "./Validation/ErrorDetailsValidationComponent";
import { IconValidationComponent } from "./Validation/IconValidationComponent";
import { ValidationComposer } from "./Validation/ValidationComposer";
import { MultipleTagSuggest } from "src/suggests/MultipleSuggest";


export class RuleModal extends Modal {
    private dv: DataviewApi;

    private sourcePath: string;
    private withSubfolders: boolean;
    private targetPath: string;
    private filter: DataViewWhereExpression;

    private validation: () => void;
    private validationComposer: ValidationComposer;

    private saved = false;

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

        let IconValidationComp: IconValidationComponent;
        let ErrorDetailsValidationComp: ErrorDetailsValidationComponent;

        contentEl.createEl('h2', { text: this.rule ? 'Edit Rule' : 'New Rule' });

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

        new Setting(contentEl)
            .setName('Filter Condition')
            .setHeading();

        const datavieWhereExpessionSettings = new Setting(contentEl)
            .addTextArea((text) => {

                text.setValue(this.filter)
                    .setPlaceholder('Dataview WHERE condition')
                    .onChange((value) => {
                        this.filter = value as DataViewWhereExpression;
                        this.validation();
                    });

                const minRowCount = 2
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

            .addButton((btn) => {
                btn.setIcon("eye")
                    .setTooltip("Show the full Dataview request")
                    .onClick(() => {
                        new QueryPreviewModal(this.app, buildMoveQuery(normalizePath(this.sourcePath), this.filter)).open();
                    });
            });
        datavieWhereExpessionSettings.infoEl.remove();

        IconValidationComp = new IconValidationComponent(
            datavieWhereExpessionSettings.controlEl
        );

        ErrorDetailsValidationComp = new ErrorDetailsValidationComponent(
            contentEl
        );

        this.validationComposer = new ValidationComposer(
            IconValidationComp,
            ErrorDetailsValidationComp
        );

        this.validation = this.validationComposer.wrapValidate(async () => {
            return await this.dv.tryQuery(
                buildMoveQuery(normalizePath(this.sourcePath), this.filter));
        }, 400);

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

        this.validation();
    }

    onClose() {
        if (!this.saved) this.onSubmit?.(null!);
        this.contentEl.empty();
    }


}