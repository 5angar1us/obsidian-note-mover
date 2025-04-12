import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { handleFiles } from './handleFiles';
import { DEFAULT_SETTINGS, NoteMoverSettings, NoteMoverSettingTab } from './settings';


export default class NoteMover extends Plugin {
	settings: NoteMoverSettings;

	async onload() {
		await this.loadSettings();

		const moveAllNotesCommand = async () => {
			const files = this.app.vault.getMarkdownFiles();
			const filesLength = files.length;
			for (let i = 0; i < filesLength; i++) {
				await handleFiles(this.app, files[i], 'cmd', this.settings);
			}
			new Notice(`All ${filesLength} notes have been moved.`);
		};

		this.addCommand({
			id: 'Move-all-notes',
			name: 'Move all notes',
			callback: async () => {
				await moveAllNotesCommand();
			},
		});
		this.addSettingTab(new NoteMoverSettingTab(this.app, this));
	}


	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}




