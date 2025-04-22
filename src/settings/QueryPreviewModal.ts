import { App, Modal, Setting } from "obsidian";
import { nmQueryPreformatted } from "src/cssConsts";

export class QueryPreviewModal extends Modal {
    constructor(app: App, private query: string) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Query' });

        new Setting(contentEl)
            .setName('Dataview Query')
            .setDesc('You can check the functionality of the request yourself in your storage:')

        contentEl.createEl('pre', {
            cls: nmQueryPreformatted,
            text: this.query
        });

        new Setting(contentEl)
            .addButton(btn => {
                btn.setButtonText('Copy to Clipboard')
                    .setCta()
                    .onClick(async () => {
                        try {
                            await navigator.clipboard.writeText(this.query);
                            this.showConfirmation(btn);
                        } catch (err) {
                            console.error('Copy error:', err);
                            btn.setButtonText('Error!');
                        }
                    });
            });
    }

    private showConfirmation(btn: any) {
        const originalText = btn.buttonEl.textContent;
        btn.setButtonText('Copied!');
        setTimeout(() => {
            btn.setButtonText(originalText);
        }, 2000);
    }

    onClose() {
        this.contentEl.empty();
    }
}