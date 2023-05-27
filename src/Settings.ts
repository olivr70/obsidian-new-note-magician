
import { App, ButtonComponent, PluginSettingTab, Setting } from 'obsidian';
import NewNoteMagicianPlugin from "main";
import { arraymove } from './utils/utils';

export const DEFAULT_SETTINGS: NewNoteMagicianSettings = {
    trigger_on_file_creation: true,
    handle_daily_notes: true,
    enable_folder_rules: true,
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
    enable_folder_rules: boolean;
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

        this.add_folder_templates_setting()
	}

    
    add_folder_templates_setting(): void {
        this.containerEl.createEl("h2", { text: "Folder Rules" });

        const descHeading = document.createDocumentFragment();
        descHeading.append(
            "Folder Rules are triggered when a new ",
            descHeading.createEl("strong", { text: "empty " }),
            "file is created and its names matches a regular expression.",
            descHeading.createEl("br"),
            "New note magician will move the new file to the specified folder.",
            descHeading.createEl("br"),
            "The first matching rule is used. ",
            "."
        );

        new Setting(this.containerEl).setDesc(descHeading);

        const descUseNewFileTemplate = document.createDocumentFragment();
        descUseNewFileTemplate.append(
            "When enabled New Note Magician will make use of the folder rules defined below."
        );

        new Setting(this.containerEl)
            .setName("Enable Folder Rules")
            .setDesc(descUseNewFileTemplate)
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.enable_folder_rules)
                    .onChange((use_new_folder_rules) => {
                        this.plugin.settings.enable_folder_rules =
                        use_new_folder_rules;
                        this.plugin.saveSettings();
                        // Force refresh
                        this.display();
                    });
            });

        if (!this.plugin.settings.enable_folder_rules) {
            return;
        }

        new Setting(this.containerEl)
            .setName("Add New")
            .setDesc("Add new folder rule")
            .addButton((button: ButtonComponent) => {
                button
                    .setTooltip("Add additional folder rule")
                    .setButtonText("+")
                    .setCta()
                    .onClick(() => {
                        this.plugin.settings.folder_rules.push({
                            targetFolder: "",
                            fileRegex: "",
                        });
                        this.plugin.saveSettings();
                        this.display();
                    });
            });

        this.plugin.settings.folder_rules.forEach(
            (rule, index) => {
                const s = new Setting(this.containerEl)
                .addText((cb) => {
                    cb.setValue(rule.fileRegex)
                    .setPlaceholder("some regexp")
                     .onChange((newRegex) => {
                        this.plugin.settings.folder_rules[
                            index
                        ].fileRegex = newRegex;
                        this.plugin.saveSettings();
                     })
                })
                .addText((cb) => {
                    cb.setValue(rule.targetFolder)
                    .setPlaceholder("some folder")
                    .onChange((newFolder) => {
                       this.plugin.settings.folder_rules[
                           index
                       ].targetFolder = newFolder;
                       this.plugin.saveSettings();
                    })
                })
                    .addExtraButton((cb) => {
                        cb.setIcon("up-chevron-glyph")
                            .setTooltip("Move up")
                            .onClick(() => {
                                arraymove(
                                    this.plugin.settings.folder_rules,
                                    index,
                                    index - 1
                                );
                                this.plugin.saveSettings();
                                this.display();
                            });
                    })
                    .addExtraButton((cb) => {
                        cb.setIcon("down-chevron-glyph")
                            .setTooltip("Move down")
                            .onClick(() => {
                                arraymove(
                                    this.plugin.settings.folder_rules,
                                    index,
                                    index + 1
                                );
                                this.plugin.saveSettings();
                                this.display();
                            });
                    })
                    .addExtraButton((cb) => {
                        cb.setIcon("cross")
                            .setTooltip("Delete")
                            .onClick(() => {
                                this.plugin.settings.folder_rules.splice(
                                    index,
                                    1
                                );
                                this.plugin.saveSettings();
                                this.display();
                            });
                    });
                s.infoEl.remove();
            }
        );
    }
}