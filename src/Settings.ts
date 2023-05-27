
import { App, PluginSettingTab, Setting } from 'obsidian';
import NewNoteMagicianPlugin from "main";

export const DEFAULT_SETTINGS: NewNoteMagicianSettings = {
    trigger_on_file_creation: true,
    handle_daily_notes: true,
    folder_rules: [
        {fileRegex:"20\d\d-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])", targetFolder:"DAILY/"},
        {fileRegex:"person/.*", targetFolder:"PERSONS/"}],
    ask_user_if_no_folder: false,
};

export interface FolderRule {
    fileRegex: string;
    targetFolder: string;
}

export interface NewNoteMagicianSettings {
    trigger_on_file_creation: boolean;
    handle_daily_notes: boolean;
    folder_rules: Array<FolderRule>;
    ask_user_if_no_folder: boolean;
}

export class NewNoteMagicianSettingTab extends PluginSettingTab {
	plugin: NewNoteMagicianPlugin;

	constructor(app: App, plugin: NewNoteMagicianPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for New Note Magician.'});


		new Setting(containerEl)
			.setName('Handle daily notes')
			.setDesc('If a link to a note which names matches the Daily Note format is activated, create it in the Daily Note folder')
			.addToggle(text => text
				.setValue(this.plugin.settings.handle_daily_notes)
				.onChange(async (value) => {
					console.log('New Note Magician setting : handle_daily_notes: ' + value);
					this.plugin.settings.handle_daily_notes = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Ask user if no applicable folder rule')
			.setDesc('If after looking for rules, none has been activated, should the plugin ask the user')
			.addToggle(text => text
				.setValue(this.plugin.settings.ask_user_if_no_folder)
				.onChange(async (value) => {
					console.log('New Note Magician setting : ask_user_if_no_folder: ' + value);
					this.plugin.settings.ask_user_if_no_folder = value;
					await this.plugin.saveSettings();
				}));
	}
}