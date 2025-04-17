import { App, ButtonComponent, PluginSettingTab, Setting, TextComponent } from "obsidian";
import NoteMover from "../main";
import { arrayMove } from "../utilt";
import { FolderSuggest2 } from "../suggests/folder-suggest2";
import { FolderSuggest3 } from "../suggests/folder-suggest3";
import { Caller, ExcludedFolder, FileExcludedFrontMatterEntry, FileExcludedFrontMatterEntryName, getTypedValue, NoteMoverSettings, Rule } from "./settingsTypes";


export const DEFAULT_SETTINGS: NoteMoverSettings = {
	trigger: "auto",
	rules: [{ sourceFolder: { path: '', withSubfolders: true }, targetFolder: { path: '' }, filter: '' }],
	excludedFolders: [],
	isDebug: false
}

export const CALLER_OPTIONS: Record<Caller, string> = {
    'cmd': 'Manual',
    'auto': 'Automatic'
};


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

		this.AddTrigger();
		this.addRules();
		this.addExcludedFolders();
		this.addDebug();

	}


	private AddTrigger() {
		const descEl = document.createDocumentFragment();

		const triggerDesc = document.createDocumentFragment();
		triggerDesc.append(
			'Choose how the trigger will be activated.', 'You can also activate/disactivate the trigger with a command.',
			descEl.createEl('br'),
			descEl.createEl('strong', { text: 'Automatic ' }),
			'is triggered when you create, edit, or rename a note, and moves the note if it matches the rules.',
			descEl.createEl('br'),
			descEl.createEl('strong', { text: 'Manual ' }), 'will not automatically move notes.', 'You can trigger by command.'
		);
		new Setting(this.containerEl)
			.setName('Trigger')
			.setDesc(triggerDesc)
			.addDropdown((dropDown) => {
				Object.entries(CALLER_OPTIONS).forEach(([value, display]) => {
					dropDown.addOption(value, display);
				});
				dropDown
					.setValue(this.plugin.settings.trigger)
					.onChange((value: Caller) => {
						this.plugin.settings.trigger = value;
						this.plugin.saveData(this.plugin.settings);
						this.display();
					});
			});
	}

	private addDebug() {
		const s = new Setting(this.containerEl);
		const descD = document.createDocumentFragment();
		descD.append(
			'Enables log output to the console and gui'
		);
		s.setName("Debuging mode");
		s.setDesc(descD);
		s.addToggle((toggle) => {
			toggle.setValue(this.plugin.settings.isDebug)

				.setTooltip("Source folder with subfolders")
				.onChange(async (value) => {
					this.plugin.settings.isDebug = value;
					await this.plugin.saveSettings();
					this.display();
				});
		});
	}

	private addExcludedFolders() {
		const descEl = document.createDocumentFragment();
		new Setting(this.containerEl)

			.setName('Add Excluded Folder')
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip('Add Excluded Folders')
					.setButtonText('+')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.excludedFolders.push({
							path: '',
							withSubfolders: true
						});
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.excludedFolders.forEach((excluded_folder:ExcludedFolder, index:number) => {
			const s = new Setting(this.containerEl)
				.addSearch((cb) => {
					new FolderSuggest3(cb.inputEl, this.app);
					cb.setPlaceholder('Folder')
						.setValue(excluded_folder.path)
						.onChange(async (newFolder) => {
							this.plugin.settings.excludedFolders[index].path = newFolder;
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

	addRules() {
		const descEl = document.createDocumentFragment();
		const ruleDesc = document.createDocumentFragment();
		ruleDesc.append(
			'1. Set the source folder',
			descEl.createEl('br'),
			'2. Set the destination folder.',
			descEl.createEl('br'),
			'3. Create an Dataview WHERE expression that matches the note you want to move. ',
			//descEl.createEl('strong', { text: 'use and(&) or(|) not(!) and parens(()). use [] for values. `example: tag[nohash]&project[myproj]' }),
			descEl.createEl('br'),
			'4. The rules are checked in order from the top. The notes will be moved to the folder with the ',
			descEl.createEl('strong', { text: 'last matching rule.' }),
			descEl.createEl('br'),
			descEl.createEl('br'),
			'Notice:',
			descEl.createEl('br'),
			'1. Attached files will not be moved, but they will still appear in the note.',
			descEl.createEl('br'),
			'2. Note Mover will not move notes that have "',
			descEl.createEl('strong', { text: `${FileExcludedFrontMatterEntryName}: ${getTypedValue<FileExcludedFrontMatterEntry>('disable')}` }),
			'" in the frontmatter.'
		);
		new Setting(this.containerEl)

			.setName('Add new rule')
			.setDesc(ruleDesc)
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
							sourceFolder: {path: '', withSubfolders: true},
							targetFolder: {path: ''},
							filter: '',
						});
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.rules.forEach((rule:Rule, index:number) => {

			const s = new Setting(this.containerEl)

				.addSearch((cb) => {
					new FolderSuggest3(cb.inputEl, this.app);
					cb.setPlaceholder('From folder')
						.setValue(rule.sourceFolder.path)
						.onChange(async (newFolder) => {
							this.plugin.settings.rules[index].sourceFolder.path = newFolder.trim();
							await this.plugin.saveSettings();
						});
				})
				s.addToggle((toggle) => {
					toggle.setValue(rule.sourceFolder.withSubfolders)
						.setTooltip("Source folder with subfolders")
						.onChange(async (value) => {
							this.plugin.settings.rules[index].sourceFolder.withSubfolders = value;
							await this.plugin.saveSettings();
							this.display();
						});
				});
				s.addSearch((cb) => {
					new FolderSuggest3(cb.inputEl, this.app);
					cb.setPlaceholder('To folder')
						.setValue(rule.targetFolder.path)
						.onChange(async (newFolder) => {
							this.plugin.settings.rules[index].targetFolder.path = newFolder.trim();
							await this.plugin.saveSettings();
						});
				})

				.addText((cb) => {
					cb.setPlaceholder('Condition')
						.setValue(rule.filter)
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