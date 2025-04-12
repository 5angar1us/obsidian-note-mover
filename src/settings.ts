import { App, ButtonComponent, PluginSettingTab, Setting, TextComponent } from "obsidian";
import NoteMover from "./main";
import { arrayMove } from "./utilt";
import { FolderSuggest2 } from "./suggests/folder-suggest2";
import {FolderSuggest3 } from "./suggests/folder-suggest3";

export interface ExcludedFolder {
	folderPath: string;
	withSubfolders: boolean
}

export interface Rule {
	sourceFolder: string;
	targetFolder: string;
	filter: string;
}

export interface NoteMoverSettings {
	mySetting: string;
	use_regex_for_excluded_folder: boolean;
	rules: Array<Rule>;
	excludedFolders:  Array<ExcludedFolder>,
}

export const DEFAULT_SETTINGS: NoteMoverSettings = {
	mySetting: 'default',
	use_regex_for_excluded_folder: false,
	rules: [{ sourceFolder: '', targetFolder: '', filter: '' }],
	excludedFolders : [],
}


export class NoteMoverSettingTab extends PluginSettingTab {
	plugin: NoteMover;

	constructor(app: App, plugin: NoteMover) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		// Reset the container's content before populating it with new elements
		// This prevents accumulation of duplicate entries when the method is called multiple times
		containerEl.empty(); 

		this.addSettings();
	}

	addSettings() {
		const descEl = document.createDocumentFragment();

		this.addRules();

		const excludedFolderDesc = document.createDocumentFragment();
		excludedFolderDesc.append(
			'Notes in the excluded folder will not be moved.',
			descEl.createEl('br'),
			'This takes precedence over the notes movement rules.'
		);
		new Setting(this.containerEl)

			.setName('Add Excluded Folder')
			.setDesc(excludedFolderDesc)
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip('Add Excluded Folders')
					.setButtonText('+')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.excludedFolders.push({
							folderPath: '',
							withSubfolders: true
						});
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.excludedFolders.forEach((excluded_folder, index) => {
			const s = new Setting(this.containerEl)
				.addSearch((cb) => {
					new FolderSuggest3(cb.inputEl, this.app);
					cb.setPlaceholder('Folder')
						.setValue(excluded_folder.folderPath)
						.onChange(async (newFolder) => {
							this.plugin.settings.excludedFolders[index].folderPath = newFolder;
							await this.plugin.saveSettings();
						});
				});

				s.addToggle((toggle) => {
					toggle.setValue(excluded_folder.withSubfolders)
					.setTooltip("Include subfolders")
					.onChange(async (value) => {
						this.plugin.settings.excludedFolders[index].withSubfolders = value;
						await this.plugin.saveSettings();
						this.display();
					});
				});

				s.addExtraButton((cb) => {
					cb.setIcon('up-chevron-glyph')
						.setTooltip('Move up')
						.onClick(async () => {
							arrayMove(this.plugin.settings.excludedFolders, index, index - 1);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addExtraButton((cb) => {
					cb.setIcon('down-chevron-glyph')
						.setTooltip('Move down')
						.onClick(async () => {
							arrayMove(this.plugin.settings.excludedFolders, index, index + 1);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addExtraButton((cb) => {
					cb.setIcon('cross')
						.setTooltip('Delete')
						.onClick(async () => {
							this.plugin.settings.excludedFolders.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						});
				});
			s.infoEl.remove();
		});
		
	}

	addRules(){
		new Setting(this.containerEl)

			.setName('Add new rule')
			//.setDesc(ruleDesc)
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip('Add new rule')
					.setButtonText('+')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.rules.push({
							sourceFolder: '',
							targetFolder: '',
							filter: '',
						});
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.rules.forEach((folder_tag_pattern, index) => {

			const s = new Setting(this.containerEl)

				.addSearch((cb) => {
					new FolderSuggest3(cb.inputEl, this.app);
					cb.setPlaceholder('From folder')
						.setValue(folder_tag_pattern.sourceFolder)
						.onChange(async (newFolder) => {
							this.plugin.settings.rules[index].sourceFolder = newFolder.trim();
							await this.plugin.saveSettings();
						});
				})
				.addSearch((cb) => {
					new FolderSuggest3(cb.inputEl, this.app);
					cb.setPlaceholder('To folder')
						.setValue(folder_tag_pattern.targetFolder)
						.onChange(async (newFolder) => {
							this.plugin.settings.rules[index].targetFolder = newFolder.trim();
							await this.plugin.saveSettings();
						});
				})

				.addText((cb) => {
					cb.setPlaceholder('Condition')
						.setValue(folder_tag_pattern.filter)
						.onChange(async (newQuery) => {
							this.plugin.settings.rules[index].filter = newQuery.trim();
							await this.plugin.saveSettings();
						});
				})

				.addExtraButton((cb) => {
					cb.setIcon('up-chevron-glyph')
						.setTooltip('Move up')
						.onClick(async () => {
							arrayMove(this.plugin.settings.rules, index, index - 1);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addExtraButton((cb) => {
					cb.setIcon('down-chevron-glyph')
						.setTooltip('Move down')
						.onClick(async () => {
							arrayMove(this.plugin.settings.rules, index, index + 1);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addExtraButton((cb) => {
					cb.setIcon('cross')
						.setTooltip('Delete')
						.onClick(async () => {
							this.plugin.settings.rules.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						});
				});
			s.infoEl.remove();
		});
	}


}