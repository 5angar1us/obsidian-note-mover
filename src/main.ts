import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { handleFiles } from './handleFiles';
import { DEFAULT_SETTINGS, NoteMoverSettings, NoteMoverSettingTab } from './settings';
import { log } from './logger/CompositeLogger';
import { ErrorLevel } from './logger/consts/errorLevel';
import { ConsoleErrorLogger } from './logger/ConsoleErrorLogger';
import { GuiLogger } from './logger/GuiLogger';


export default class NoteMover extends Plugin {
	settings: NoteMoverSettings;

	async onload() {
		console.log("Loading NoteMover");
		await this.loadSettings();

		if (this.settings.isDebug){
			log.register(new ConsoleErrorLogger())
			.register(new GuiLogger(this));
		}
		

		this.app.workspace.onLayoutReady(() => {
			// We need dataview for the plugin to work. His requests are responsible for the rules for moving files.
			// Inline and Javascript quieres are not required

			// example: https://github.com/mdelobelle/metadatamenu/blob/master/main.ts

			const dataviewPluginName = "dataview";
			//@ts-ignore
			if (!this.app.plugins.enabledPlugins.has(dataviewPluginName)) {
				new Notice(
					`------------------------------------------\n` +
					`(!) INFO (!) \n` +
					`Install and enable dataview forthe plugin to work\n` +
					`------------------------------------------`)
			}
		});
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




