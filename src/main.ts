import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { handleFiles } from './handleFiles';

export interface NoteMoverSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: NoteMoverSettings = {
	mySetting: 'default'
}

export default class NoteMover extends Plugin {
	settings: NoteMoverSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'run command 1',
			name: 'run command 1',
			callback: () => {

				const file = this.app.vault.getFiles()[0];
				console.log(`file:${file.name}`);
				handleFiles(
					this.app,
					file,
					'cmd',
					[],
					false
				)
				console.log("Message: Hello world")
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


export class NoteMoverSettingTab extends PluginSettingTab {
	plugin: NoteMover;

	constructor(app: App, plugin: NoteMover) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}


