import { App, debounce, Modal, Setting } from "obsidian";
import NoteMover from "src/main";
import { DataViewWhereExpression, Rule } from "./settingsTypes";
import { FolderSuggest3 } from "src/suggests/folder-suggest3";
import { QueryPreviewModal } from "./QueryPreviewModal";
import { buildMoveQuery } from "src/buildQuery";
import { normalizePath } from "src/strongTypes/normalizePath";
import { DataviewApi, getAPI } from "obsidian-dataview";
import { log } from "src/logger/CompositeLogger";
import { nm_filter_status, nmDatawiewWhereExpession__input, nmSearch__input } from "src/cssConsts";

export class RuleModal extends Modal {
    private saved = false;
    private sourcePath: string;
    private withSubfolders: boolean;
    private targetPath: string;
    private filter: DataViewWhereExpression;

    private dv: DataviewApi;
    private filterStatusEl!: HTMLElement;
    private preEl!: HTMLElement;
    private errorDetailsEl!: HTMLDetailsElement;
    private validate = debounce(this.doValidate.bind(this), 400);

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

        new Setting(contentEl)
            .setName('Source Folder')
            .setHeading();

        new Setting(contentEl)
            .addSearch((search) => {
                new FolderSuggest3(search.inputEl, this.app);

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
                new FolderSuggest3(search.inputEl, this.app);


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

        new Setting(contentEl)
            .addTextArea((text) => {

                text.setValue(this.filter)
                    .setPlaceholder('Dataview WHERE condition')
                    .onChange((value) => {
                        this.filter = value as DataViewWhereExpression;
                        this.validate();
                    });

                const minRowCount = 2
                text.inputEl.rows = minRowCount;
                text.inputEl.classList.add(nmDatawiewWhereExpession__input);

                const dynamicAdjustHeight = () => {
                    const textArea = text.inputEl;
                    textArea.style.height = "auto";
                    // clamp по max‑height из CSS
                    const maxH = parseFloat(getComputedStyle(textArea).maxHeight);
                    const newH = Math.min(textArea.scrollHeight, maxH);
                    textArea.style.height = newH + "px";
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
            })
            .then((setting) => {
                this.filterStatusEl = setting.controlEl.createEl("span", {
                    cls: nm_filter_status,
                    text: "⏳"
                });
                this.doValidate();
            })
            .infoEl.remove();
        
        this.errorDetailsEl = contentEl.createEl('details', {
            cls: 'nm-error-details',
            }) as HTMLDetailsElement;
            this.errorDetailsEl.style.display = 'none';   // Скрываем по умолчанию
            this.errorDetailsEl.createEl('summary', { text: 'Show error details' });
            this.preEl = this.errorDetailsEl.createEl('pre', {
            cls: 'nm-error-pre',
            text: '',
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

    onClose() {
        if (!this.saved) this.onSubmit?.(null!);
        this.contentEl.empty();
    }

    private async doValidate() {
        if (!this.dv) return this.setValidationState("⚠️ no DV", true);

        try {
            await this.dv.tryQuery(
                buildMoveQuery(normalizePath(this.sourcePath), this.filter)
            );
            this.setValidationState("✅", false);
        } catch (e) {
            log.logError(e);
            this.setValidationState("❌", true, "Take a look at error details");
        }
    }

    private setValidationState(
        icon: string,
        isError: boolean,
        title = ""
      ): void {
      
        // обновляем иконку
        this.filterStatusEl.setText(icon);
        this.filterStatusEl.setAttr("title", title);
      
        if (isError) {
          // показываем блок <details>, открываем его и вставляем текст
          this.errorDetailsEl.style.display = '';     // вернуть дефолтное отображение
          this.errorDetailsEl.open = true;            // сразу развернуть
          this.preEl.setText(title);
        } else {
          // прячем блок и очищаем текст
          this.errorDetailsEl.style.display = 'none';
          this.errorDetailsEl.open = false;
          this.preEl.setText('');
        }
      }
}