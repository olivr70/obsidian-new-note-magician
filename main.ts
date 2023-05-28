import { App, Editor, EventRef, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile, normalizePath } from 'obsidian';
import { NewNoteMagicianSettings, DEFAULT_SETTINGS, NewNoteMagicianSettingTab, FolderRule } from "src/Settings"
import { getPathFile as getPathFilename, getPathParent } from 'src/utils/utils';


// Remember to rename these classes and interfaces!



export default class NewNoteMagicianPlugin extends Plugin {
	settings: NewNoteMagicianSettings;
    private trigger_on_file_creation_event: EventRef | undefined;

	async onload() {
		await this.loadSettings();



		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new NewNoteMagicianSettingTab(this.app, this));
		this.addCommands();

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
				var targetPathInVault = plugin.computeRuleTargetPath(selectedRule, file);
				console.log("NNM: rule target for " + file.path + " is " + targetPathInVault)
				if (targetPathInVault) {
					await plugin.app.fileManager.renameFile(file, targetPathInVault );
				}
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
		var myPlugin = this;	// closure
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
			callback:  async () => {
				// Conditions to check
					console.log("new-note-magician-move")
					var fileIsOK = false;
					const currentFile = this.app.workspace.getActiveFile();
					if (currentFile) {
						console.log("currentFile is " + currentFile.path)
						var preferedPath = this.computePreferedLocation(currentFile);
						console.log("preferedLocation is " + preferedPath)
						var fileIsOK = this.fileIsAtPreferedLocation(currentFile, preferedPath);
						console.log("fileIsOK is " + fileIsOK)
	
						if (!fileIsOK) {
							// we have a currentFile at a wrong location
							try {
								myPlugin.beginTransaction('move "' + currentFile.name + '"')
								// on effectue le mouvement du fichier
								await this.app.fileManager.renameFile(currentFile, preferedPath );
								myPlugin.commitTransaction();
							} catch (ex) {
								myPlugin.rollbackTransaction();
							}
						} else {
							new SampleModal(this.app).open();
						}
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

	// Calcule l'emplacement pour ce fichier en appliquant cette règle
	// ATTENTION : on suppose que les conditions de la règle ont été vérifiées
	computeRuleTargetPath(rule:FolderRule, file:TFile) : string {
		var newPath = normalizePath(rule.targetFolder + "/" + file.name);
		return newPath;
	}

	computePreferedLocation(file:TFile) : string {
		var result : string = file.path
		var rule = this.selectRule(file);
		if (rule) {
			result = this.computeRuleTargetPath(rule, file);
		}
		// always retune a TFile (file itself is no result was obtained)
		return result;
	}

	fileIsAtPreferedLocation(someFile:TFile, preferedLocation: string) {
		console.log(`fileIsAtPreferedLocation for '${someFile.path}'`)
		console.log(`preferedLocation folder ${getPathParent(preferedLocation)}`)
		console.log(`someFile folder ${someFile.parent?.path}`)
		console.log(`preferedLocation filename ${getPathFilename(preferedLocation)}`)
		console.log(`someFile filename ${someFile.name}`)
		var sameParent = (someFile.parent?.path == getPathParent(preferedLocation));
		var sameName = (someFile.name == getPathFilename(preferedLocation))
		return sameParent && sameName;
	}

	async beginTransaction(tname:string) {

	}

	// in the future, it will handle the history of moves, to allow rolling back
	async moveFileToPreferedLocation(file:TFile, preferedLocation:TFile) {
		
		await this.app.fileManager.renameFile(file, preferedLocation.path );
	}
	
	async commitTransaction() {
		
	}
	
	async rollbackTransaction() {
		
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


