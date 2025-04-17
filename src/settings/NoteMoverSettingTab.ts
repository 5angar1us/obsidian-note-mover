import { App, ButtonComponent, PluginSettingTab, Setting} from "obsidian";
import NoteMover from "../main";
import { arrayMove } from "../utilt";
import { FolderSuggest3 } from "../suggests/folder-suggest3";
import { Caller, ExcludedFolder, FileExcludedFrontMatterEntry, FileExcludedFrontMatterEntryName, getTypedValue, NoteMoverSettings, Rule } from "./settingsTypes";
import { RuleModal } from "./RuleModal";


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
			.setName('Rules Configuration')
			.setDesc(ruleDesc);
	
		new Setting(this.containerEl)
			.setName('Add new rule')
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip('Add new rule')
					.setButtonText('+')
					.setCta()
					.onClick(() => {
						const modal = new RuleModal(this.app, this.plugin, undefined, (newRule) => {
							if (newRule) {
								this.plugin.settings.rules.push(newRule);
								this.plugin.saveSettings();
								this.display();
							}
						});
						modal.open();
					});
			});
	
		this.plugin.settings.rules.forEach((rule, index) => {
			const s = new Setting(this.containerEl)
				.setName(`Rule #${index + 1}`)
				.setDesc(`Source: ${rule.sourceFolder.path} (${rule.sourceFolder.withSubfolders ? 'with subfolders' : 'no subfolders'}) → Target: ${rule.targetFolder.path} | Filter: ${rule.filter}`);
	
			s.addButton((button) => {
				button.setButtonText('Edit')
					.onClick(() => {
						const modal = new RuleModal(this.app, this.plugin, rule, (updatedRule) => {
							if (updatedRule) {
								this.plugin.settings.rules[index] = updatedRule;
								this.plugin.saveSettings();
								this.display();
							}
						});
						modal.open();
					});
			});
	
			s.addExtraButton((cb) => {
				cb.setIcon('up-chevron-glyph')
					.setTooltip('Move up')
					.onClick(async () => {
						arrayMove(this.plugin.settings.rules, index, index - 1);
						await this.plugin.saveSettings();
						this.display();
					});
			});
	
			s.addExtraButton((cb) => {
				cb.setIcon('down-chevron-glyph')
					.setTooltip('Move down')
					.onClick(async () => {
						arrayMove(this.plugin.settings.rules, index, index + 1);
						await this.plugin.saveSettings();
						this.display();
					});
			});
	
			s.addExtraButton((cb) => {
				cb.setIcon('cross')
					.setTooltip('Delete')
					.onClick(async () => {
						this.plugin.settings.rules.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					});
			});
		});
	}


}