import { App, Editor, EventRef, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile, normalizePath } from 'obsidian';
import { NewNoteMagicianSettings, DEFAULT_SETTINGS, NewNoteMagicianSettingTab, FolderRule } from "src/Settings"


// Remember to rename these classes and interfaces!



export default class NewNoteMagicianPlugin extends Plugin {
	settings: NewNoteMagicianSettings;
    private trigger_on_file_creation_event: EventRef | undefined;

	async onload() {
		await this.loadSettings();



		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new NewNoteMagicianSettingTab(this.app, this));

		this.setup();
	}

    setup(): void {
        app.workspace.onLayoutReady(() => {
            this.update_trigger_file_on_creation();
        });
    }

	update_trigger_file_on_creation() {
        if (this.settings.trigger_on_file_creation) {
            this.trigger_on_file_creation_event = app.vault.on(
                "create",
                (file: TAbstractFile) =>
                    NewNoteMagicianPlugin.on_file_creation(this, file)
            );
            this.registerEvent(this.trigger_on_file_creation_event);
        } else {
            if (this.trigger_on_file_creation_event) {
                app.vault.offref(this.trigger_on_file_creation_event);
                this.trigger_on_file_creation_event = undefined;
            }
        }

	}

	public static async  on_file_creation(plugin:NewNoteMagicianPlugin, file:TAbstractFile) {
		// difficulté
		// a priori, la note est déjà créée à ce moment là, 
		// console.log("NNM: vault root : " + file.vault.getRoot().path)
		if (file instanceof TFile) {
			var selectedRule = plugin.selectRule(file)
			if (selectedRule) {
				// we have a matching rule
				var targetPathInVault = plugin.computeRuleTarget(selectedRule, file);
				console.log("NNM: rule target for " + file.path + " is " + targetPathInVault)
				await plugin.app.fileManager.renameFile(file, targetPathInVault );
				/*

			var movedFile = file.vault.getAbstractFileByPath(newPathInVault);
			if (movedFile != null) {
				// return movedFile;
			} else {
				// this should not happen
			}
				*/
			}
		}
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	addCommands() {
		
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'new-note-magician-move',
			name: 'New note magician: Move to preferred location',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					var currentFile = markdownView.file
					var selectedRule = this.selectRule(currentFile)
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});
	}

	addUserInterface() {
		
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('Welcome in New Note Magician !');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');
	}
	
	// applique une règle 
	ruleTest(rule:FolderRule, file:TAbstractFile ) {
		var regexp = new RegExp(rule.fileRegex);
		var nameMatch = regexp.test(file.name)
		var pathMatch = regexp.test(file.path)
		console.log("NNM : ruleTest for /" + rule.fileRegex + "/")
		console.log("NNM : nameMatch : " + nameMatch );
		console.log("NNM : pathMatch : " + pathMatch ); 
		return regexp.test(file.name) || regexp.test(file.path);
	}

	// Retourne la première règle applicable
	// @returns : la règle applicable, ou null
	selectRule(file:TAbstractFile):FolderRule | null {
		console.log("NNM : select rule for " + file.path ); 
		var result:FolderRule|null = null;
		console.log("NNM : all rules " + this.settings.folder_rules ); 
		for (var rule of this.settings.folder_rules) {
			console.log("NNM : tyr rule " + rule.fileRegex ); 
			if (this.ruleTest(rule, file)) {
				result = rule; 
				break;
			}
		}
		if (result) {
			console.log("NNM : selected rule : " + file.path ); 
		} else {
			console.log("NNM : no applicable rule for : " + file.path ); 
		}
		return result;
	}

	computeRuleTarget(rule:FolderRule, file:TFile) : string {
		var newPath = normalizePath(rule.targetFolder + "/" + file.name);
		return newPath
	}

}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}


